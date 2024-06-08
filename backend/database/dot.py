from database import ma, db
from cache import regions, CacheableMixin, query_callable
from datetime import datetime
from database.utils import generateUpdateCode

# sqlalchemy.exc.InvalidRequestError: When initializing mapper mapped class DotIcon->dot_icon, expression 'Dot' failed to locate a name ('Dot'). 
# If this is a class name, consider adding this relationship() to the <class 'database.dotIcon.DotIcon'> class after both dependent classes have been defined.

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
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"Dot({self.show_user_id} ->{self.id})"

	def __str__(self):
		return f"Dot({self.show_user_id} ->{self.id})"

