from database import ma, db
from cache import regions, CacheableMixin, query_callable
from datetime import datetime
from database.utils import generateUpdateCode


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
	is_prop = db.Column(db.Boolean, default=False)
	is_stationary = db.Column(db.Boolean, default=False)

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())


	def __repr__(self):
		return f"ShowUser({self.symbol}{self.label})"

	def __str__(self):
		return f"ShowUser({self.symbol}{self.label})"

