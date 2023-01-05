from email.policy import default
from flask import Flask, request, jsonify
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
	setID = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	userID = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	schoolID = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)

	direction = db.Column(db.String(16))
	line = db.Column(db.String(16))

	steps = db.Column(db.Float)
	side = db.Column(db.Integer)
	fbSteps = db.Column(db.Float)
	fbDirection = db.Column(db.String(16))
	useHash = db.Column(db.String(32))

	def __repr__(self):
		return f"Dot({self.setID})"


class SetName(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	setID = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	schoolID = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	sectionID = db.Column(db.Integer, db.ForeignKey('band_section.id'), nullable=False)

	name = db.Column(db.String(32), default="default")

	def __str__(self) -> str:
		return f"Set Name - {self.name} | SetID:{self.setID}"

	def __repr__(self) -> str:
		return f"Set Name - {self.name} | SetID:{self.setID}"


class Set(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	# showIndex = db.Column(db.Integer, nullable=False, default=-1)
	schoolID = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)

	setNumb = db.Column(db.String(8), nullable=False)
	measure = db.Column(db.String(16))
	counts = db.Column(db.Integer, nullable=False)

	setNames = db.relationship('SetName', backref='set')
	dots = db.relationship('Dot', backref='set')

	start_time_code = db.Column(db.Integer)
	end_time_code = db.Column(db.Integer)
	

	def __str__(self):
		return f"Set {self.setNumb}"

	def __repr__(self):
		return f"Set {self.setNumb}"


class User(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	schoolID = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	symbol = db.Column(db.String(16))
	label = db.Column(db.String(16))
	email = db.Column(db.String(128), unique=True)
	password_hash = db.Column(db.String(128))
	firstName = db.Column(db.String(64))
	lastName = db.Column(db.String(64))

	is_admin = db.Column(db.Boolean, default=False)
	is_section_leader = db.Column(db.Boolean, default=False)
	
	section = db.Column(db.Integer, db.ForeignKey('band_section.id'))

	dots = db.relationship('Dot', backref='user')

	activated_date = db.Column(db.DateTime, default=None, nullable=True)
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)

	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

	def __str__(self) -> str:
		return f"User {self.firstName} {self.lastName} | {self.symbol} | {self.label}"

	def __repr__(self) -> str:
		return f"User {self.firstName} {self.lastName} | {self.symbol} | {self.label}"


class BandSection(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	schoolID = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	users = db.relationship('User', backref='bandSection')
	setNames = db.relationship('SetName', backref='bandSection')
	

	name = db.Column(db.String(32), default="default")
	colorR = db.Column(db.Integer)
	colorG = db.Column(db.Integer)
	colorB = db.Column(db.Integer)

	def __str__(self) -> str:
		return f"Band Section - {self.name}"

	def __repr__(self) -> str:
		return f"Band Section - {self.name}"


class School(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	code = db.Column(db.String(8), unique=True)
	name = db.Column(db.String(256))
	email = db.Column(db.String(128))

	# permissions = db.relationship('Permissions', backref='school')
	users = db.relationship('User', backref='school')
	sets = db.relationship('Set', backref='school')
	dots = db.relationship('Dot', backref='school')
	bandSections = db.relationship('BandSection', backref='school')
	setNames = db.relationship('SetName', backref='school')

	# GENERATE CODE!!!
	def generateCode(self) -> str:
		# self.code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
		self.code = "12345678"
		return self.code

	def __str__(self) -> str:
		return f"{self.name} School"

	def __repr__(self) -> str:
		return f"{self.name} School"


# Serializers
class DotSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "set", "userID", "direction", "line",
			"steps", "side", "fbSteps", "fbDirectsion", "useHash"
		)
		"""

		model = Dot
		include_fk = True
		load_instance = True


class SetNameSchema(ma.Schema):
	class Meta:
		fields = ("id", "name", "setID", "schoolID", "sectionID")
		model = SetName


class SetSchema(ma.Schema):
	class Meta:
		fields = ("id", "setNumb", "measure", "counts", "setNames", "start_time_code", "end_time_code")
		model = Set
	
	setNames = ma.Nested(SetNameSchema)



class UserSchema(ma.Schema):
	class Meta:
		fields = (
			"id", "symbol", "label", 
			"firstName", "lastName", "email", 
			"is_admin", "is_section_leader", "section"
			"activated_date", "created_date", "last_updated"
		)
		model = User


dot_schema = DotSchema()
dots_schema = DotSchema(many=True)
set_schema = SetSchema()
sets_schema = SetSchema(many=True)
user_schema = UserSchema()
users_schema = UserSchema(many=True)


admin.add_view(ModelView(Dot, db.session))
admin.add_view(ModelView(SetName, db.session))
admin.add_view(ModelView(Set, db.session))
admin.add_view(ModelView(User, db.session))
admin.add_view(ModelView(BandSection, db.session))
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

	userSchool = School.query.filter(School.id == user.schoolID).first()
	schoolCode = ""
	if userSchool is not None:
		schoolCode = userSchool.code

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

			userSchool = School.query.filter(School.id == user.schoolID).first()
			if userSchool is not None:
				schoolCode = userSchool.code

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


class SetListResource(Resource):
	@jwt_required()
	def get(self):
		setNumb = request.args.get('set_id', None)
		measure = request.args.get('measure', None)
		schoolCode = request.args.get('school_code', None)

		# REQUIRE A SCHOOL CODE
		if schoolCode is None:
			return "Missing School Code", 404

		# CHECK IF CODE IS VALID
		school = School.query.filter(School.code == schoolCode).first()
		if school is None:
			return "INVALID SCHOOL CODE", 404

		if setNumb is not None and measure is not None:
			sets = Set.query.filter(Set.setNumb == setNumb, Set.measure == measure, Set.schoolID == school.id).all()
		elif setNumb is not None:
			sets = Set.query.filter(Set.setNumb == setNumb, Set.schoolID == school.id).all()
		elif measure is not None:
			sets = Set.query.filter(Set.measure == measure, Set.schoolID == school.id).all()
		else:
			sets = Set.query.filter(Set.schoolID == school.id).all()

		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		loggedInUserSection = BandSection.query.filter(BandSection.id == loggedInUser.section).first()

		setsOutput = list()

		for set in sets:
			setNameObj = SetName.query.filter(SetName.sectionID == loggedInUserSection.id, SetName.setID == set.id).first()

			setName = "Undefined"
			if setNameObj is not None:
				setName = setNameObj.name

			schema = set_schema.dump(set)
			schema["setName"] = setName
			
			setsOutput.append(schema)

		return setsOutput


class SchoolCodeAuthResource(Resource):
	def post(self):
		if "school_code" not in request.json:
			return "Missing School Code param", 404

		# Attempt to load the School with that code
		school = School.query.filter(School.code == request.json['school_code']).first()

		# Check to see if we got a school obj
		if school is None:
			return "INVALID SCHOOL CODE", 404
		
		users = User.query.filter(User.schoolID == school.id, User.email == None)

		
		return {"name": school.name, "users": users_schema.dump(users), "email": school.email}, 200


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

		# Attempt to load the School with that code
		school = School.query.filter(School.code == request.json['school_code']).first()

		# Check to see if we got a school obj
		if school is None:
			return "INVALID SCHOOL CODE", 404

		# Find users that fit the params,
		# it's possible for multiple users to have the same label so we have to do this for now.
		users = User.query.filter(
			User.schoolID == school.id,
			User.label == request.json['label']
		).all()
		print(users)

		if len(users) > 1:
			return "Multiple Users found for that query, INTERNAL SERVER ERROR!", 402
		if len(users) != 1:
			return "No users found with that school_id and label"

		user = users[0]

		if user.activated_date is not None:
			return "User has already been activated", 404

		user.email = request.json["email"]
		user.firstName = request.json["first_name"]
		user.lastName = request.json["last_name"]
		user.activated_date = datetime.datetime.now()

		user.set_password(request.json["password"])

		db.session.add(user)
		db.session.commit()

		return "Successfully activated user", 201


def getSetIndex(sets, middleSet) -> int:
	for x in range(len(sets)):
		if sets[x].setNumb == middleSet:
			return x
	return -1


def getSectionColor(userObj) -> list:
	userSection = BandSection.query.filter(BandSection.id == userObj.section).first()

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

		# CHECK IF CODE IS VALID
		school = School.query.filter(School.code == schoolCode).first()
		if school is None:
			return "INVALID SCHOOL CODE", 404

		sets = Set.query.filter(Set.schoolID == school.id).all()

		# TODO: GET ORDER HERE

		searchSetIndex = getSetIndex(sets, middleSet)

		if searchSetIndex == -1:
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
		loggedInUserSection = BandSection.query.filter(BandSection.id == loggedInUser.section).first()

		for i in range(startIndex, endIndex + 1):

			set = sets[i]
			dots = Dot.query.filter(Dot.setID == set.id)
			
			setNameObj = SetName.query.filter(SetName.sectionID == loggedInUserSection.id, SetName.setID == set.id).first()

			setName = ""
			if setNameObj is not None:
				setName = setNameObj.name

			dotCords = []

			for dot in dots:
				x, y = convertHashToCords.convertHashToCords(
					dot.direction, dot.line, dot.steps,
					dot.side, dot.fbSteps, dot.fbDirection,
					dot.useHash, width=width, height=height
				)

				userObj = User.query.filter(User.id == dot.userID, User.schoolID == school.id).first()
				r, g, b = getSectionColor(userObj)

				dotCords.append({
					'x': x, 'y': y, 'dot': dot_schema.dump(dot),

					'counts': set.counts,
					
					"r": r, "g": g, "b": b,
					
					"userLabel": userObj.label, "userID": userObj.id,
					"userName": f"{userObj.firstName} {userObj.lastName}",
				})
			
			output.append({
				'setID': set.id,
				'setNumb': set.setNumb,
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

		if not loggedInUser.is_admin and not loggedInUser.is_section_leader:
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
			set.setNumb = setNumb
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

		if not loggedInUser.is_admin and not loggedInUser.is_section_leader:
			return "Unauthorized", 401

		data = json.loads(request.data)

		for _set in data["data"]:
			set = Set.query.filter(Set.id == _set["id"]).first()

			set.setNumb = _set["setNumb"]
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
		school.generateCode()
		db.session.add(school)
		db.session.commit()
	else:
		school = School.query.first()

	# print(stuff[34])
	for dotSheet in stuff:
		if User.query.filter(User.label==dotSheet.label, User.schoolID==school.id).first() is None:
			user = User(label=dotSheet.label, schoolID=school.id, symbol=dotSheet.symbol)
			db.session.add(user)
			db.session.commit()
		else:
			user = User.query.filter(User.label==dotSheet.label, User.schoolID==school.id).first()

		for dot in dotSheet.dots:
			if Set.query.filter(Set.setNumb==dot.setNumb, Set.schoolID==school.id).first() is None:
				_set = Set(setNumb=dot.setNumb, measure=dot.measure, counts=dot.counts, schoolID=school.id)
				db.session.add(_set)
				db.session.commit()
			else:
				_set = Set.query.filter(Set.setNumb==dot.setNumb, Set.schoolID==school.id).first()
			print(f"Adding dot: '{dot}' to DATABASE [SET {_set.setNumb}]")
			_dot = Dot(
				setID=_set.id, userID=user.id, direction=str(dot.direction),
				line=str(dot.line), steps=float(dot.steps), side=int(dot.side), fbSteps=float(dot.fbSteps),
				fbDirection=str(dot.fbDirection), useHash=str(dot.useHash), schoolID=school.id
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
		app.run(debug=True, host="0.0.0.0")
