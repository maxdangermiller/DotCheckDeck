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
import urllib.parse 
import string
import random

import convertHashToCords

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder='client/build', static_url_path='')

"""
https://blog.miguelgrinberg.com/post/how-to-deploy-a-react--flask-project
https://dashboard.heroku.com/apps/marching-band-app/settings
https://stackoverflow.com/questions/65888631/how-do-i-use-heroku-postgres-with-my-flask-sqlalchemy-app
https://towardsdatascience.com/deploy-a-micro-flask-application-into-heroku-with-postgresql-database-d95fd0c19408
"""

# WEBSITE_HOSTNAME exists only in production environment
if 'WEBSITE_HOSTNAME' not in os.environ:
	# local development, where we'll use environment variables
	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
else:
    # production
	print("Loading config.production from production.py")
	app.config.from_object('production')

	app.config.update(
		SQLALCHEMY_DATABASE_URI=app.config.get('DATABASE_URI'),
		SQLALCHEMY_TRACK_MODIFICATIONS=False,
	)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SECRET_KEY'] = 'bfvgjubwirvbwiruevwiulhreoiheiuvbuq'
app.config['JWT_TOKEN_LOCATION'] = ["headers", "query_string"]
app.config["JWT_SECRET_KEY"] = "uvjnwiruviuwfvbkswbnekjqbnkjubniurniofjqewainion"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
app.config["JWT_QUERY_STRING_NAME"] = "token"

""""
Database auth
dcd_admin
fS3StNPK4LW269f
"""

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
		return f"Dot({self.show_user_id} ->{self.id})"

	def __str__(self):
		return f"Dot({self.show_user_id} ->{self.id})"


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
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
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
	name = db.Column(db.String(256), default="NO NAME")

	# Tracking database updates
	last_update = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)

	# GENERATE CODE!!!
	def generateCode(self) -> str:
		# TODO: Make sure this is unique so there isn't an error!
		self.code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
		# self.code = "12345678"
		return self.code

	def changeUpdateTime(self):
		print("UPDATE!!!!!!", datetime.datetime.now())
		self.last_update = datetime.datetime.now()

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
		model = Set
		include_fk = True
		load_instance = True
	
	setNames = ma.Nested(SetNameSchema)


class ShowSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = Show
		include_fk = True
		load_instance = True	

class SchoolSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = School
		include_fk = True
		load_instance = True
		load_relationships = True

class BandSectionSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = BandSection
		include_fk = True
		load_instance = True
		load_relationships = True

	set_names = ma.Nested(SetNameSchema)


class ShowUserSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = ShowUser
		include_fk = True
		load_instance = True
		load_relationships = True
	
	show = ma.Nested(ShowSchema)


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
		include_relationships = True
		load_instance = True

		exclude = ("password_hash",)
	
	show_users = ma.Nested(ShowUserSchema, many=True)


dot_schema = DotSchema()
dots_schema = DotSchema(many=True)
set_schema = SetSchema()
sets_schema = SetSchema(many=True)
user_schema = UserSchema()
users_schema = UserSchema(many=True)
show_user_schema = ShowUserSchema()
show_users_schema = ShowUserSchema(many=True)
show_schema = ShowSchema()
shows_schema = ShowSchema(many=True)
school_schema = SchoolSchema()
band_sections_schema = BandSectionSchema(many=True)
set_names_schema = SetNameSchema(many=True)


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

	userString = {}
	showString = {}
	schoolCode = ""
	if user is not None:
		userString = user_schema.dump(user)

		userSchool = School.query.filter(School.id == user.school_id).first()
		if userSchool is not None:
			userShow = Show.query.filter(Show.school_id == userSchool.id).first() # TODO: Change from defaulting with the first show

			if userShow is not None:
				schoolCode = userShow.code

				showUser = ShowUser.query.filter(ShowUser.show_id == userShow.id, ShowUser.user_id == user.id).first()
				if showUser is not None:
					showString = show_user_schema.dump(showUser)

	response = {
		"access_token": access_token, 
		"refresh_token": refresh_token, 
		"user": mergeJsonDicts(userString, showString),
		"school_code": schoolCode
	}
	return response


@app.route('/refresh-token', methods=["POST"])
@jwt_required(refresh=True)
def refresh_expiring_jwts():
	identity = get_jwt_identity()
	access_token = create_access_token(identity=identity)
	return jsonify(access_token=access_token)


def mergeJsonDicts(a, b):
	merged_dict = {}

	for key, val in a.items():
		merged_dict[key] = val

	for key, val in b.items():
		if key not in merged_dict:
			merged_dict[key] = val

	# string dump of the merged dict
	return merged_dict



@app.route('/get-token', methods=["POST"])
@jwt_required(refresh=True)
def get_jwt():
	try:
		identity = get_jwt_identity()
		access_token = create_access_token(identity=get_jwt_identity())
		user = User.query.filter_by(email=identity).first()

		userString = {}
		showString = {}
		schoolCode = ""
		if user is not None:
			userString = user_schema.dump(user)

			userSchool = School.query.filter(School.id == user.school_id).first()
			if userSchool is not None:
				userShow = Show.query.filter(Show.school_id == userSchool.id).first() # TODO: Change from defaulting with the first show

				if userShow is not None:
					schoolCode = userShow.code

					showUser = ShowUser.query.filter(ShowUser.show_id == userShow.id, ShowUser.user_id == user.id).first()
					if showUser is not None:
						showString = show_user_schema.dump(showUser)

		response = {"access_token": access_token, "user": mergeJsonDicts(userString, showString), "school_code": schoolCode}
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
def send_music():
	# identity = get_jwt_identity()
	# user = User.query.filter_by(email=identity).first()

	# if user is None: 
	# 	return "Invalid Token", 401

	# TODO: GET DYNAMIC SHOW FILE FROM SCHOOL OBJ

	return send_from_directory('static', "steampunk.mp3")


def allowed_file(filename):
    ALLOWED_EXTENSIONS = ['pdf']
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS


def addShowFileToDatabase(file, school, show):
	import pdfReader

	stuff = pdfReader.pdfReader(file)

	for dotSheet in stuff:
		firstShowUser = ShowUser.query.filter(ShowUser.label == dotSheet.label, ShowUser.show_id == show.id).first()

		if firstShowUser is None:
			# TODO: Creating a new user object for each show user 
			# will probably cause problems with activate because emails are unique
			# user = User(school_id = school.id)
			# db.session.add(user)
			# db.session.commit()

			showUser = ShowUser(
				school_id = school.id,
				show_id = show.id, 
				user_id = None,
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


@app.route('/upload-show', methods=['POST'])
@jwt_required()
def upload_file():
	identity = get_jwt_identity()
		
	activeUser = User.query.filter(User.email == identity).first()

	if not activeUser.is_admin:
		return "INVALID AUTHORIZATION", 401
	
	# Get School
	school = School.query.filter(School.id == activeUser.school_id).first()

	if school is None:
		return "INVALID SCHOOL", 401
	
	# Check Show Name
	showName = request.form.get("show-name")
	if showName is None:
		return "Missing Show Name!", 400
	
	# Create new show object
	show = Show(school_id=school.id, name=showName)
	show.generateCode()
	db.session.add(show)
	db.session.commit()	

	# Check PDFs
	for fileKey in request.files:
		file = request.files[fileKey]
		if len(fileKey) > 8 and fileKey[:8] == "pdf-file" and allowed_file(file.filename):
			fileLocation = "./showPDFs/" + file.filename
			file.save(fileLocation)
			addShowFileToDatabase(fileLocation, school, show)

	return "Success!", 200


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
			sets = Set.query.filter(Set.set_numb == setNumb, Set.measure == measure, Set.show_id == show.id).order_by(Set.showIndex).all()
		elif setNumb is not None:
			sets = Set.query.filter(Set.set_numb == setNumb, Set.show_id == show.id).order_by(Set.showIndex).order_by(Set.showIndex).all()
		elif measure is not None:
			sets = Set.query.filter(Set.measure == measure, Set.show_id == show.id).order_by(Set.showIndex).order_by(Set.showIndex).all()
		else:
			sets = Set.query.filter(Set.show_id == show.id).order_by(Set.showIndex).order_by(Set.showIndex).all()

		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()
		
		if showUser is not None and showUser.section_id is not None:
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
			schema["set_name"] = setName
			
			setsOutput.append(schema)

		return setsOutput


class SchoolCodeAuthResource(Resource):
	def post(self):
		# TODO: Refactor to "show_code"
		if "school_code" not in request.json:
			return "Missing School Code param", 404

		# Attempt to load the Show with that code
		show = Show.query.filter(Show.code == request.json['school_code']).first()

		# Check to see if we got a show obj
		if show is None:
			return "INVALID SCHOOL CODE", 404
		
		school = School.query.filter(School.id == show.school_id).first()
		
		users = ShowUser.query.filter(ShowUser.show_id == show.id).all()
		filteredUsers = []
		for showUser in users:
			if showUser.user_id is None:
				filteredUsers.append(showUser)
			else:
				user = User.query.filter(User.id == showUser.user_id).first()
				if user.activated_date is None:
					filteredUsers.append(showUser)

		
		return {"schoolName": school.name, "name": show.name, "users": show_users_schema.dump(filteredUsers), "email": school.email}, 200


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

		if len(showUsers) > 1:
			return "Multiple Users found for that query, INTERNAL SERVER ERROR!", 402
		if len(showUsers) != 1:
			return "No users found with that school_id and label"

		# Try and find a matching user
		user = User.query.filter(User.email == request.json["email"]).first()
		if user is not None:
			showUsers[0].user_id = user.id
			db.session.commit()

			return "User has already been activated", 200
		
		user = User(school_id = show.school_id)
		db.session.add(user)
		db.session.commit()

		showUsers[0].user_id = user.id
		db.session.commit()

		user.email = request.json["email"]
		user.first_name = request.json["first_name"]
		user.last_name = request.json["last_name"]
		user.activated_date = datetime.datetime.now()

		user.set_password(request.json["password"])

		db.session.add(user)

		# There has been a change made to the show's date, 
		# so we must change the "last update time" var in the show object
		show.changeUpdateTime()  

		db.session.commit()

		return "Successfully activated user", 201


def getSetIndex(sets, middleSet) -> int:
	for x in range(len(sets)):
		if sets[x].set_numb == middleSet:
			return sets[x].showIndex
	return -1


def getSetByShowIndex(sets, index):
	for set in sets:
		if set.showIndex == index:
			return set
	return None


def getSectionColor(userObj) -> list:
	userSection = BandSection.query.filter(BandSection.id == userObj.section_id).first()

	if userSection is None:
		return 0, 0, 0
	
	return userSection.color_r, userSection.color_g, userSection.color_b


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

		# Get with order
		sets = Set.query.filter(Set.show_id == show.id).order_by(Set.showIndex).all()

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
		
		if showUser is not None:
			loggedInUserSection = BandSection.query.filter(BandSection.id == showUser.section_id).first()
		else:
			loggedInUserSection = None

		for i in range(startIndex, endIndex + 1):
			set = getSetByShowIndex(sets, i)
			dots = Dot.query.filter(Dot.set_id == set.id).all()
			
			setName = ""
			if loggedInUserSection is not None:
				setNameObj = SetName.query.filter(
					SetName.section_id == loggedInUserSection.id, 
					SetName.set_id == set.id
				).first()

				if setNameObj is not None:
					setName = setNameObj.name

			dotCords = []

			for dot in dots:
				showUserObj = ShowUser.query.filter(ShowUser.id == dot.show_user_id).first()
				userObj = User.query.filter(User.id == showUserObj.user_id).first()
				userName = ""
				if userObj is not None:
					userName = f"{userObj.first_name} {userObj.last_name}"
					
				r, g, b = getSectionColor(showUserObj)

				dotCords.append({
					'dot': dot_schema.dump(dot),

					'counts': set.counts,
					
					"r": r, "g": g, "b": b,
					
					"userLabel": showUserObj.label, "userID": showUserObj.id,
					"userName": userName,
					"section_id": showUserObj.section_id,
				})
			
			output.append({
				'setID': set.id,
				'setNumb': set.set_numb,
				'setName': setName,
				'counts': set.counts,
				'start_time_code': set.start_time_code,
				'end_time_code': set.end_time_code,
				'index': i,
				'dots': dotCords,
				'update_timestamp': str(show.last_update)
			})
		
		return output


class UpdateSetResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		show = Show.query.filter(Show.school_id == loggedInUser.school.id).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()

		if not loggedInUser.is_admin:
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
		
		# There has been a change made to the show's date, 
		# so we must change the "last update time" var in the show object
		show.changeUpdateTime()  

		db.session.commit()

		return "Updated Successfully", 201


class UpdateSetsResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		show = Show.query.filter(Show.school_id == loggedInUser.school.id).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()

		if not loggedInUser.is_admin:
			return "Unauthorized", 401

		data = json.loads(request.data)

		for _set in data["data"]:
			set = Set.query.filter(Set.id == _set["id"]).first()

			set.set_numb = _set["set_numb"]
			set.measure = _set["measure"]
			set.counts = _set["counts"]
			set.start_time_code = _set["start_time_code"]
			set.end_time_code = _set["end_time_code"]

		
			# There has been a change made to the show's date, 
			# so we must change the "last update time" var in the show object
			show.changeUpdateTime() 

			db.session.commit()

		return "Updated Successfully", 201


class UpdateUserResource(Resource):
	@jwt_required()
	def post(self):
		"""
		{
			"email":"max@benmiller.com",
			"last_name":"Miller",
			"activated_date":"2023-01-27T14:07:42",
			"school_id":1,
			"show_users":[{
				"label":"d7",
				"symbol":"!",
				"school_id":1,
				"show_id":1,
				"user_id":71,
				"id":71,
				"section_id":5,
				"is_section_leader":true
			}],
			"id":71,
			"last_updated":"2023-01-27T14:07:43",
			"is_admin":true,
			"school":1,
			"first_name":"Max",
			"created_date":"2023-01-27T13:49:35"
		}
		"""
		identity = get_jwt_identity()
		
		activeUser = User.query.filter(User.email == identity).first()

		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401

		parser = reqparse.RequestParser()
		parser.add_argument('id', type=int, default=None, required=True, help="You must include the ID of the set")
		parser.add_argument('email', type=str, default=None, required=True)
		parser.add_argument('first_name', type=str, default=None, required=True)
		parser.add_argument('last_name', type=str, default=None, required=True)
		parser.add_argument('is_admin', type=bool, default=None, required=True)
		args = parser.parse_args()
		
		user = User.query.filter(User.id == args.get('id')).first()

		if user is None:
			return "INVALID USER ID", 404

		user.email = args.get('email')
		user.first_name = args.get('first_name')
		user.last_name = args.get('last_name')
		user.is_admin = args.get('is_admin')

		for show in json.loads(request.data)["show_users"]:
			showUser = ShowUser.query.filter(ShowUser.id == show["id"]).first()

			showUser.label = show["label"]
			showUser.symbol = show["symbol"]
			showUser.is_section_leader = show["is_section_leader"]
			showUser.section_id = show["section_id"]

			db.session.commit()

			# There has been a change made to the show's date, 
			# so we must change the "last update time" var in the show object
			Show.query.filter(Show.id == showUser.show_id).first().changeUpdateTime()
		
		db.session.commit()

		return "Success", 201


class CreateUserResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		
		activeUser = User.query.filter(User.email == identity).first()

		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401

		parser = reqparse.RequestParser()
		parser.add_argument('email', type=str, default=None, required=True)
		parser.add_argument('password', type=str, default=None, required=True)
		parser.add_argument('first_name', type=str, default=None, required=True)
		parser.add_argument('last_name', type=str, default=None, required=True)
		parser.add_argument('is_admin', type=bool, default=None, required=True)
		args = parser.parse_args()
		
		user = User.query.filter(User.email == args.get('email')).first()

		if user is not None:
			return "USER ALREADY EXISTS", 404

		newUser = User(
			email = args.get('email'),
			first_name = args.get('first_name'),
			last_name = args.get('last_name'),
			school_id = activeUser.school_id,
			is_admin = args.get('is_admin')
		)

		newUser.activated_date = datetime.datetime.now()
		newUser.set_password(args.get('password'))

		db.session.add(newUser)
		db.session.commit()

		return "Successfully Created User", 201


class GetDatabaseResource(Resource):
	@jwt_required()
	def get(self):
		"""
		1) Users
		2) Sections
		3) Set Names
		4) Show
		5) School
		"""
		identity = get_jwt_identity()
		
		activeUser = User.query.filter(User.email == identity).first()

		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401
		
		# Get School
		school = School.query.filter(School.id == activeUser.school_id).first()

		# Get Users + Show Users
		users = User.query.filter(User.school_id == activeUser.school_id).all()

		# Get Shows
		shows = Show.query.filter(Show.school_id == school.id).all()

		# Get Sections
		sections = BandSection.query.filter(BandSection.school_id == school.id).all()
		sections_data = band_sections_schema.dump(sections)
		
		for section in sections_data:
			section["set_names"] = set_names_schema.dump(SetName.query.filter(SetName.section_id == section["id"]).all())

		# Get Sets + set names
		sets = Set.query.filter(Set.school_id == school.id).order_by(Set.showIndex).all()

		return {
			"school": school_schema.dump(school),
			"sections": sections_data,
			"sets": sets_schema.dump(sets),
			"shows": shows_schema.dump(shows),
			"users": users_schema.dump(users)
		}


class UpdateOrCreateSetNameResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		
		activeUser = User.query.filter(User.email == identity).first()

		if activeUser is None: 
			return "INVALID AUTHORIZATION", 401

		parser = reqparse.RequestParser()
		parser.add_argument('id', type=int, default=None, required=True, help="You must include the ID of the set")
		parser.add_argument('set_name', type=str, default=None, required=True, help="You must include the Set Name")
		args = parser.parse_args()

		setName = SetName.query.filter(SetName.set_id == args.get("id")).first()

		# Get School
		school_id = activeUser.school_id
		# Get Set
		set = Set.query.filter(Set.id == args.get("id")).first()
		set_id = set.id
		# Get Show
		show_id = set.show_id
		# Get Section
		showUser = ShowUser.query.filter(ShowUser.show_id == show_id, ShowUser.user_id == activeUser.id).first()
		section_id = showUser.section_id

		if not showUser.is_section_leader and not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401

		if (setName is None):
			setName = SetName(
				school_id=school_id, 
				set_id = set_id, 
				show_id = show_id, 
				section_id = section_id, 
				name = args.get("set_name")
			)
			db.session.add(setName)
		else:
			setName.name = args.get("set_name")
		
		# There has been a change made to the show's date, 
		# so we must change the "last update time" var in the show object
		Show.query.filter(Show.id == show_id).first().changeUpdateTime()

		db.session.commit()

		return "Done.", 201


class UpdateSectionResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()

		activeUser = User.query.filter(User.email == identity).first()

		if activeUser is None: 
			return "INVALID AUTHORIZATION", 401
		
		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401

		parser = reqparse.RequestParser()
		parser.add_argument('id', type=int, default=None, required=True, help="You must include the ID of the set")
		parser.add_argument('name', type=str, default=None, required=True, help="You must include the Name")
		parser.add_argument('color_r', type=int, default=None, required=True, help="You must include the Color")
		parser.add_argument('color_g', type=int, default=None, required=True, help="You must include the Color")
		parser.add_argument('color_b', type=int, default=None, required=True, help="You must include the Color")
		args = parser.parse_args()

		section = BandSection.query.filter(BandSection.id == args.get("id"), BandSection.school_id == activeUser.school_id).first()

		if section is None:
			return "Invalid ID", 404
		
		section.name = args.get("name")
		section.color_r = args.get("color_r")
		section.color_g = args.get("color_g")
		section.color_b = args.get("color_b")

		# There has been a change made to the show's date, 
		# so we must change the "last update time" var in the show object
		Show.query.filter(Show.id == section.show_id).first().changeUpdateTime()  

		db.session.commit()


		return "Updated Successfully!", 201


class UpdateSetNameResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()

		activeUser = User.query.filter(User.email == identity).first()

		if activeUser is None: 
			return "INVALID AUTHORIZATION", 401
		
		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401

		parser = reqparse.RequestParser()
		parser.add_argument('set_id', type=int, default=None, required=True, help="You must include the ID of the set")
		parser.add_argument('show_id', type=int, default=None, required=True, help="You must include the ID of the show")
		parser.add_argument('section_id', type=int, default=None, required=True, help="You must include the ID of the section")
		parser.add_argument('name', type=str, default=None, required=True, help="You must include the Name")
		args = parser.parse_args()

		print(args.get("name"))

		setName = SetName.query.filter(
			SetName.set_id == args.get("set_id"), 
			SetName.section_id == args.get("section_id")
		).first()

		if (setName is None):
			setName = SetName(
				school_id=activeUser.school_id, 
				set_id = args.get("set_id"), 
				show_id = args.get("show_id"), 
				section_id = args.get("section_id"), 
				name = args.get("name")
			)
			db.session.add(setName)

			# There has been a change made to the show's date, 
			# so we must change the "last update time" var in the show object
			Show.query.filter(Show.id == args.get("show_id")).first().changeUpdateTime()  

			db.session.commit()
			return "Created Successfully.", 201
		else:
			setName.name = args.get("name")

			# There has been a change made to the show's date, 
			# so we must change the "last update time" var in the show object
			Show.query.filter(Show.id == args.get("show_id")).first().changeUpdateTime()  

			db.session.commit()

			return "Updated Successfully.", 202


class GetLastUpdateResource(Resource):
	@jwt_required()
	def get(self):
		schoolCode = request.args.get('school_code', None) # TODO: Change name to show_code

		# REQUIRE A SCHOOL CODE
		if schoolCode is None:
			return "Missing School Code", 404

		# CHECK IF CODE IS VALID
		show = Show.query.filter(Show.code == schoolCode).first()
		if show is None:
			return "INVALID SHOW CODE", 404

		return {"timestamp": str(show.last_update)}, 200



api.add_resource(SetListResource, '/sets')
api.add_resource(SchoolCodeAuthResource, '/school-code-auth')
api.add_resource(SetUpUserResource, '/users/activate')
api.add_resource(GetDotsWithBufferResource, '/get-dots')
api.add_resource(UpdateSetResource, '/update-set')
api.add_resource(UpdateSetsResource, '/update-sets')
api.add_resource(UpdateUserResource, '/users')
api.add_resource(CreateUserResource, '/create-user')
api.add_resource(GetDatabaseResource, '/get-all')
api.add_resource(UpdateOrCreateSetNameResource, '/update-set-name')
api.add_resource(UpdateSectionResource, '/update-section')
api.add_resource(UpdateSetNameResource, '/update-set-name-admin')
api.add_resource(GetLastUpdateResource, '/database-version')



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

		if arg == "build" and 'WEBSITE_HOSTNAME' in os.environ:
			with app.app_context():
				os.system("apt update")
				os.system("apt install default-jdk")

				# Delete the database
				db.drop_all()
				db.create_all()

				if input("Would you like to create a school with that (y/n)?:  ") != "y":
					break
				schoolName = input("School Name: ")
				schoolEmail = input("School Email: ")

				school = School(name=schoolName, email=schoolEmail)
				db.session.add(school)
				db.session.commit()

				if input("Would you like to create an admin account with that (y/n)?") != "y":
					break

				user = User(
					school_id = school.id, 
					email = input("Email: "),
					first_name = input("First Name: "),
					last_name = input("Last Name: "),
					activated_date = datetime.datetime.now(),
					is_admin = True
				)

				user.set_password(input("Password: "))

				db.session.add(user)
				db.session.commit()



		# Some database configuration, idk what tbh
		if arg == "stuff":
			print("Doing stuff!")
			rebuild = True
			with app.app_context():
				show = Show.query.filter().first()
				sets = Set.query.filter(Set.show_id == show.id).order_by(Set.id).all()
				for set in sets:
					set.showIndex = set.id - 1

					db.session.commit()


	# from GUITest import GUITest
	# GUITest(1125, 600)

	if not rebuild:
		# Available Externally on LAN
		# app.run(debug=True, host="0.0.0.0")
		# Use Default Config
		app.run(debug=True)

"""
AFTER DEPLOY COMMANDS TO INSTALL JAVA

apt update
apt install default-jdk
apt install software-properties-common
add-apt-repository ppa:linuxuprising/java
apt update
apt install oracle-java11-installer
"""