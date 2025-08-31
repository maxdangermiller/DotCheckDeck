from database import db
from cache import regions, CacheableMixin, query_callable
from database.utils import generateUpdateCode
import random
import string


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
		print(f"(Show: {self.name}) >  created new update code of {newUpdateCode}")
		self.last_update = newUpdateCode
	
	def changeSetNameUpdateTime(self):
		newUpdateCode = generateUpdateCode()
		print(f"(Show: {self.name}) >  created new SET NAME update code of {newUpdateCode}")
		self.last_set_name_update = newUpdateCode
	
	def __repr__(self):
		return f"Show({self.name}-{self.code})"

	def __str__(self):
		return self.name

