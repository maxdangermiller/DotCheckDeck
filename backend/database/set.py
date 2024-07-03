from backend.database import ma, db
from backend.cache import regions, CacheableMixin, query_callable
from datetime import datetime
from backend.database.utils import generateUpdateCode


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
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"Set({self.set_numb})"

	def __str__(self):
		return f"Set({self.set_numb})"

