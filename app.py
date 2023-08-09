from email.policy import default
from flask import Flask, request, jsonify, send_from_directory, session, abort, redirect, render_template
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
from azure.communication.email import EmailClient
import json
import os
import sys
import string
import random
import math
from cryptography.fernet import Fernet

import storage

# TODO: Redis Queue
# from rq import Queue
# from rq.job import Job
# from worker import conn

from cache import regions, CacheableMixin, query_callable

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder='client/build', static_url_path='')

# WEBSITE_HOSTNAME exists only in production environment
if 'WEBSITE_HOSTNAME' not in os.environ:
	# local development, where we'll use environment variables
	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
	storage_obj = storage.LocalStorageClient()
else:
	# production
	print("Loading config.production from production.py")
	app.config.from_object('production')

	storage_obj = storage.CloudStorageClient()

	app.config.update(
		SQLALCHEMY_DATABASE_URI=app.config.get('DATABASE_URI'),
		SQLALCHEMY_TRACK_MODIFICATIONS=False,
	)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SECRET_KEY'] = 'bfvgjubwirvbwiruevwiulhreoiheiuvbuq'
app.config['JWT_TOKEN_LOCATION'] = ["headers", "query_string"]
app.config["JWT_SECRET_KEY"] = "uvjnwiruviuwfvbkswbnekjqbnkjubniurniofjqewainion"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
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
# TODO: queue = Queue(connection=conn)

CORS(app)

verify_key = b'm1cfKgmOA07WEUVdK5BJqm2QW5pX5y8ms8aRezyzd3Q='

forgot_password_code_reference = [
	{
		'user_id': 1, 
		'key': b'm3J1zT8k7x1qLIAWav6bh_nUIIogtCvZx1AfaTDd4zk=', 
		'code': 'gAAAAABkojhltp2_uHsfD434r5wrDOd8PIHTtX5vL1lTIsxMUAWs1kC0DbrdGrLpRucBwy8Av-hWtJNtqkjugcu_G-vSc9LPMw=='
	}
]

invite_user_code_reference = [
	{
		'email': 'mmiller5@ilstu.edu', 
		'is_admin': True, 
		'school_id': 1, 
		'key': b'tPaI-qvguNgg-Ha0pQwQKjamnfEhI4o9gDPN1ky8shI=', 
		'code': 'gAAAAABkpflSIxncRf0nzYS1mzSvLe5TLIty8xZZsAJ27aLmtXtRfM-rHGadMoKcbjcLiXIt2TQ1_okqLY7PsuZ1sE-J6HgtQhAzsSwgtkOH9ICVROvHUq4='
	}
]
	

# Create the EmailClient object that you use to send Email messages.
email_client = EmailClient.from_connection_string("endpoint=https://email-parent.communication.azure.com/;accesskey=hBpt4vHJOD0O8QsK2i/lGXcMylyQRUsyuIh9hEy1c0V8swtD4t2YnKjdGtLEhA37wC9QvBGczlYfyuD5ynA0Pw==")


# flask db revision --rev-id e39d16e62810
# flask db init
# flask db migrate -m "message"
# flask db upgrade

def generateUpdateCode() -> int:
	return random.randint(0, math.pow(2, 31) - 1)	


class Dot(CacheableMixin, db.Model):
	cache_label = "dot"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	set_id = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	show_user_id = db.Column(db.Integer, db.ForeignKey('show_user.id'), nullable=False)
	dot_icon_id = db.Column(db.Integer, db.ForeignKey('dot_icon.id'), nullable=True)

	# Data
	direction = db.Column(db.String(16))
	line = db.Column(db.String(16))
	steps = db.Column(db.Float)
	side = db.Column(db.Integer)
	fb_steps = db.Column(db.Float)
	fb_direction = db.Column(db.String(16))
	use_hash = db.Column(db.String(32))

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"Dot({self.show_user_id} ->{self.id})"

	def __str__(self):
		return f"Dot({self.show_user_id} ->{self.id})"


class DotIcon(CacheableMixin, db.Model):
	cache_label = "dot_icon"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	dots = db.relationship('Dot', cascade="all,delete", backref='dot_icon')

	# Data
	width_in_steps = db.Column(db.Integer, default=1)
	hight_in_steps = db.Column(db.Integer, default=1)

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def get_svg_file_path(self) -> str:
		return f"static/{self.show_id}/{self.id}.svg"
	
	def save_svg(self, svg_str: str):
		with open(self.get_svg_file_path(), "w") as file: 
			file.write(svg_str)

	def __repr__(self):
		return f"DotIcon({self.id})"

	def __str__(self):
		return self.__repr__()


class SetName(CacheableMixin, db.Model):
	cache_label = "set_name"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	set_id = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	section_id = db.Column(db.Integer, db.ForeignKey('band_section.id'), nullable=False)

	# Data
	name = db.Column(db.String(32), default="default")

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"SetName({self.name})"

	def __str__(self):
		return f"SetName({self.name})"


class Set(CacheableMixin, db.Model):
	cache_label = "set"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	set_names = db.relationship('SetName', cascade="all,delete", backref='set')
	dots = db.relationship('Dot', cascade="all,delete", backref='set')


	# Data
	set_numb = db.Column(db.String(8), nullable=False)
	measure = db.Column(db.String(16))
	counts = db.Column(db.Integer, nullable=False)
	total_counts = db.Column(db.Integer, nullable=True, default=0)
	start_time_code = db.Column(db.Integer)
	end_time_code = db.Column(db.Integer)
	showIndex = db.Column(db.Integer, nullable=False, default=-1)
	notes = db.Column(db.String(256), nullable=True, default="")

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"Set({self.set_numb})"

	def __str__(self):
		return f"Set({self.set_numb})"


class BandSection(CacheableMixin, db.Model):
	cache_label = "band_section"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	show_users = db.relationship('ShowUser', cascade="all,delete", backref='band_section')
	set_names = db.relationship('SetName', cascade="all,delete", backref='band_section')

	# Data
	name = db.Column(db.String(32), default="default")
	color_r = db.Column(db.Integer)
	color_g = db.Column(db.Integer)
	color_b = db.Column(db.Integer)

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"BandSection({self.name})"

	def __str__(self):
		return f"BandSection({self.name})"


class ShowUser(CacheableMixin, db.Model):
	cache_label = "show_user"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
	section_id = db.Column(db.Integer, db.ForeignKey('band_section.id'))
	dots = db.relationship('Dot', cascade="all,delete", backref='show_user')

	# Data
	symbol = db.Column(db.String(16))
	label = db.Column(db.String(16))
	is_section_leader = db.Column(db.Boolean, default=False)
	is_locked = db.Column(db.Boolean, default=False)

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())


	def __repr__(self):
		return f"ShowUser({self.symbol}{self.label})"

	def __str__(self):
		return f"ShowUser({self.symbol}{self.label})"


class User(CacheableMixin, db.Model):
	cache_label = "user"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_users = db.relationship('ShowUser', cascade="all,delete", backref='user')

	# Data
	email = db.Column(db.String(128), unique=True)
	password_hash = db.Column(db.String(128))
	first_name = db.Column(db.String(64))
	last_name = db.Column(db.String(64))

	is_admin = db.Column(db.Boolean, default=False)
	send_admin_email = db.Column(db.Boolean, default=False)

	activated_date = db.Column(db.DateTime, default=None, nullable=True)
	created_date = db.Column(db.DateTime, default=datetime.datetime.now, nullable=True)
	last_updated = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.datetime.now)
	verified_date = db.Column(db.DateTime, default=None, nullable=True)

	# Methods
	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

	def __repr__(self):
		return f"User({self.email})"

	def __str__(self):
		return f"User({self.email})"


class Show(CacheableMixin, db.Model):
	cache_label = "show"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	show_users = db.relationship('ShowUser', cascade="all,delete", backref='show')
	sets = db.relationship('Set', cascade="all,delete", backref='show')
	dots = db.relationship('Dot', cascade="all,delete", backref='show')
	band_sections = db.relationship('BandSection', cascade="all,delete", backref='show')
	set_names = db.relationship('SetName', cascade="all,delete", backref='show')
	dot_icons = db.relationship('DotIcon', cascade="all,delete", backref='show')
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)

	# Data
	code = db.Column(db.String(8), unique=True)
	name = db.Column(db.String(256), default="NO NAME")

	is_default = db.Column(db.Boolean, default=True, nullable=False)

	# Tracking database updates
	last_update = db.Column(db.Integer, default=0, nullable=False)
	last_set_name_update = db.Column(db.Integer, default=0, nullable=True)

	# GENERATE CODE!!!
	def generateCode(self) -> str:
		# TODO: Make sure this is unique so there isn't an error!
		self.code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
		# self.code = "12345678"
		return self.code

	def changeUpdateTime(self):
		newUpdateCode = generateUpdateCode()
		print("UPDATE!!!!!!", newUpdateCode)
		self.last_update = newUpdateCode
	
	def changeSetNameUpdateTime(self):
		newUpdateCode = generateUpdateCode()
		print("UPDATE!!!!!!", newUpdateCode)
		self.last_set_name_update = newUpdateCode
	
	def __repr__(self):
		return f"Show({self.code})"

	def __str__(self):
		return f"Show({self.code})"


class School(CacheableMixin, db.Model):
	cache_label = "school"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	shows = db.relationship('Show', cascade="all,delete", backref='school')
	users = db.relationship('User', cascade="all,delete", backref='school')

	show_users = db.relationship('ShowUser', cascade="all,delete", backref='school')
	sets = db.relationship('Set', cascade="all,delete", backref='school')
	dots = db.relationship('Dot', cascade="all,delete", backref='school')
	dot_icons = db.relationship('DotIcon', cascade="all,delete", backref='school')
	band_sections = db.relationship('BandSection', cascade="all,delete", backref='school')
	set_names = db.relationship('SetName', cascade="all,delete", backref='school')


	# Data
	name = db.Column(db.String(256))
	email = db.Column(db.String(128))

	def __repr__(self):
		return f"School({self.name})"

	def __str__(self):
		return f"School({self.name})"


# Serializers
class DotIconSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "show_id", "set_id", "show_user_id", "direction", "line",
			"steps", "side", "fb_steps", "fb_direction", "use_hash"
		)
		"""

		model = DotIcon
		include_fk = True
		load_instance = True


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
	
	dot_icon = ma.Nested(DotIconSchema)


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
band_section_schema = BandSectionSchema()
band_sections_schema = BandSectionSchema(many=True)
set_names_schema = SetNameSchema(many=True)


class SecureModelView(ModelView):
	def is_accessible(self):
		if "logged_in" in session:
			return True
		abort(403)


class ShowModelView(SecureModelView):
	form_excluded_columns = ('dots', )


class SchoolModelView(SecureModelView):
	form_excluded_columns = ('users', 'show_users', 'sets', 'dots', 'band_sections', 'set_names')


admin.add_view(SecureModelView(Dot, db.session))
admin.add_view(SecureModelView(DotIcon, db.session))
admin.add_view(SecureModelView(SetName, db.session))
admin.add_view(SecureModelView(Set, db.session))
admin.add_view(SecureModelView(ShowUser, db.session))
admin.add_view(SecureModelView(User, db.session))
admin.add_view(SecureModelView(BandSection, db.session))
admin.add_view(ShowModelView(Show, db.session))
admin.add_view(SchoolModelView(School, db.session))


@app.route('/admin-logout', methods=["GET"])
def admin_logout():
	session.clear()
	return redirect("/admin-login")

@app.route('/admin-login', methods=["GET", "POST"])
def admin_login():
	if request.method == "POST":
		email = request.form.get("email")
		password = request.form.get("password")
		if email == "max@benmiller.com" and password == "n@wq461$RJ7tQ$YC^TzW":
			session["logged_in"] = True
			return redirect("/admin")
		return render_template("login.html", failed=True)
	return render_template("login.html")


# FUNCTIONAL API

# This creates a new token on login
@app.route('/token', methods=["POST"])
def create_token():
	email = request.json.get("email", None)
	password = request.json.get("password", None)

	user = User.query.filter_by(email=email).first()

	if not user:
		# user = User(email=email, password=password, name="Max Miller")
		# db.session.add(user)
		# db.session.commit()
		return  "Wrong email or password. You may need to create an account, press activate in the top right corner", 401

	if not user.check_password(password):
		return "Wrong email or password. You may need to create an account, press activate in the top right corner", 401

	# Require User to be verified
	if user.verified_date is None:
		return "User email hasn't been verified yet! You must click on the link in your email", 403

	access_token = create_access_token(identity=email)
	refresh_token = create_refresh_token(identity=email)

	userString = {}
	showString = {}
	schoolCode = ""
	showID = -1
	if user is not None:
		userString = user_schema.dump(user)

		userSchool = School.query.filter(School.id == user.school_id).first()
		if userSchool is not None:
			userShow = Show.query.filter(Show.school_id == userSchool.id).order_by(Show.is_default.desc()).first()

			if userShow is not None:
				schoolCode = userShow.code
				showID = userShow.id

				showUser = ShowUser.query.filter(ShowUser.show_id == userShow.id, ShowUser.user_id == user.id).first()
				if showUser is not None:
					showString = show_user_schema.dump(showUser)
					showString["show_user_id"] = showUser.id

	response = {
		"access_token": access_token, 
		"refresh_token": refresh_token, 
		"user": mergeJsonDicts(userString, showString),
		"school_code": schoolCode,
		"show_id": showID
	}
	return response


# This allows someone to get a new token a refresh it
@app.route('/refresh-token', methods=["POST"])
@jwt_required(refresh=True)
def refresh_expiring_jwts():
	identity = get_jwt_identity()
	access_token = create_access_token(identity=identity)
	return jsonify(access_token=access_token)


# This takes 2 json dictionaries and merges them
def mergeJsonDicts(a, b):
	merged_dict = {}

	for key, val in a.items():
		merged_dict[key] = val

	for key, val in b.items():
		if key not in merged_dict:
			merged_dict[key] = val

	# string dump of the merged dict
	return merged_dict


# This is for Azure to detect if the server is still working
@app.route('/api/health', methods=["GET"])
def health_check():
	return "Alive and Well.", 200


# This allows someone to get a new token a refresh it, while also getting all of the data 
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
		showID = -1
		if user is not None:
			userString = user_schema.dump(user)

			# Require User to be verified
			if user.verified_date is None:
				return "User email hasn't been verified yet!", 403

			userSchool = School.query.filter(School.id == user.school_id).first()
			if userSchool is not None:
				userShow = Show.query.filter(Show.school_id == userSchool.id).order_by(Show.is_default.desc()).first()

				if userShow is not None:
					schoolCode = userShow.code
					showID = userShow.id

					showUser = ShowUser.query.filter(ShowUser.show_id == userShow.id, ShowUser.user_id == user.id).first()
					if showUser is not None:
						showString = show_user_schema.dump(showUser)
						showString["show_user_id"] = showUser.id


		response = {"access_token": access_token, "user": mergeJsonDicts(showString, userString), "school_code": schoolCode}
		response = {
			"access_token": access_token, 
			"user": mergeJsonDicts(userString, showString),
			"school_code": schoolCode,
			"show_id": showID
		}
		# print(response)
		return response, 202
	except (RuntimeError, KeyError):
		# Case where there is not a valid JWT. Just return the original response
		return "There was an error", 401


# An endpoint to log a user out, this clears the cookie on the server side and invalidates it
@app.route("/logout", methods=["POST"])
def logout():
	response = jsonify({"msg": "logout successful"})
	unset_jwt_cookies(response)
	return response


# Send an email to a user to verify their account
@app.route("/send-verify-email", methods=["GET"])
def sendVerifyAccountEmailEndpoint():
	email = request.args.get("email", None)

	loggedInUser = User.query.filter(User.email == email).first()

	if loggedInUser is None:
		return "Invalid User", 401
	
	if loggedInUser.verified_date is not None:
		return "User has already been verified", 400
	
	sendVerifyEmail(loggedInUser)

	return "Sent.", 200	


# Endpoint for verify email that sets the user as verified using an encrypted id of the user
@app.route("/verify-account/<verify_encrypted_id>", methods=["GET"])
def verifyAccount(verify_encrypted_id):
	fernet = Fernet(verify_key)
	userID = fernet.decrypt(verify_encrypted_id.encode()).decode()

	user = User.query.filter(User.id == userID).first()

	if user is None:
		return "USER DOESN'T EXIST!!!", 404
	
	user.verified_date = datetime.datetime.now()
	db.session.commit()

	return "Success", 200


# Serve audio for the show
@app.route('/get-audio')
@jwt_required()
def send_music():
	identity = get_jwt_identity()
	user = User.query.filter_by(email=identity).first()

	if user is None:
		return "Unauthorized", 401
	
	school = School.query.filter(School.id == user.school_id).first()

	if school is None:
		return "School does not exist", 404
	
	show = Show.query.filter(Show.school_id == school.id).order_by(Show.is_default.desc()).first()
	if show is None:
		return "User has no shows", 404

	print(show.id)

	return storage_obj.send_file(f"static/{show.id}", "audio.mp3")
	return send_from_directory(f"static/{show.id}", "audio.mp3")


# Check if a file has a .pdf extension
def is_pdf(filename):
	ALLOWED_EXTENSIONS = ['pdf']
	return '.' in filename and \
		   filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS


# Take a pdf file and add it to the database
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

		for dot in dotSheet.dots:
			if Set.query.filter(Set.set_numb==dot.setNumb, Set.show_id==show.id).first() is None:
				_set = Set(
					set_numb=dot.setNumb, 
					measure=dot.measure, 
					counts=dot.counts, 
					total_counts=dot.counts, 
					school_id=school.id, 
					show_id=show.id
				)
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
	
	# Go through and add show indices
	sets = Set.query.filter(Set.show_id == show.id).order_by(Set.id).all()
	
	index = 0

	for set in sets:
		set.showIndex = index
		db.session.commit()

		index += 1


# Endpoint for creating a new show
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
		if len(fileKey) > 8 and fileKey[:8] == "pdf-file" and is_pdf(file.filename):
			fileLocation = "./showPDFs/" + file.filename
			file.save(fileLocation)

			# Save to cloud
			with open(fileLocation, "rb") as file:
				storage_obj.save_file(f"showPDFs/", file.filename, file)

			addShowFileToDatabase(fileLocation, school, show)

		elif fileKey == "mp3-file" and file.filename.rsplit('.', 1)[1] == "mp3":
			doesExist = os.path.exists(f"./static/{show.id}")
			if not doesExist:
				os.makedirs(f"./static/{show.id}")

			fileLocation = f"./static/{show.id}/audio.mp3"
			file.save(fileLocation)

			# Save to cloud
			with open(fileLocation, "rb") as file:
				storage_obj.save_file(f"static/{show.id}", "audio.mp3", file)

	return "Success!", 200


# Endpoint for adding dots to an existing show
@app.route('/upload-dot-sheet', methods=['POST'])
@jwt_required()
def upload_dot_sheet():
	identity = get_jwt_identity()
		
	activeUser = User.query.filter(User.email == identity).first()

	if not activeUser.is_admin:
		return "INVALID AUTHORIZATION", 401
	
	# Get School
	school = School.query.filter(School.id == activeUser.school_id).first()

	if school is None:
		return "INVALID SCHOOL", 401
	
	# Check Show Name
	showID = request.form.get("show-id")
	if showID is None:
		return "Missing Show ID!", 400
	
	# Create new show object
	show = Show.query.filter(Show.school_id==school.id, Show.id == showID).first()

	if show is None:
		return "Invalid Show ID", 400

	# Check PDFs
	for fileKey in request.files:
		file = request.files[fileKey]
		if len(fileKey) > 8 and fileKey[:8] == "pdf-file" and is_pdf(file.filename):
			fileLocation = "./showPDFs/" + file.filename
			file.save(fileLocation)
			addShowFileToDatabase(fileLocation, school, show)

	# There has been a change made to the show's date, 
	# so we must change the "last update time" var in the show object
	show.changeUpdateTime()  
	db.session.commit()

	getAllDotsWithoutBuffer(show.code)

	return "Success!", 200


# FORGOT PASSWORD

def create_forgot_password_code(user) -> str:
	key = Fernet.generate_key()
	fernet = Fernet(key)
	apiKey = fernet.encrypt(str(user.id).encode()).decode('utf8')
	forgot_password_code_reference.append({
		"user_id": user.id,
		"key": key,
		"code": apiKey
	})

	return apiKey

def get_forgot_password_user_id(code) -> int:
	for value in forgot_password_code_reference:
		if value["code"] == code:
			return value["user_id"]
	return -1

def remove_forgot_password_code(code) -> bool:
	thingy = None

	for value in forgot_password_code_reference:
		if value["code"] == code:
			thingy = value
	
	if thingy is None:
		return False
	
	forgot_password_code_reference.remove(thingy)
	return True


@app.route('/send-reset-password-email', methods=["GET"])
def send_reset_password_email():
	email = request.args.get("email", None)

	user = User.query.filter(User.email == email).first()

	if user is None:
		return "Invalid User", 401
	
	try:
		apiKey = create_forgot_password_code(user)

		message = {
			"content": {
				"subject": "DOT CHECK DECK - Forgot Password!",
				"plainText": "Hey! We know you aren't going to read this text, but like, everyone writes it so yeah",
				"html": f"""\
					<!DOCTYPE html>
					<html>
						<head></head>
						<body>
							<img src="https://dotcheckdeck.com/logo512.png" alt="" width="64" height="64" />
							<p>Hey! We know you aren't going to read this text, but like, everyone writes it so yeah. Just click the link I guess:</p>
							<a href="https://dotcheckdeck.com/forgot-password/{apiKey}">Reset Your Password</a>
						</body>
					</html>
				"""
			},
			"recipients": {
				"to": [
					{
						"address": user.email,
						"displayName": f"{user.first_name} {user.last_name}"
					}
				]
			},
			"senderAddress": "donotreply@dotcheckdeck.com"
		}

		email_client.begin_send(message)
		print(f"Sent Email to {user.email}")

		return "Sent.", 200
	except Exception as ex:
		print('Exception:')
		print(ex)
	
	return "Failed.", 404
		

@app.route('/reset-password-auth/<encrypted_id>', methods=['GET'])
def reset_password_auth(encrypted_id):
	print(forgot_password_code_reference)
	userID = get_forgot_password_user_id(encrypted_id)

	if userID == -1:
		return "Invalid Reset Password Key", 401

	user = User.query.filter(User.id == userID).first()

	if user is None:
		return "Invalid Reset Password Key", 401
	
	return "Valid.", 200


@app.route('/reset-password', methods=['POST'])
def reset_password():
	password = request.json.get("password", None)
	encrypted_id = request.json.get("encrypted_id", None)

	userID = get_forgot_password_user_id(encrypted_id)

	user = User.query.filter(User.id == userID).first()

	if user is None:
		return "Invalid Reset Password Key", 401
	
	if user.check_password(password):
		return "You cannot use the same password as the one you're resetting", 400
	
	user.set_password(password)
	db.session.commit()

	# We know this came from an email, so therefore we can say that this is authorized
	if user.verified_date is None:
		user.verified_date = datetime.datetime.now()
		db.session.commit()
	
	remove_forgot_password_code(encrypted_id)
	
	return "Done.", 200


# Icon For Dots

@app.route('/add-prop-to-show', methods=['POST'])
@jwt_required()
def add_prop_to_show():
	identity = get_jwt_identity()
	user = User.query.filter_by(email=identity).first()

	if user is None:
		return "Unauthorized", 401
	
	show_code = request.form.get("show_code", "")
	width = request.form.get("width", 1)
	height = request.form.get("height", 1)

	direction = request.form.get("direction", None)
	line = request.form.get("line", None)
	steps = request.form.get("steps", None)
	side = request.form.get("side", None)
	fb_steps = request.form.get("fb_steps", None)
	fb_direction = request.form.get("fb_direction", None)
	use_hash = request.form.get("use_hash", None)

	show = Show.query.filter(Show.code == show_code).first()

	if show is None:
		return "Invalid Show", 404
	
	print(show)

	dotIcon = DotIcon(
		school_id = user.school_id,
		show_id = show.id,
		width_in_steps = width,
		hight_in_steps = height
	)
	db.session.add(dotIcon)
	db.session.commit()	

	print(request.files)

	if "image" not in request.files:
		return "Missing SVG!", 400

	# Get Image and save it
	fileLocation = f"./static/{show.id}/{dotIcon.id}.svg"
	request.files["image"].save(fileLocation)

	with open(fileLocation, "rb") as file:
		storage_obj.save_file(f"static/{show.id}", f"{dotIcon.id}.svg", file)
	
	showUser = ShowUser(
		school_id = user.school_id,
		show_id = show.id,
		symbol = "*",
		label = "",
		is_locked = True
	)
	db.session.add(showUser)
	db.session.commit()	

	sets = Set.query.filter(Set.show_id == show.id).all()

	for set in sets:
		dot = Dot(
			school_id = user.school_id,
			show_id = show.id,
			set_id = set.id,
			show_user_id = showUser.id,
			dot_icon_id = dotIcon.id,

			direction = direction,
			line = line,
			steps = steps,
			side = side,
			fb_steps = fb_steps,
			fb_direction = fb_direction,
			use_hash = use_hash
		)
		db.session.add(dot)
		db.session.commit()	

	# There has been a change made to the show's date, 
	# so we must change the "last update time" var in the show object
	show.changeUpdateTime()  
	db.session.commit()

	return "Done.", 200

@app.route('/convert-user-to-prop', methods=['POST'])
@jwt_required()
def convert_user_to_prop():
	identity = get_jwt_identity()
	user = User.query.filter_by(email=identity).first()

	if user is None:
		return "Unauthorized", 401
	
	show_code = request.form.get("show_code", "")
	width = request.form.get("width", 1)
	height = request.form.get("height", 1)
	label = request.form.get("label", "")

	show = Show.query.filter(Show.code == show_code).first()

	if show is None:
		return "Invalid Show", 404
	
	showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.label == label).first()

	if showUser is None:
		return "Invalid show label", 404
	
	showUser.is_locked = True
	db.session.commit()	

	dotIcon = DotIcon(
		school_id = user.school_id,
		show_id = show.id,
		width_in_steps = width,
		hight_in_steps = height
	)
	db.session.add(dotIcon)
	db.session.commit()	

	print(request.files)

	if "image" not in request.files:
		return "Missing SVG!", 400

	# Get Image and save it
	fileLocation = f"./static/{show.id}/{dotIcon.id}.svg"
	request.files["image"].save(fileLocation)

	dots = Dot.query.filter(Dot.show_user_id == showUser.id).all()
	for dot in dots:
		dot.dot_icon_id = dotIcon.id
		db.session.commit()

	# There has been a change made to the show's date, 
	# so we must change the "last update time" var in the show object
	show.changeUpdateTime()  
	db.session.commit()

	return "Done.", 200


@app.route('/get-icon/<id>', methods=['GET'])
@jwt_required()
def get_icon(id):
	identity = get_jwt_identity()
	user = User.query.filter_by(email=identity).first()

	if user is None:
		return "Unauthorized", 401
	dotIcon = DotIcon.query.filter(DotIcon.id == id).first()

	if dotIcon is None:
		return "Dot Icon doesn't exist", 404

	return storage_obj.send_file(f"static/{dotIcon.show_id}", f"{dotIcon.id}.svg"), 200
	return send_from_directory(f"static/{dotIcon.show_id}", f"{dotIcon.id}.svg"), 200


# OBJECT API


# List all sets and associated info
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
			sets = Set.query.filter(Set.measure == measure, Set.show_id == show.id).order_by(Set.showIndex).all()
		else:
			sets = Set.query.filter(Set.show_id == show.id).order_by(Set.showIndex).all()

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


# Get all band sections
class GetSectionsResource(Resource):
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

		sections = BandSection.query.filter(BandSection.show_id == show.id).all()

		return band_sections_schema.dump(sections), 200


# Authorize a school code (used by activate account)
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
			if showUser.user_id is None and not showUser.is_locked:
				filteredUsers.append(showUser)

		
		return {"schoolName": school.name, "name": show.name, "users": show_users_schema.dump(filteredUsers), "email": school.email}, 200


# Find the dots buffer and modify necessary things with the user info
def updateBufferWithNewUser(user, showUser, show):
	data = []

	with open(f"cache/dots/{show.id}.json", "r") as file:
		data = json.load(file)
		for set in data:
			for dot in set["dots"]:
				if dot["dot"]["show_user_id"] == showUser.id:
					dot["userName"] = f"{user.first_name} {user.last_name}"
					break
			set["update_timestamp"] = show.last_update
	
	with open(f"cache/dots/{show.id}.json", "w") as file: 
		json.dump(data, file, indent=4)


# Send an email to a user to tell them to verify their account
def sendVerifyEmail(user):
	try:
		fernet = Fernet(verify_key)
		apiKey = fernet.encrypt(str(user.id).encode()).decode('utf8')

		message = {
			"content": {
				"subject": "DOT CHECK DECK - Activate your email!",
				"plainText": "Hey! We know you aren't going to read this text, but like, everyone writes it so yeah",
				"html": f"""\
					<!DOCTYPE html>
					<html>
						<head></head>
						<body>
							<img src="https://dotcheckdeck.com/logo512.png" alt="" width="64" height="64" />
							<p>Hey! We know you aren't going to read this text, but like, everyone writes it so yeah. Just click the link I guess:</p>
							<a href="https://dotcheckdeck.com/activate-account/{apiKey}">Activate New Account</a>
						</body>
					</html>
				"""
			},
			"recipients": {
				"to": [
					{
						"address": user.email,
						"displayName": f"{user.first_name} {user.last_name}"
					}
				]
			},
			"senderAddress": "donotreply@dotcheckdeck.com"
		}

		email_client.begin_send(message)
		print(f"Sent Email to {user.email}")
	except Exception as ex:
		print('Exception:')
		print(ex)


def notifyAdminOfNewUser(school_id:int, added_user:User):
	users = User.query.filter(User.school_id == school_id, User.is_admin == True).all()

	emails = list()

	for user in users:
		if user.send_admin_email is True:
			emails.append({
				"address": user.email,
				"displayName": f"{user.first_name} {user.last_name}"
			})
	
	try:

		message = {
			"content": {
				"subject": "DOT CHECK DECK - Admin Notification!",
				"plainText": "A new user has just been added!",
				"html": f"""\
					<!DOCTYPE html>
					<html>
						<head></head>
						<body>
							<img src="https://dotcheckdeck.com/logo512.png" alt="" width="64" height="64" />
							<p>A New User Has Just Been activated</p>
							<p><strong>User:</strong> {added_user.first_name} {added_user.last_name}</p>
							<p><strong>Email:</strong> {added_user.email}</p>
							<p><strong>Date:</strong> {added_user.created_date}</p>
						</body>
					</html>
				"""
			},
			"recipients": {
				"to": emails
			},
			"senderAddress": "donotreply@dotcheckdeck.com"
		}

		email_client.begin_send(message)
	except Exception as ex:
		print('Exception:')
		print(ex)


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

		# Check to see if we got a show obj
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
			return "User has already been activated, please use the existing user option", 400
		
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

		sendVerifyEmail(user)
		notifyAdminOfNewUser(show.school_id, user)

		# There has been a change made to the show's date, 
		# so we must change the "last update time" var in the show object
		show.changeUpdateTime()  
		db.session.commit()

		updateBufferWithNewUser(user, showUsers[0], show)

		return "Successfully activated user", 201


# Allows an existing account to add a showUser to their account for a new show
class AddShowUserResource(Resource):
	def post(self):
		email = request.json.get("email", None)
		password = request.json.get("password", None)
		showCode = request.json.get("show_code", None)
		label = request.json.get("label", None)

		user = User.query.filter_by(email=email).first()

		if not user:
			return  "Wrong email or password", 401

		if not user.check_password(password):
			return "Wrong email or password", 401

		# Require User to be verified
		if user.verified_date is None:
			return "User email hasn't been verified yet! You must click on the link in your email", 403
		
		# Attempt to load the Show with that code
		show = Show.query.filter(Show.code == showCode).first()

		# Check to see if we got a show obj
		if show is None:
			return "INVALID SHOW CODE", 404
		
		if ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == user.id).first() is not None:
			return "A label in this show has already been activated to this user!", 400

		# Find users that fit the params,
		# it's possible for multiple users to have the same label so we have to do this for now.
		showUsers = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.label == label).all()

		if len(showUsers) > 1:
			return "Multiple Users found for that query, INTERNAL SERVER ERROR!", 402
		if len(showUsers) != 1:
			return "No users found with that show_code and label"
		
		showUsers[0].user_id = user.id
		db.session.commit()

		return "Success", 200


# Get the index of a set in an array (that could be in any order) by it's set_name
def getSetIndex(sets, middleSet) -> int:
	for x in range(len(sets)):
		if sets[x].set_numb == middleSet:
			return x
	return -1


# Get the index of a set in an array (that could be in any order) by it's set_name.
def getSetIndexInData(data, middleSet) -> int:
	for x in range(len(data)):
		if data[x]["setNumb"] == middleSet:
			return x
	return -1


# Get the index of a set by the index
def getSetByShowIndex(sets, index):
	for set in sets:
		if set.showIndex == index:
			return set
	return None


# Get the section color for a given user
def getSectionColor(userObj) -> list:
	userSection = BandSection.query.filter(BandSection.id == userObj.section_id).first()

	if userSection is None:
		return 0, 0, 0
	
	return userSection.color_r, userSection.color_g, userSection.color_b


def getAllDotInfoForSet(show, set):
	dots = Dot.query.filter(Dot.set_id == set.id).all()
		
	setName = ""

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

	return {
		'setID': set.id,
		'setNumb': set.set_numb,
		'setName': setName,
		'counts': set.counts,
		'total_counts': set.total_counts,
		'start_time_code': set.start_time_code,
		'end_time_code': set.end_time_code,
		'index': set.showIndex,
		'dots': dotCords,
		'update_timestamp': show.last_update,
		'measure': set.measure
	}


def getAllDotsWithoutBuffer(schoolCode):
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

	# var to store all of the sets
	output = []

	for set in sets:
		output.append(getAllDotInfoForSet(show, set))
	
	print("SAVING NEW CACHE")
	with open(f"cache/dots/{show.id}.json", "w") as outfile:
		json.dump(output, outfile, indent=4)

	return output


def updateSetInDotsCache(show):
	print("UPDATING CACHE!")
	try:
		with open(f"cache/dots/{show.id}.json", "r") as file:
			data = json.load(file)

			curDatabaseVersion = show.last_update

			for i in range(len(data)):
				# If it's out of date, then we're gonna screw it (update it)
				if data[i]["update_timestamp"] != curDatabaseVersion:
					
					setObj = Set.query.filter(Set.id == data[i]["setID"]).first()
					data[i] = getAllDotInfoForSet(show, setObj)
			
			with open(f"cache/dots/{show.id}.json", "w") as outfile:
					json.dump(data, outfile, indent=4)

	except:
		return getAllDotsWithoutBuffer(show.code)


def getBufferedDots(showCode, middleSet, bufferSize):
	# REQUIRE A SCHOOL CODE
	if showCode is None:
		return "Missing Show Code", 404

	# Attempt to load the Show with that code
	show = Show.query.filter(Show.code == showCode).first()

	# Check to see if we got a show obj
	if show is None:
		return "INVALID SHOW CODE", 404
	
	curDatabaseVersion = show.last_update

	try:
		with open(f"cache/dots/{show.id}.json", "r") as file:
			data = json.load(file)

			if middleSet == "undefined":
				middleSet = "1"

			searchSetIndex = getSetIndexInData(data, middleSet)

			if searchSetIndex == -1:
				print("INVALID MIDDLE SET!")
				return "INVALID MIDDLE SET PARM", 404

			startIndex = 0
			endIndex = len(data) - 1

			if searchSetIndex - bufferSize > 0:
				startIndex  = searchSetIndex - bufferSize
			if searchSetIndex + bufferSize < len(data):
				endIndex  = searchSetIndex + bufferSize

			# var to store all of the sets
			output = []
			changedSomething = False
			
			for i in range(startIndex, endIndex + 1):
				# If it's out of date, then we're gonna screw it (update it)
				if data[i]["update_timestamp"] != curDatabaseVersion:
					setObj = Set.query.filter(Set.id == data[i]["setID"]).first()
					data[i] = getAllDotInfoForSet(show, setObj)
					changedSomething = True

				output.append(data[i])
			
			if changedSomething:
				with open(f"cache/dots/{show.id}.json", "w") as outfile:
					json.dump(data, outfile, indent=4)
			"""
			foundSomething = False
			
			for i in range(startIndex, endIndex + 1):
				# If it's out of date, then we're gonna screw it (update it)
				if not foundSomething and data[i]["update_timestamp"] != curDatabaseVersion:
					job = queue.enqueue_call(
						func=updateSetInDotsCache, args=(show), result_ttl=5000
					)

					print(job.get_id())

					foundSomething = True

				output.append(data[i])
			"""
				
			return output, 200
	except:
		print("Error")
		return getAllDotsWithoutBuffer(show.code)


class GetDotsWithBufferResource(Resource):
	@jwt_required()
	def get(self):
		# TODO: Refactor to show_code
		schoolCode = request.args.get('school_code', None)
		middleSet = request.args.get('set', "1")
		bufferSize = int(request.args.get('buffer', 4))

		return getBufferedDots(schoolCode, middleSet, bufferSize)


def getSetName(setNames, set_id):
	for setName in setNames:
		if setName["set_id"] == set_id:
			return setName["set_name"]
	
	return "ERROR"


def getBufferedUserDots(show, showUser):
	curDatabaseVersion = show.last_update

	setNames = getBufferedSetNames(show, showUser)[0]

	try:
		with open(f"cache/dots/{show.id}.json", "r") as file:
			data = json.load(file)

			# var to store all of the sets
			output = []
			changedSomething = False
			
			for set in data:
				# If it's out of date, then we're gonna screw it (update it)
				if set["update_timestamp"] != curDatabaseVersion:
					setObj = Set.query.filter(Set.id == set["setID"]).first()
					set = getAllDotInfoForSet(show, setObj)
					changedSomething = True

				for dot in set["dots"]:
					if dot["dot"]["show_user_id"] == showUser.id:
						dot["set_numb"] = set["setNumb"]
						dot["set_name"] = getSetName(setNames, set["setID"])
						dot["measure"] =  set["measure"]
						dot["timestamp"] = show.last_update
						dot["set_name_timestamp"] = show.last_set_name_update
						output.append(dot)
						break
			
			if changedSomething:
				with open(f"cache/dots/{show.id}.json", "w") as outfile:
					json.dump(data, outfile, indent=4)
				
			return output
	except:
		print("ERROR")
		return getAllDotsWithoutBuffer(show.code)


class GetUserDotsResource(Resource):
	@jwt_required()
	def get(self):
		# TODO: Refactor to show_code
		showCode = request.args.get('school_code', None)

		# REQUIRE A SHOW CODE
		if showCode is None:
			return "Missing School Code", 404

		show = Show.query.filter(Show.code == showCode).first()

		# Make sure show exists
		if show is None:
			return "Show doesn't exist with that code", 404

		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()

		if loggedInUser is None:
			return "Invalid User", 401
		
		showUser = ShowUser.query.filter(ShowUser.user_id == loggedInUser.id, ShowUser.show_id == show.id).first()

		if showUser is None:
			return "User does not have access to that show!", 401
		
		return {"dots": getBufferedUserDots(show, showUser)}, 200


class UpdateSetResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()

		if not loggedInUser.is_admin:
			return "Unauthorized", 401

		parser = reqparse.RequestParser()
		parser.add_argument('id', type=int, default=None, required=True, help="You must include the ID of the set")
		parser.add_argument('set_numb', type=str, default=None)
		parser.add_argument('measure', type=str, default=None)
		parser.add_argument('counts', type=str, default=None)
		parser.add_argument('total_counts', type=int, default=None)
		parser.add_argument('start_time_code', type=int, default=None)
		parser.add_argument('end_time_code', type=int, default=None)
		parser.add_argument('notes', type=str, default=None)
		args = parser.parse_args()

		id = args.get('id')
		setNumb = args.get('set_numb')
		measure = args.get('measure')
		counts = args.get('counts')
		total_counts = args.get('total_counts')
		start_time_code = args.get('start_time_code')
		end_time_code = args.get('end_time_code')
		notes = args.get('notes')

		set = Set.query.filter(Set.id == id).first()
		show = Show.query.filter(Show.school_id == loggedInUser.school.id, Show.id == set.show_id).first()

		if set is None:
			return "Invalid Set ID", 404

		if setNumb is not None:
			set.set_numb = setNumb
		if measure is not None:
			set.measure = measure
		if counts is not None:
			set.counts = counts
		if total_counts is not None:
			set.total_counts = total_counts
		if start_time_code is not None:
			set.start_time_code = start_time_code
		if end_time_code is not None:
			set.end_time_code = end_time_code
		if notes is not None:
			set.notes = notes
		
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

		if not loggedInUser.is_admin:
			return "Unauthorized", 401

		data = json.loads(request.data)

		for _set in data["data"]:
			set = Set.query.filter(Set.id == _set["id"]).first()
			show = Show.query.filter(Show.school_id == loggedInUser.school.id, Show.id == set.show_id).first()

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


			if showUser.label != show["label"] or showUser.symbol != show["symbol"] or showUser.section_id != show["section_id"]:
				showUser.label = show["label"]
				showUser.symbol = show["symbol"]
				showUser.section_id = show["section_id"]

				# There has been a change made to the show's date, 
				# so we must change the "last update time" var in the show object
				Show.query.filter(Show.id == showUser.show_id).first().changeUpdateTime()

			showUser.is_section_leader = show["is_section_leader"]
			db.session.commit()

		
		db.session.commit()

		return "Success", 201
	

class UpdateUserSectionResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		
		loggedInUser = User.query.filter(User.email == identity).first()

		if loggedInUser is None:
			return "Invalid User", 401
		

		parser = reqparse.RequestParser()
		parser.add_argument('id', type=int, default=None, required=True, help="You must include the ID of the show user")
		parser.add_argument('section_id', type=str, default=None, required=True)
		args = parser.parse_args()
		
		showUser = ShowUser.query.filter(ShowUser.id == args.get('id')).first()

		if showUser is None:
			return "INVALID SHOW USER ID", 404

		
		showUser.section_id = args.get('section_id')
		db.session.commit()

		# There has been a change made to the show's date, 
		# so we must change the "last update time" var in the show object
		show = Show.query.filter(Show.id == showUser.show_id).first()
		show.changeUpdateTime()

		updateBufferWithNewUser(loggedInUser, showUser, show)
		
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

		notifyAdminOfNewUser(school_id, newUser)

		return "Successfully Created User", 201

	@jwt_required()
	def delete(self):
		identity = get_jwt_identity()
		
		activeUser = User.query.filter(User.email == identity).first()

		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401

		parser = reqparse.RequestParser()
		parser.add_argument('id', type=str, default=None, required=True)
		args = parser.parse_args()

		user = User.query.filter(User.id == args.get('id')).first()

		if user is None:
			return "User doesn't exist", 404
		
		db.session.delete(user)
		db.session.commit()

		return "Successfully deleted user", 200

# ADMIN INVITE USER

def create_invite_code(email, is_admin, school_id) -> str:
	key = Fernet.generate_key()
	fernet = Fernet(key)
	apiKey = fernet.encrypt(email.encode()).decode('utf8')
	invite_user_code_reference.append({
		"email": email,
		"is_admin": is_admin,
		"school_id": school_id,
		"key": key,
		"code": apiKey
	})

	return apiKey

def get_invite_data(code):
	for value in invite_user_code_reference:
		if value["code"] == code:
			return value["email"], value["is_admin"], value["school_id"]
	return "", False, -1

def remove_invite_code(code) -> bool:
	thingy = None

	for value in invite_user_code_reference:
		if value["code"] == code:
			thingy = value
	
	if thingy is None:
		return False
	
	invite_user_code_reference.remove(thingy)
	return True

def sendInviteUserEmail(email, is_admin, school_id):
	try:
		apiKey = create_invite_code(email, is_admin, school_id)

		message = {
			"content": {
				"subject": "DOT CHECK DECK - Invitation to join!",
				"plainText": "Hey! We know you aren't going to read this text, but like, everyone writes it so yeah",
				"html": f"""\
					<!DOCTYPE html>
					<html>
						<head></head>
						<body>
							<img src="https://dotcheckdeck.com/logo512.png" alt="" width="64" height="64" />
							<p>Hey! We know you aren't going to read this text, but like, everyone writes it so yeah. Just click the link I guess:</p>
							<a href="https://dotcheckdeck.com/accept-invitation/{apiKey}">Activate New Account</a>
						</body>
					</html>
				"""
			},
			"recipients": {
				"to": [
					{
						"address": email,
						"displayName": "Invited User"
					}
				]
			},
			"senderAddress": "donotreply@dotcheckdeck.com"
		}

		email_client.begin_send(message)
		print(f"Sent Email to {email}")
	except Exception as ex:
		print('Exception:')
		print(ex)

@app.route('/invited-user-auth/<encrypted_key>', methods=['GET'])
def invited_user_auth(encrypted_key):
	print(invite_user_code_reference)
	email, is_admin, school_id = get_invite_data(encrypted_key)

	if school_id == -1:
		return "Invalid Invitation Key", 401
	
	return "Valid.", 200


@app.route('/activate-invited-user', methods=['POST'])
def activateInvitedUser():
	password = request.json.get("password", None)
	first_name = request.json.get("first_name", None)
	last_name = request.json.get("last_name", None)
	encrypted_key = request.json.get("encrypted_key", None)
	email, is_admin, school_id = get_invite_data(encrypted_key)

	if not remove_invite_code(encrypted_key):
		return "Invalid invitation code", 401

	newUser = User(
		email = email,
		first_name = first_name,
		last_name = last_name,
		school_id = school_id,
		is_admin = is_admin
	)

	newUser.activated_date = datetime.datetime.now()
	newUser.verified_date = datetime.datetime.now()
	newUser.set_password(password)

	db.session.add(newUser)
	db.session.commit()

	notifyAdminOfNewUser(school_id, newUser)

	return "Created User.", 201


class InviteUserResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()
		
		activeUser = User.query.filter(User.email == identity).first()

		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401

		parser = reqparse.RequestParser()
		parser.add_argument('email', type=str, default=None, required=True)
		parser.add_argument('is_admin', type=bool, default=None, required=True)
		args = parser.parse_args()
		
		user = User.query.filter(User.email == args.get('email')).first()

		if user is not None:
			return "USER ALREADY EXISTS", 404
		
		sendInviteUserEmail(args.get('email'), args.get('is_admin'), activeUser.school_id)

		return "Sent.", 200


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

		# Get Shows
		shows = Show.query.filter(Show.school_id == school.id).order_by(Show.is_default.desc()).all()

		if len(shows) == 0:
			return "NO SHOWS", 404

		# Get Default Show
		defaultShow = shows[0]

		# Get Users + Show Users
		users = User.query.filter(User.school_id == activeUser.school_id).all()

		# Get Sections
		sections = BandSection.query.filter(BandSection.school_id == school.id, BandSection.show_id == defaultShow.id).all()
		sections_data = band_sections_schema.dump(sections)
		
		for section in sections_data:
			section["set_names"] = set_names_schema.dump(SetName.query.filter(SetName.section_id == section["id"]).all())

		# Get Sets + set names
		sets = Set.query.filter(Set.school_id == school.id, Set.show_id == defaultShow.id).order_by(Set.showIndex).all()

		return {
			"school": school_schema.dump(school),
			"sections": sections_data,
			"sets": sets_schema.dump(sets),
			"shows": shows_schema.dump(shows),
			"users": users_schema.dump(users)
		}


def updateBufferWithSetName(show, setName):
	data = []

	try:
		with open(f"cache/set-names/{show.id}.json", "r") as file:
			data = json.load(file)
			print(data)

			if str(setName.section_id) not in data:
				return

			for id, section in data.items():
				for set in section:
					if id == str(setName.section_id) and set["set_id"] == setName.set_id:
							set["set_name"] = setName.name
					set["update_timestamp"] = str(show.last_set_name_update)
		
		with open(f"cache/set-names/{show.id}.json", "w") as file: 
			json.dump(data, file, indent=4)
	except:
		getSetNamesWithoutBuffer(show)



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
		show = Show.query.filter(Show.id == show_id).first()
		show.changeSetNameUpdateTime()

		updateBufferWithSetName(show, setName)

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
		parser.add_argument('id', type=int, default=None, required=False, help="You must include the ID of the set")
		parser.add_argument('name', type=str, default=None, required=True, help="You must include the Name")
		parser.add_argument('color_r', type=int, default=None, required=True, help="You must include the Color")
		parser.add_argument('color_g', type=int, default=None, required=True, help="You must include the Color")
		parser.add_argument('color_b', type=int, default=None, required=True, help="You must include the Color")
		args = parser.parse_args()

		section = BandSection.query.filter(BandSection.id == args.get("id"), BandSection.school_id == activeUser.school_id).first()

		if section is None and args.get("id") is not None:
			return "Invalid ID", 404
		elif section is None:
			show = Show.query.filter(Show.school_id == activeUser.school_id).order_by(Show.is_default.desc()).first()

			if show is None:
				return "No shows exist with that school!", 404

			section = BandSection(
				name=args.get("name"),
				color_r = args.get("color_r"),
				color_g = args.get("color_g"),
				color_b = args.get("color_b"),
				school_id = activeUser.school_id,
				show_id = show.id
			)

			db.session.add(section)
		
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

		show = Show.query.filter(Show.id == args.get("show_id")).first()

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
			show.changeSetNameUpdateTime()  
			db.session.commit()

			updateBufferWithSetName(show, setName)

			return "Created Successfully.", 201
		else:
			setName.name = args.get("name")

			# There has been a change made to the show's date, 
			# so we must change the "last update time" var in the show object
			show.changeSetNameUpdateTime()
			db.session.commit()

			updateBufferWithSetName(show, setName)

			return "Updated Successfully.", 202


class UpdateShowResource(Resource):
	@jwt_required()
	def post(self):
		identity = get_jwt_identity()

		activeUser = User.query.filter(User.email == identity).first()

		if activeUser is None: 
			return "INVALID AUTHORIZATION", 401
		
		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401
		
		parser = reqparse.RequestParser()
		parser.add_argument('id', type=int, default=None, required=True, help="You must include the ID of the show")
		parser.add_argument('code', type=str, default=None, required=True, help="You must include the code for the show")
		parser.add_argument('name', type=str, default=None, required=True, help="You must include the name of the show")
		parser.add_argument('is_default', type=bool, default=None, required=True, help="You must include the default status")
		args = parser.parse_args()

		show = Show.query.filter(Show.id == args.get("id")).first()

		if show is None:
			return "Did not find show by that ID", 404
		
		show.code = args.get("code")
		show.name = args.get("name")
		show.is_default = args.get("is_default")

		# There has been a change made to the show's date, 
		# so we must change the "last update time" var in the show object
		show.changeUpdateTime()  

		db.session.commit()

		return "Updated Successfully!", 201


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

		return {"timestamp": show.last_update, "set_name_timestamp": show.last_set_name_update}, 200


class GetDefaultJoinCode(Resource):
	@jwt_required()
	def get(self):
		identity = get_jwt_identity()

		activeUser = User.query.filter(User.email == identity).first()

		if activeUser is None: 
			return "INVALID AUTHORIZATION", 401
		
		if not activeUser.is_admin:
			return "INVALID AUTHORIZATION", 401
		
		show = Show.query.filter(Show.school_id == activeUser.school_id).order_by(Show.is_default.desc()).first()

		if show is None:
			return "Internal Server Error, could not find any shows that you have access to!", 404

		return {"code": show.code, "name": show.name}


def getSetNamesWithoutBuffer(show):
	sets = Set.query.filter(Set.show_id == show.id).order_by(Set.showIndex).all()
	sections = BandSection.query.filter(BandSection.show_id == show.id).all()

	# Get the database version so we know what update this is
	curDatabaseVersion = show.last_set_name_update

	output = {}

	
	for section in sections:
		setsOutput = list()

		for set in sets:
			# Set a default name so that the var is defined
			setName = "Undefined"

			# Get a Set Name if it exists for that section / set
			setNameObj = SetName.query.filter(SetName.section_id == section.id, SetName.set_id == set.id).first()
			if setNameObj is not None:
				setName = setNameObj.name
			
			setsOutput.append({
				"set_id": set.id,
				"set_name": setName,
				"update_timestamp": curDatabaseVersion
			})
		output[section.id] = setsOutput
	
	# SAVING NEW CACHE
	with open(f"cache/set-names/{show.id}.json", "w") as outfile:
		json.dump(output, outfile, indent=4)

	return output


def getBufferedSetNames(show, showUser):
	# Get the database version so we know what update this is
	curDatabaseVersion = show.last_set_name_update

	try:
		with open(f"cache/set-names/{show.id}.json", "r") as file:
			data = json.load(file)

			# var to store all of the sets
			output = []

			if str(showUser.section_id) not in data:
				print("Section doesn't exist!")
				return getSetNamesWithoutBuffer(show), 200
			
			for setName in data[str(showUser.section_id)]:
				output.append(setName)
				if setName["update_timestamp"] != curDatabaseVersion:
					print("Updating!")
					return getSetNamesWithoutBuffer(show), 200
			# print(len(output))
				
			return output, 200
	except:
		print("ERROR")
		return getSetNamesWithoutBuffer(show), 200


class SetNameListResource(Resource):
	@jwt_required()
	def get(self):
		setNumb = request.args.get('set_id', None)
		schoolCode = request.args.get('school_code', None) # TODO: Change name to show_code

		# REQUIRE A SCHOOL CODE
		if schoolCode is None:
			return "Missing School Code", 404

		# CHECK IF CODE IS VALID
		show = Show.query.filter(Show.code == schoolCode).first()
		if show is None:
			return "INVALID SHOW CODE", 404

		sets = Set.query.filter(Set.show_id == show.id).order_by(Set.showIndex).all()

		identity = get_jwt_identity()
		loggedInUser = User.query.filter(User.email == identity).first()
		showUser = ShowUser.query.filter(ShowUser.show_id == show.id, ShowUser.user_id == loggedInUser.id).first()
		
		if showUser is not None and showUser.section_id is not None:
			loggedInUserSection = BandSection.query.filter(BandSection.id == showUser.section_id).first()
		else:
			loggedInUserSection = None

		return getBufferedSetNames(show, showUser)



api.add_resource(SetListResource, '/sets')
api.add_resource(SchoolCodeAuthResource, '/school-code-auth')
api.add_resource(SetUpUserResource, '/users/activate')
api.add_resource(GetDotsWithBufferResource, '/get-dots')
api.add_resource(GetUserDotsResource, '/get-dots-user')
api.add_resource(UpdateSetResource, '/update-set')
api.add_resource(UpdateSetsResource, '/update-sets')
api.add_resource(UpdateUserResource, '/users')
api.add_resource(CreateUserResource, '/create-user')
api.add_resource(InviteUserResource, '/invite-user')
api.add_resource(GetDatabaseResource, '/get-all')
api.add_resource(UpdateOrCreateSetNameResource, '/update-set-name')
api.add_resource(UpdateSectionResource, '/update-section')
api.add_resource(UpdateSetNameResource, '/update-set-name-admin')
api.add_resource(UpdateShowResource, '/update-show')
api.add_resource(GetLastUpdateResource, '/database-version')
api.add_resource(GetDefaultJoinCode, '/default-join-code')
api.add_resource(SetNameListResource, '/get-set-names')
api.add_resource(GetSectionsResource, '/get-sections')
api.add_resource(UpdateUserSectionResource, '/update-user-section')
api.add_resource(AddShowUserResource, "/add-show-user-to-user")



# For use to build database
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

		if arg == "build":
			rebuild = True
			with app.app_context():
				if 'WEBSITE_HOSTNAME' in os.environ and input ("Would you like to install jdk (y/n)?") == "y":
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

		if arg == "set_up" and 'WEBSITE_HOSTNAME' in os.environ:
			rebuild = True
			os.system("apt update")
			os.system("apt install default-jdk")
		
		# Some database configuration, idk what tbh
		if arg == "fix-show-indices":
			print("Configuring Show Indicies!")
			rebuild = True
			with app.app_context():
				show = Show.query.filter().first()
				sets = Set.query.filter(Set.show_id == show.id).order_by(Set.id).all()
				for set in sets:
					set.showIndex = set.id - 1

					db.session.commit()
	
		# Some database configuration, idk what tbh
		if arg == "fix-things":
			print("Configuring Show Indicies!")
			rebuild = True
			with app.app_context():
				show = Show.query.filter().first()
				sets = Set.query.filter(Set.show_id == show.id).order_by(Set.id).all()
				for set in sets:
					set.notes = ""
					set.total_counts = set.counts

					db.session.commit()
	
		if arg == "stuff":
			# Currently builds a file with all the section info because I don't want to have to deal with it.
			rebuild = True
			with app.app_context():
				show = Show.query.filter().first()
				sections = BandSection.query.filter(BandSection.show_id == show.id).all()
				sets = Set.query.filter(Set.show_id == show.id).all()

				with open("section_info.json", "w") as outfile:
					outfile.write(json.dumps(band_sections_schema.dump(sections), indent=4))
				with open("set_info.json", "w") as outfile:
					outfile.write(json.dumps(sets_schema.dump(sets), indent=4))
		
		if arg == "stuff_load":
			# Currently builds a file with all the section info because I don't want to have to deal with it.
			rebuild = True
			with app.app_context():
				show = Show.query.filter().first()
				sections = []

				with open("section_info.json", "r") as inFile:
					sections = json.load(inFile)
				with open("set_info.json", "r") as inFile:
					sets = json.load(inFile)

				for s in sections:
					section = BandSection(
						name = s["name"], 
						color_r = s["color_r"], 
						color_g = s["color_g"],
						color_b = s["color_b"],
						school_id = show.school_id,
						show_id = show.id
					)
					db.session.add(section)
					db.session.commit()

				for s in sets:
					set = Set.query.filter(Set.showIndex == s["showIndex"], Set.show_id == show.id).first()

					if set is not None:
						set.start_time_code = s["start_time_code"]
						set.end_time_code = s["end_time_code"]
						db.session.commit()	


	# from GUITest import GUITest
	# GUITest(1125, 600)

	if not rebuild:
		# Available Externally on LAN
		if 'WEBSITE_HOSTNAME' not in os.environ:
			app.run(debug=True, host="0.0.0.0")
		# Use Default Config
		else:
			app.run(debug=True)

"""
Startup Command

python app.py

cd frontend
npm start

python worker.py

redis-server
"""

"""
AFTER DEPLOY COMMANDS TO INSTALL JAVA

apt update
apt install default-jdk
apt install software-properties-common
add-apt-repository ppa:linuxuprising/java
apt update
apt install oracle-java11-installer
"""