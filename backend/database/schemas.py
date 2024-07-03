from backend.database import ma 
from backend.database.dot import Dot
from backend.database.dotIcon import DotIcon
from backend.database.setName import SetName
from backend.database.set import Set
from backend.database.bandSection import BandSection
from backend.database.showUser import ShowUser
from backend.database.user import User
from backend.database.show import Show
from backend.database.school import School


class DotIconSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "show_id", "set_id", "show_user_id", "direction", "line",
			"steps", "side", "fb_steps", "fb_direction", "use_hash"
		)
		"""

		model = DotIcon
		include_fk = True
		load_instance = True


class DotSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "show_id", "set_id", "show_user_id", "direction", "line",
			"steps", "side", "fb_steps", "fb_direction", "use_hash"
		)
		"""

		model = Dot
		include_fk = True
		load_instance = True
	
	dot_icon = ma.Nested(DotIconSchema)


class SetNameSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		# fields = ("id", "name", "setID", "schoolID", "sectionID")
		model = SetName
		include_fk = True
		load_instance = True


class SetSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = Set
		include_fk = True
		load_instance = True
	
	setNames = ma.Nested(SetNameSchema)


class ShowSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = Show
		include_fk = True
		load_instance = True	


class SchoolSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = School
		include_fk = True
		load_instance = True
		load_relationships = True


class BandSectionSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = BandSection
		include_fk = True
		load_instance = True
		load_relationships = True

	set_names = ma.Nested(SetNameSchema)


class ShowUserSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		model = ShowUser
		include_fk = True
		load_instance = True
		load_relationships = True
	
	show = ma.Nested(ShowSchema)


class UserSchema(ma.SQLAlchemyAutoSchema):
	class Meta:
		"""
		fields = (
			"id", "symbol", "label", 
			"firstName", "lastName", "email", 
			"is_admin", "is_section_leader", "section"
			"activated_date", "created_date", "last_updated"
		)
		"""
		model = User
		include_fk = True
		include_relationships = True
		load_instance = True

		exclude = ("password_hash",)
	
	show_users = ma.Nested(ShowUserSchema, many=True)
