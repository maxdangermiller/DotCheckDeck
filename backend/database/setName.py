from database import ma, db
from cache import regions, CacheableMixin, query_callable
from datetime import datetime
from database.utils import generateUpdateCode


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
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"SetName({self.name})"

	def __str__(self):
		return f"SetName({self.name})"

