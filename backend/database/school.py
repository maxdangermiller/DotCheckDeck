from database import ma, db
from cache import regions, CacheableMixin, query_callable
from database.utils import generateUpdateCode
from database.utils import generateUpdateCode


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
