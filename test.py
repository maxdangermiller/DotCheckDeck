from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='client/build', static_url_path='')
db = SQLAlchemy(app)


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
		return f"ShowUser({self.label})"

	def __str__(self):
		return f"ShowUser({self.label})"


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
	school = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)

	# Data
	code = db.Column(db.String(8), unique=True)

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

	# Data
	name = db.Column(db.String(256))
	email = db.Column(db.String(128))

	def __repr__(self):
		return f"School({self.name})"

	def __str__(self):
		return f"School({self.name})"
