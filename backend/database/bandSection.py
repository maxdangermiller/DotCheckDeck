from backend.database import ma, db
from backend.cache import regions, CacheableMixin, query_callable
from datetime import datetime
from backend.database.utils import generateUpdateCode


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
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"BandSection({self.name})"

	def __str__(self):
		return f"BandSection({self.name})"

