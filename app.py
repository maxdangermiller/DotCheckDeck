from email.policy import default
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_restful import Api, Resource
from flask_cors import CORS, cross_origin
import datetime
import random
import string
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os

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
	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
ma = Marshmallow(app)
api = Api(app)
CORS(app)


class Dot(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	setID = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	userID = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
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


class Set(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	schoolID = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	setNumb = db.Column(db.String(8), nullable=False)
	measure = db.Column(db.String(16))
	counts = db.Column(db.Integer, nullable=False)

	def __str__(self):
		return f"<Set {self.setNumb}>"

	def __repr__(self):
		return f"<Set {self.setNumb}>"


class Users(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	schoolID = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	symbol = db.Column(db.String(16))
	label = db.Column(db.String(16))
	email = db.Column(db.String(128), unique=True)
	password_hash = db.Column(db.String(128))
	firstName = db.Column(db.String(64))
	lastName = db.Column(db.String(64))

	activated_date = db.Column(db.DateTime, default=None, nullable=True)
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)

	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

	def __str__(self) -> str:
		return f"<User {self.firstName} {self.lastName} > {self.symbol} {self.label}>"

	def __repr__(self) -> str:
		return f"<User {self.firstName} {self.lastName} > {self.symbol} {self.label}>"


class School(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	code = db.Column(db.String(8), unique=True)
	name = db.Column(db.String(256))
	email = db.Column(db.String(128))

	# GENERATE CODE!!!
	def generateCode(self) -> str:
		# self.code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
		self.code = "12345678"
		return self.code

	def __str__(self) -> str:
		return f"<School {self.name}>"

	def __repr__(self) -> str:
		return f"<School {self.name}>"


# Uncomment when resetting the database
db.create_all()


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


class SetSchema(ma.Schema):
	class Meta:
		fields = ("id", "setNumb", "measure", "counts")
		model = Set


class UsersSchema(ma.Schema):
	class Meta:
		fields = ("id", "symbol", "label", "firstName", "lastName", "email")
		model = Users


dot_schema = DotSchema()
dots_schema = DotSchema(many=True)
set_schema = SetSchema()
sets_schema = SetSchema(many=True)
user_schema = UsersSchema()
users_schema = UsersSchema(many=True)


# API

class DotListResource(Resource):
	def get(self):
		setNumb = request.args.get('set_numb', None)
		userID = request.args.get('user_id', None)
		print(userID)

		if setNumb is not None and userID is not None:
			dots = Dot.query.filter(Dot.setID == setNumb, Dot.userID == userID).all()
		elif setNumb is not None:
			dots = Dot.query.filter(Dot.setID == setNumb).all()
		elif userID is not None:
			dots = Dot.query.filter(Dot.userID == userID).all()
		else:
			dots = Dot.query.all()

		return dots_schema.dump(dots)


class SetListResource(Resource):
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

		return sets_schema.dump(sets)


class UsersListResource(Resource):
	# Dynamic Option: https://blog.mindee.com/flask-sqlalchemy/
	def get(self):
		users = Users.query.all()

		return users_schema.dump(users)


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
		if "school_code" not in request.json:
			return "Missing School Code param", 404
		if "label" not in request.json:
			return "Missing Label param", 404
		if "email" not in request.json:
			return "Missing Email param", 404
		if "password" not in request.json:
			return "Missing Password param", 404
		if "first_name" not in request.json:
			return "Missing First Name param", 404
		if "last_name" not in request.json:
			return "Missing Last Name param", 404

		# Attempt to load the School with that code
		school = School.query.filter(School.code == request.json['school_code']).first()

		# Check to see if we got a school obj
		if school is None:
			return "INVALID SCHOOL CODE", 404

		# Find users that fit the params,
		# it's possible for multiple users to have the same label so we have to do this for now.
		users = Users.query.filter(
			Users.schoolID == school.id,
			Users.label == request.json['label']
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


class CordListResource(Resource):
	def get(self):
		setNumb = request.args.get('set_numb', None)
		userID = request.args.get('user_id', None)
		schoolCode = request.args.get('school_code', None)
		width = int(request.args.get('width', 1500))
		height = int(request.args.get('height', 800))
		# print(userID)

		# REQUIRE A SCHOOL CODE
		if schoolCode is None:
			return "Missing School Code", 404

		# CHECK IF CODE IS VALID
		school = School.query.filter(School.code == schoolCode).first()
		if school is None:
			return "INVALID SCHOOL CODE", 404

		if setNumb is not None and userID is not None:
			setObj = Set.query.filter(Set.setNumb == setNumb, Set.schoolID == school.id).first()
			if setObj is None:
				return "INVALID SET ID", 404

			dots = Dot.query.filter(Dot.setID == setObj.id, Dot.userID == userID, Dot.schoolID == school.id).all()
		elif setNumb is not None:
			setObj = Set.query.filter(Set.setNumb == setNumb, Set.schoolID == school.id).first()
			if setObj is None:
				return "INVALID SET ID", 404

			dots = Dot.query.filter(Dot.setID == setObj.id, Dot.schoolID == school.id).all()
		elif userID is not None:
			dots = Dot.query.filter(Dot.userID == userID, Dot.schoolID == school.id).all()
		else:
			dots = Dot.query.filter(Dot.schoolID == school.id).all()

		output = list()

		for dot in dots:
			x, y = convertHashToCords.convertHashToCords(
				dot.direction, dot.line, dot.steps,
				dot.side, dot.fbSteps, dot.fbDirection,
				dot.useHash, width=width, height=height
			)

			person = Users.query.filter(Users.id == dot.userID, Users.schoolID == school.id).first()

			dotData = dot_schema.dump(dot)
			dotData["set"] = set_schema.dump(Set.query.filter(Set.id == dotData["setID"]).first())

			output.append({
				"x": x, "y": y,
				"userLabel": person.label,
				"userID": person.id,
				"userName": f"{person.firstName} {person.lastName}",
				"r": 0, "g": 0, "b": 255,
				"dot": dotData
			})

		return {"pts": output}


class PathsListResource(Resource):
	def get(self):
		setNumb1 = request.args.get('set_numb_1', "1")
		setNumb2 = request.args.get('set_numb_2', None)
		userID = request.args.get('user_id', None)
		schoolCode = request.args.get('school_code', None)
		width = int(request.args.get('width', 1500))
		height = int(request.args.get('height', 800))
		# print(userID)

		# REQUIRE A SCHOOL CODE
		if schoolCode is None:
			return "Missing School Code", 404

		# CHECK IF CODE IS VALID
		school = School.query.filter(School.code == schoolCode).first()
		if school is None:
			return "INVALID SCHOOL CODE", 404

		if setNumb2 is None:
			tempSet1 = Set.query.filter(Set.setNumb == setNumb1, Set.schoolID == school.id).first()
			if tempSet1 is None:
				return "INVALID SET NUMB!", 404
			nextSet = Set.query.filter(Set.id == tempSet1.id + 1, Set.schoolID == school.id).first()
			print(nextSet)
			if nextSet is None:
				return "NO MORE SETS AFTER THIS!"
			setNumb2 = nextSet.setNumb
		# print(School.query.filter(School.id == tempSet1.schoolID).first().code)

		if setNumb1 is not None and userID is not None:
			setObj = Set.query.filter(Set.setNumb == setNumb1, Set.schoolID == school.id).first()
			dots1 = Dot.query.filter(Dot.setID == setObj.id, Dot.userID == userID, Dot.schoolID == school.id).all()
		elif setNumb1 is not None:
			setObj = Set.query.filter(Set.setNumb == setNumb1, Set.schoolID == school.id).first()
			dots1 = Dot.query.filter(Dot.setID == setObj.id, Dot.schoolID == school.id).all()
		else:
			dots1 = Dot.query.filter(Dot.schoolID == school.id).all()

		lines = list()

		for dot in dots1:
			x, y = convertHashToCords.convertHashToCords(
				dot.direction, dot.line, dot.steps,
				dot.side, dot.fbSteps, dot.fbDirection,
				dot.useHash, width=width, height=height
			)

			person = Users.query.filter(Users.id == dot.userID, Users.schoolID == school.id).first()

			setObj = Set.query.filter(Set.setNumb == setNumb2, Set.schoolID == school.id).first()
			nextDot = Dot.query.filter(Dot.setID == setObj.id, Dot.userID == person.id, Dot.schoolID == school.id).first()
			# print(nextDot)
			if nextDot is not None:
				x2, y2 = convertHashToCords.convertHashToCords(
					nextDot.direction, nextDot.line, nextDot.steps,
					nextDot.side, nextDot.fbSteps, nextDot.fbDirection,
					nextDot.useHash, width=width, height=height
				)

				# Test here for if it's a follow the leader or straight line path
				lines.append({
					"startX": x, "startY": y, "endX": x2, "endY": y2,
					"userLabel": person.label, "userID": person.id,
					"r": 0, "g": 0, "b": 0
				})
			else:
				x2 = 0
				y2 = 0

		return {"lines": lines, "paths": []}


api.add_resource(DotListResource, '/dots')
api.add_resource(SetListResource, '/sets')
api.add_resource(UsersListResource, '/users')
api.add_resource(SetUpUserResource, '/users/activate')
api.add_resource(CordListResource, '/cords')
api.add_resource(PathsListResource, '/paths')


# For use to build database
# TODO: Move to an API call
def addAllDataFromPDF(file):
	import pdfReader

	stuff = pdfReader.pdfReader(file)

	if len(School.query.all()) == 0:
		school = School(name="U-High")
		school.generateCode()
		db.session.add(school)
		db.session.commit()
	else:
		school = School.query.first()

	# print(stuff[34])
	for dotSheet in stuff:
		if Users.query.filter_by(symbol=dotSheet.symbol, label=dotSheet.label).first() is None:
			user = Users(symbol=dotSheet.symbol, label=dotSheet.label, schoolID=school.id)
			db.session.add(user)
			db.session.commit()
		else:
			user = Users.query.filter_by(symbol=dotSheet.symbol, label=dotSheet.label).first()

		for dot in dotSheet.dots:
			if Set.query.filter_by(setNumb=dot.setNumb, schoolID=school.id).first() is None:
				_set = Set(setNumb=dot.setNumb, measure=dot.measure, counts=dot.counts, schoolID=school.id)
				db.session.add(_set)
				db.session.commit()
			else:
				_set = Set.query.filter_by(setNumb=dot.setNumb, schoolID=school.id).first()
			print(f"Adding dot: '{dot}' to DATABASE [SET {_set.setNumb}]")
			_dot = Dot(
				setID=_set.id, userID=user.id, direction=str(dot.direction),
				line=str(dot.line), steps=float(dot.steps), side=int(dot.side), fbSteps=float(dot.fbSteps),
				fbDirection=str(dot.fbDirection), useHash=str(dot.useHash), schoolID=school.id
			)
			db.session.add(_dot)
			db.session.commit()


if __name__ == "__main__":
	# addAllDataFromPDF("Mvt-1and2.pdf")
	# addAllDataFromPDF("Mvt-3.pdf")
	# addAllDataFromPDF("Mvt-4.pdf")

	# from GUITest import GUITest
	# GUITest(1125, 600)

	app.run(debug=True)
