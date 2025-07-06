import json
from app import app, db
from database.school import School
from database.bandSection import BandSection
from database.set import Set
from database.show import Show
from database.user import User
from database.showUser import ShowUser

def import_backup(json_path, school_id_override):
    with open(json_path, "r") as f:
        data = json.load(f)

    with app.app_context():
        db.drop_all()
        db.create_all()

        # 1. School
        school_data = data["school"]
        school_data["id"] = school_id_override
        school_data["school_id"] = school_id_override
        school = School(**school_data)
        db.session.add(school)
        db.session.flush()

        # 2. Shows
        show_objs = {}
        for show_data in data["shows"]:
            show_data["school_id"] = school_id_override
            show = Show(**show_data)
            db.session.add(show)
            db.session.flush()
            show_objs[show.id] = show

        # 3. Sections
        section_objs = {}
        for section_data in data["sections"]:
            section_data["school_id"] = school_id_override
            section = BandSection(**section_data)
            db.session.add(section)
            db.session.flush()
            section_objs[section.id] = section

        # 4. Sets
        set_objs = {}
        for set_data in data["sets"]:
            set_data["school_id"] = school_id_override
            _set = Set(**set_data)
            db.session.add(_set)
            db.session.flush()
            set_objs[_set.id] = _set

        # 5. Users and ShowUsers
        for user_data in data["users"]:
            user_data["school_id"] = school_id_override
            user_data["school"] = school_id_override  # In case 'school' is used
            show_users_data = user_data.pop("show_users", [])
            user = User(**user_data)
            db.session.add(user)
            db.session.flush()

            for su_data in show_users_data:
                su_data["school_id"] = school_id_override
                su_data["user_id"] = user.id
                su_data["show_id"] = su_data.get("show_id")  # Already present
                su_data["section_id"] = su_data.get("section_id")
                show_user = ShowUser(**su_data)
                db.session.add(show_user)
                db.session.flush()

        db.session.commit()
        print("Backup data imported successfully.")

if __name__ == "__main__":
    school_id = int(input("Enter the school ID to use for all imported entries: "))
    import_backup("backup_data.json", school_id)