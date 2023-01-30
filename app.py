from email.policy import default
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta, timezone
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, unset_jwt_cookies, jwt_required, \
	JWTManager, create_refresh_token
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import sys
import jwt

import convertHashToCords

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder='client/build', static_url_path='')

"""
https://blog.miguelgrinberg.com/post/how-to-deploy-a-react--flask-project
https://dashboard.heroku.com/apps/marching-band-app/settings
https://stackoverflow.com/questions/65888631/how-do-i-use-heroku-postgres-with-my-flask-sqlalchemy-app
https://towardsdatascience.com/deploy-a-micro-flask-application-into-heroku-with-postgresql-database-d95fd0c19408
"""

ENV = "dev"

if ENV == 'dev':
	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
else:
	app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://kjsknarefmtswq:067909a25be5d30e96fd2ecf47f2ef34cc869897895e6130d2ec0b2b5540b577@ec2-44-207-253-50.compute-1.amazonaws.com:5432/d6tgv8eb79479i"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SECRET_KEY'] = 'your secret key'
app.config['JWT_TOKEN_LOCATION'] = ["headers", "query_string"]
app.config["JWT_SECRET_KEY"] = "please-remember-to-change-me"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
app.config["JWT_QUERY_STRING_NAME"] = "token"

db = SQLAlchemy(app)
migrate = Migrate(app, db)
ma = Marshmallow(app)
api = Api(app)
jwt = JWTManager(app)
admin = Admin(app, name='Dot Check Deck', template_mode='bootstrap3')

CORS(app)

# flask db migrate -m "message"
# flask db upgrade

class Dot(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	set_id = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	show_user_id = db.Column(db.Integer, db.ForeignKey('show_user.id'), nullable=False)

	# Data
	direction = db.Column(db.String(16))
	line = db.Column(db.String(16))
	steps = db.Column(db.Float)
	side = db.Column(db.Integer)
	fb_steps = db.Column(db.Float)
	fb_direction = db.Column(db.String(16))
	use_hash = db.Column(db.String(32))

	def __repr__(self):
		return f"Dot({self.id})"

	def __str__(self):
		return f"Dot({self.id})"


class SetName(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	set_id = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	section_id = db.Column(db.Integer, db.ForeignKey('band_section.id'), nullable=False)

	# Data
	name = db.Column(db.String(32), default="default")

	def __repr__(self):
		return f"SetName({self.name})"

	def __str__(self):
		return f"SetName({self.name})"


class Set(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	set_names = db.relationship('SetName', backref='set')
	dots = db.relationship('Dot', backref='set')


	# Data
	set_numb = db.Column(db.String(8), nullable=False)
	measure = db.Column(db.String(16))
	counts = db.Column(db.Integer, nullable=False)
	start_time_code = db.Column(db.Integer)
	end_time_code = db.Column(db.Integer)
	showIndex = db.Column(db.Integer, nullable=False, default=-1)

	def __repr__(self):
		return f"Set({self.set_numb})"

	def __str__(self):
		return f"Set({self.set_numb})"


class BandSection(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	show_users = db.relationship('ShowUser', backref='band_section')
	set_names = db.relationship('SetName', backref='band_section')

	# Data
	name = db.Column(db.String(32), default="default")
	color_r = db.Column(db.Integer)
	color_g = db.Column(db.Integer)
	color_b = db.Column(db.Integer)

	def __repr__(self):
		return f"BandSection({self.name})"

	def __str__(self):
		return f"BandSection({self.name})"


class ShowUser(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	section_id = db.Column(db.Integer, db.ForeignKey('band_section.id'))
	dots = db.relationship('Dot', backref='show_user')

	# Data
	symbol = db.Column(db.String(16))
	label = db.Column(db.String(16))
	is_section_leader = db.Column(db.Boolean, default=False)

	def __repr__(self):
		return f"ShowUser({self.symbol}{self.label})"

	def __str__(self):
		return f"ShowUser({self.symbol}{self.label})"


class User(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_users = db.relationship('ShowUser', backref='user')

	# Data
	email = db.Column(db.String(128), unique=True)
	password_hash = db.Column(db.String(128))
	first_name = db.Column(db.String(64))
	last_name = db.Column(db.String(64))

	is_admin = db.Column(db.Boolean, default=False)

	activated_date = db.Column(db.DateTime, default=None, nullable=True)
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)

	# Methods
	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

	def __repr__(self):
		return f"User({self.email})"

	def __str__(self):
		return f"User({self.email})"


class Show(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	show_users = db.relationship('ShowUser', backref='show')
	sets = db.relationship('Set', backref='show')
	dots = db.relationship('Dot', backref='show')
	band_sections = db.relationship('BandSection', backref='show')
	set_names = db.relationship('SetName', backref='show')
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)

	# Data
	code = db.Column(db.String(8), unique=True)

	# GENERATE CODE!!!
	def generateCode(self) -> str:
		# self.code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
		self.code = "12345678"
		return self.code

	def __repr__(self):
		return f"Show({self.code})"

	def __str__(self):
		return f"Show({self.code})"


class School(db.Model):
	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	shows = db.relationship('Show', backref='school')
	users = db.relationship('User', backref='school')

	show_users = db.relationship('ShowUser', backref='school')
	sets = db.relationship('Set', backref='school')
	dots = db.relationship('Dot', backref='school')
	band_sections = db.relationship('BandSection', backref='school')
	set_names = db.relationship('SetName', backref='school')

	# default_show = db.Column(db.Integer, db.ForeignKey('show.id'))

	# Data
	name = db.Column(db.String(256))
	email = db.Column(db.String(128))

	def __repr__(self):
		return f"School({self.name})"

	def __str__(self):
		return f"School({self.name})"


# Serializers
class DotSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "show_id", "set_id", "show_user_id", "direction", "line",
			"steps", "side", "fb_steps", "fb_direction", "use_hash"
		)
		"""

		model = Dot
		include_fk = True
		load_instance = True


class SetNameSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		# fields = ("id", "name", "setID", "schoolID", "sectionID")
		model = SetName
		include_fk = True
		load_instance = True


class SetSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		fields = ("id", "set_numb", "measure", "counts", "setNames", "start_time_code", "end_time_code")
		model = Set
	
	setNames = ma.Nested(SetNameSchema)


class UserSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "symbol", "label", 
			"firstName", "lastName", "email", 
			"is_admin", "is_section_leader", "section"
			"activated_date", "created_date", "last_updated"
		)
		"""
		model = User
		include_fk = True
		load_instance = True


class ShowUserSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "symbol", "label", 
			"firstName", "lastName", "email", 
			"is_admin", "is_section_leader", "section"
			"activated_date", "created_date", "last_updated"
		)
		"""
		model = ShowUser
		include_fk = True
		load_instance = True


dot_schema = DotSchema()
dots_schema = DotSchema(many=True)
set_schema = SetSchema()
sets_schema = SetSchema(many=True)
user_schema = UserSchema()
users_schema = UserSchema(many=True)
show_user_schema = ShowUserSchema()
show_users_schema = ShowUserSchema(many=True)


admin.add_view(ModelView(Dot, db.session))
admin.add_view(ModelView(SetName, db.session))
admin.add_view(ModelView(Set, db.session))
admin.add_view(ModelView(ShowUser, db.session))
admin.add_view(ModelView(User, db.session))
admin.add_view(ModelView(BandSection, db.session))
admin.add_view(ModelView(Show, db.session))
admin.add_view(ModelView(School, db.session))


# API

@app.route('/token', methods=["POST"])
def create_token():
	email = request.json.get("email", None)
	password = request.json.get("password", None)

	user = User.query.filter_by(email=email).first()

	if not user:
		# user = User(email=email, password=password, name="Max Miller")
		# db.session.add(user)
		# db.session.commit()
		return {"msg": "Wrong email or password"}, 401

	if not user.check_password(password):
		return {"msg": "Wrong email or password"}, 401

	access_token = create_access_token(identity=email)
	refresh_token = create_refresh_token(identity=email)

	userSchool = School.query.filter(School.id == user.school_id).first()
	schoolCode = ""
	if userSchool is not None:
		userShow = Show.query.filter(Show.school_id == userSchool.id).first()
		if userShow is not None:
			schoolCode = userShow.code

	response = {
		"access_token": access_token, 
		"refresh_token": refresh_token, 
		"user": user_schema.dump(user),
		"school_code": schoolCode
	}
	return response


@app.route('/refresh-token', methods=["POST"])
@jwt_required(refresh=True)
def refresh_expiring_jwts():
	identity = get_jwt_identity()
	access_token = create_access_token(identity=identity)
	return jsonify(access_token=access_token)


@app.route('/get-token', methods=["POST"])
@jwt_required(refresh=True)
def get_jwt():
	try:
		identity = get_jwt_identity()
		access_token = create_access_token(identity=get_jwt_identity())
		user = User.query.filter_by(email=identity).first()

		userString = ""
		schoolCode = ""
		if user is not None:
			userString = user_schema.dump(user)

			userSchool = School.query.filter(School.id == user.school_id).first()
			if userSchool is not None:
				userShow = Show.query.filter(Show.school_id == userSchool.id).first()
				if userShow is not None:
					schoolCode = userShow.code

		response = {"access_token": access_token, "user": userString, "school_code": schoolCode}
		# print(response)
		return response, 202
	except (RuntimeError, KeyError):
		# Case where there is not a valid JWT. Just return the original respone
		return "", 401


@app.route("/logout", methods=["POST"])
def logout():
	response = jsonify({"msg": "logout successful"})
	unset_jwt_cookies(response)
	return response


# Serve Images
@app.route('/get-audio')
def send_report():
	# identity = get_jwt_identity()
	# user = User.query.filter_by(email=identity).first()

	# if user is None: 
	# 	return "Invalid Token", 401

	# TODO: GET DYNAMIC SHOW FILE FROM SCHOOL OBJ

	return send_from_directory('static', "steampunk.mp3")


class SetListResource(Resource):
	@jwt_required()
	def get(self):
		setNumb = request.args.get('set_id', None)
		measure = request.args.get('measure', None)
		schoolCode = request.args.get('school_code', None) # TODO: Change name to show_code

		# REQUIRE A SCHOOL CODE
		if schoolCode is None:
			return "Missing School Code", 404

		# CHECK IF CODE IS VALID
		show = Show.query.filter(Show.code == schoolCode).first()
		if show is None:
			return "INVALID SHOW CODE", 404

		if setNumb is not None and measure is not None:
			sets = Set.query.filter(Set.set_numb == setNumb, Set.measure == measure, Set.show_id == show.id).all()
		elif setNumb is not None:
			sets = Set.query.filter(Set.set_numb == setNumb, Set.show_id == show.id).all()
		elif measure is not None:
			sets = Set.query.filter(Set.measure == measure, Set.show_id == show.id).all()
		else:
			sets = Set.query.filter(Set.show_id == show.id).all()

		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()
		
		if showUser.section_id is not None:
			loggedInUserSection = BandSection.query.filter(BandSection.id == showUser.section_id).first()
		else:
			loggedInUserSection = None

		setsOutput = list()

		for set in sets:
			setName = "Undefined"

			if loggedInUserSection is not None:
				setNameObj = SetName.query.filter(SetName.section_id == loggedInUserSection.id, SetName.set_id == set.id).first()
				if setNameObj is not None:
					setName = setNameObj.name

			schema = set_schema.dump(set)
			schema["setName"] = setName # TODO: Refactor to "set_name"
			
			setsOutput.append(schema)

		print(setsOutput)

		return setsOutput


class SchoolCodeAuthResource(Resource):
	def post(self):
		# TODO: Refactor to "show_code"
		if "school_code" not in request.json:
			return "Missing School Code param", 404

		# Attempt to load the School with that code
		show = Show.query.filter(Show.code == request.json['school_code']).first()

		# Check to see if we got a school obj
		if show is None:
			return "INVALID SCHOOL CODE", 404
		
		school = School.query.filter(School.id == show.school_id).first()
		
		users = ShowUser.query.filter(ShowUser.show_id == show.id).all()

		
		return {"name": school.name, "users": show_users_schema.dump(users), "email": school.email}, 200


# To allow a user to setup their credentials, as by default they cannot login
class SetUpUserResource(Resource):
	# REQUIRES: {
	#   "school_code": "12345678", "label": "d7",
	#   "email": "mmiller5@uhigh.illinoisstate.edu",
	#   "password": "Password12345",
	#   "first_name": "Max", "last_name": "Miller"
	# }
	"""
    fetch('http://127.0.0.1:5000/users/activate', {
        method: 'POST',
        body: JSON.stringify({
            school_code: '12345678',
            label: 'd7',
            email: "mmiller5@uhigh.illinoisstate.edu", 
            password: "Password12345", 
            first_name: "Max", 
            last_name: "Miller"
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
        })
        .then(res => res.json())
        .then(console.log)
    """
	def post(self):
		# TODO: Refactor to "show_code"
		if "school_code" not in request.json or request.json['school_code'] == "":
			return "Missing School Code", 404
		if "label" not in request.json or request.json['label'] == "":
			return "Missing Label", 404
		if "email" not in request.json or request.json['email'] == "":
			return "Missing Email", 404
		if "password" not in request.json or request.json['password'] == "":
			return "Missing Password", 404
		if "first_name" not in request.json or request.json['first_name'] == "":
			return "Missing First Name", 404
		if "last_name" not in request.json or request.json['last_name'] == "":
			return "Missing Last Name", 404

		# Attempt to load the Show with that code
		show = Show.query.filter(Show.code == request.json['school_code']).first()

		# Check to see if we got a school obj
		if show is None:
			return "INVALID SCHOOL CODE", 404
		


		# Find users that fit the params,
		# it's possible for multiple users to have the same label so we have to do this for now.
		showUsers = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.label == request.json['label']).all()
		print(showUsers)

		if len(showUsers) > 1:
			return "Multiple Users found for that query, INTERNAL SERVER ERROR!", 402
		if len(showUsers) != 1:
			return "No users found with that school_id and label"

		user = showUsers[0].user

		if user.activated_date is not None:
			return "User has already been activated", 404

		user.email = request.json["email"]
		user.first_name = request.json["first_name"]
		user.last_name = request.json["last_name"]
		user.activated_date = datetime.datetime.now()

		user.set_password(request.json["password"])

		db.session.add(user)
		db.session.commit()

		return "Successfully activated user", 201


def getSetIndex(sets, middleSet) -> int:
	for x in range(len(sets)):
		if sets[x].set_numb == middleSet:
			return x
	return -1


def getSectionColor(userObj) -> list:
	userSection = BandSection.query.filter(BandSection.id == userObj.section_id).first()

	if userSection is None:
		return 0, 0, 0
	
	return userSection.colorR, userSection.colorG, userSection.colorB


class GetDotsWithBufferResource(Resource):
	@jwt_required()
	def get(self):
		schoolCode = request.args.get('school_code', None)
		width = int(request.args.get('width', 1500))
		height = int(request.args.get('height', 800))
		middleSet = request.args.get('set', "1")
		bufferSize = int(request.args.get('buffer', 4))

		# REQUIRE A SCHOOL CODE
		if schoolCode is None:
			return "Missing School Code", 404

		# Attempt to load the Show with that code
		show = Show.query.filter(Show.code == schoolCode).first()

		# Check to see if we got a school obj
		if show is None:
			return "INVALID SCHOOL CODE", 404

		sets = Set.query.filter(Set.show_id == show.id).all()

		# TODO: GET ORDER HERE

		if middleSet == "undefined":
			middleSet = "1"

		searchSetIndex = getSetIndex(sets, middleSet)

		if searchSetIndex == -1:
			print("INVALID MIDDLE SET!")
			return "INVALID MIDDLE SET PARM", 404

		startIndex = 0
		endIndex = len(sets) - 1
		if searchSetIndex - bufferSize > 0:
			startIndex  = searchSetIndex - bufferSize
		if searchSetIndex + bufferSize < len(sets):
			endIndex  = searchSetIndex + bufferSize

		# var to store all of the sets
		output = []

		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()
		loggedInUserSection = BandSection.query.filter(BandSection.id == showUser.section_id).first()

		print("WEEEE!")

		for i in range(startIndex, endIndex + 1):

			set = sets[i]
			dots = Dot.query.filter(Dot.set_id == set.id).all()
			
			setName = ""
			if loggedInUserSection is not None:
				setNameObj = SetName.query.filter(SetName.section_id == loggedInUserSection.id, SetName.set_id == set.id).first()

				if setNameObj is not None:
					setName = setNameObj.name

			dotCords = []

			for dot in dots:
				x, y = convertHashToCords.convertHashToCords(
					dot.direction, dot.line, dot.steps,
					dot.side, dot.fb_steps, dot.fb_direction,
					dot.use_hash, width=width, height=height
				)

				showUserObj = ShowUser.query.filter(ShowUser.id == dot.show_user_id).first()
				userObj = User.query.filter(User.id == showUserObj.user_id).first()
				r, g, b = getSectionColor(showUserObj)

				dotCords.append({
					'x': x, 'y': y, 'dot': dot_schema.dump(dot),

					'counts': set.counts,
					
					"r": r, "g": g, "b": b,
					
					"userLabel": showUserObj.label, "userID": showUserObj.id,
					"userName": f"{userObj.first_name} {userObj.last_name}",
				})
			
			output.append({
				'setID': set.id,
				'setNumb': set.set_numb,
				'setName': setName,
				'counts': set.counts,
				'start_time_code': set.start_time_code,
				'end_time_code': set.end_time_code,
				'index': i,
				'dots': dotCords
			})
		
		return output


class UpdateSetResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		show = Show.query.filter(Show.school_id == loggedInUser.school.id).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()

		if not loggedInUser.is_admin and not showUser.is_section_leader:
			return "Unauthorized", 401

		parser = reqparse.RequestParser()
		parser.add_argument('id', type=int, default=None, required=True, help="You must include the ID of the set")
		parser.add_argument('set_numb', type=str, default=None)
		parser.add_argument('measure', type=str, default=None)
		parser.add_argument('counts', type=str, default=None)
		parser.add_argument('start_time_code', type=str, default=None)
		parser.add_argument('end_time_code', type=str, default=None)
		args = parser.parse_args()

		id = args.get('id')
		setNumb = args.get('set_numb')
		measure = args.get('measure')
		counts = args.get('counts')
		start_time_code = args.get('start_time_code')
		end_time_code = args.get('end_time_code')

		set = Set.query.filter(Set.id == id).first()

		if set is None:
			return "Invalid Set ID", 404

		if setNumb is not None:
			set.set_numb = setNumb
		if measure is not None:
			set.measure = measure
		if counts is not None:
			set.counts = counts
		if start_time_code is not None:
			set.start_time_code = start_time_code
		if end_time_code is not None:
			set.end_time_code = end_time_code
		
		db.session.commit()

		return "Updated Successfully", 201


class UpdateSetsResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		show = Show.query.filter(Show.school_id == loggedInUser.school.id).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()

		if not loggedInUser.is_admin and not showUser.is_section_leader:
			return "Unauthorized", 401

		data = json.loads(request.data)

		for _set in data["data"]:
			set = Set.query.filter(Set.id == _set["id"]).first()

			set.set_numb = _set["setNumb"]
			set.measure = _set["measure"]
			set.counts = _set["counts"]
			set.start_time_code = _set["start_time_code"]
			set.end_time_code = _set["end_time_code"]

		
			db.session.commit()

		return "Updated Successfully", 201


api.add_resource(SetListResource, '/sets')
api.add_resource(SchoolCodeAuthResource, '/school-code-auth')
api.add_resource(SetUpUserResource, '/users/activate')
api.add_resource(GetDotsWithBufferResource, '/get-dots')
api.add_resource(UpdateSetResource, '/update-set')
api.add_resource(UpdateSetsResource, '/update-sets')


# For use to build database
# TODO: Move to an API call
def addAllDataFromPDF(file):
	import pdfReader

	stuff = pdfReader.pdfReader(file)

	if len(School.query.all()) == 0:
		school = School(name="U-High", email="max@benmiller.com")
		db.session.add(school)
		db.session.commit()

		show = Show(school_id=school.id)
		show.generateCode()

		db.session.add(show)
		db.session.commit()
	else:
		school = School.query.first()
		show = Show.query.filter(Show.school_id == school.id).first()

	# print(stuff[34])
	for dotSheet in stuff:
		firstShowUser = ShowUser.query.filter(ShowUser.label == dotSheet.label, ShowUser.show_id == show.id).first()

		if firstShowUser is None:
			user = User(school_id = school.id)
			db.session.add(user)
			db.session.commit()

			showUser = ShowUser(
				school_id = school.id,
				show_id = show.id, 
				user_id = user.id,
				symbol=dotSheet.symbol,
				label = dotSheet.label
			)
			db.session.add(showUser)
			db.session.commit()
		else:
			showUser = firstShowUser
			user = firstShowUser.user

		for dot in dotSheet.dots:
			if Set.query.filter(Set.set_numb==dot.setNumb, Set.show_id==show.id).first() is None:
				_set = Set(set_numb=dot.setNumb, measure=dot.measure, counts=dot.counts, school_id=school.id, show_id=show.id)
				db.session.add(_set)
				db.session.commit()
			else:
				_set = Set.query.filter(Set.set_numb==dot.setNumb, Set.show_id==show.id).first()
			print(f"Adding dot: '{dot}' to DATABASE [SET {_set.set_numb}]")
			_dot = Dot(
				set_id=_set.id, show_user_id=showUser.id, direction=str(dot.direction),
				line=str(dot.line), steps=float(dot.steps), side=int(dot.side), fb_steps=float(dot.fbSteps),
				fb_direction=str(dot.fbDirection), use_hash=str(dot.useHash), school_id=school.id, show_id = show.id
			)
			db.session.add(_dot)
			db.session.commit()



if __name__ == "__main__":
	rebuild = False

	for i, arg in enumerate(sys.argv):
		if arg == "rebuild":
			rebuild = True

			if (input("Are you sure want to rebuild (y/n)?:  ") == "y"):
				print("REBUILDING!\r\n")

				with app.app_context():

					# Delete the database
					db.drop_all()
					db.create_all()

					# Read these dot sheets
					addAllDataFromPDF("Mvt-1and2.pdf")
					addAllDataFromPDF("Mvt-3.pdf")
					addAllDataFromPDF("Mvt-4.pdf")

					print("\r\nDONE.")

			break


	# from GUITest import GUITest
	# GUITest(1125, 600)

	if not rebuild:
		# Available Externally on LAN
		# app.run(debug=True, host="0.0.0.0")
		# Use Default Config
		app.run(debug=True)
