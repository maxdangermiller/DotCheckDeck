from admin_page import admin

from flask_admin.contrib.sqla import ModelView
from flask import session, abort

from database.dot import Dot
from database.dotIcon import DotIcon
from database.setName import SetName
from database.set import Set
from database.bandSection import BandSection
from database.showUser import ShowUser
from database.user import User
from database.show import Show
from database.school import School
from database import db

class SecureModelView(ModelView):
	def is_accessible(self):
		if "logged_in" in session:
			return True
		abort(403)


class ShowModelView(SecureModelView):
	form_excluded_columns = ('dots', )


class SchoolModelView(SecureModelView):
	form_excluded_columns = ('users', 'show_users', 'sets', 'dots', 'band_sections', 'set_names')


admin.add_view(SecureModelView(Dot, db.session))
admin.add_view(SecureModelView(DotIcon, db.session))
admin.add_view(SecureModelView(SetName, db.session))
admin.add_view(SecureModelView(Set, db.session))
admin.add_view(SecureModelView(ShowUser, db.session))
admin.add_view(SecureModelView(User, db.session))
admin.add_view(SecureModelView(BandSection, db.session))
admin.add_view(ShowModelView(Show, db.session))
admin.add_view(SchoolModelView(School, db.session))