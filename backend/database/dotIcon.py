from backend.database import ma, db
from backend.cache import regions, CacheableMixin, query_callable
from datetime import datetime
from backend.database.utils import generateUpdateCode


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
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
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

