from backend.database import ma, db
from backend.cache import regions, CacheableMixin, query_callable
from datetime import datetime
from backend.database.utils import generateUpdateCode
from werkzeug.security import generate_password_hash, check_password_hash


class User(CacheableMixin, db.Model):
	cache_label = "user"
	cache_regions = regions
	query_class = query_callable(regions)

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
	send_admin_email = db.Column(db.Boolean, default=False)

	activated_date = db.Column(db.DateTime, default=None, nullable=True)
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
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

