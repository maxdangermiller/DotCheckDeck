import json
from app import app, db
from database.school import School
from database.bandSection import BandSection
from database.set import Set
from database.show import Show
from database.user import User
from database.showUser import ShowUser
from database.setName import SetName

def merge_json_data(data1, data2):
    merged = {}
    # Use school from the first file
    merged["school"] = data1["school"]
    # Merge lists, handling the case where data2 is a list (sets only)
    for key in ["sections", "shows", "users"]:
        merged[key] = data1.get(key, [])
    # 'sets' is special: data1 may have sets, data2 is a list of sets
    merged["sets"] = data1.get("sets", []) + (data2 if isinstance(data2, list) else data2.get("sets", []))
    return merged

def import_backup(json_path1, json_path2):
    with open(json_path1, "r") as f1, open(json_path2, "r") as f2:
        data1 = json.load(f1)
        data2 = json.load(f2)
        data = merge_json_data(data1, data2)

    with app.app_context():
        db.drop_all()
        db.create_all()

        # 1. School
        school_data = data["school"]
        school = School(**school_data)
        db.session.add(school)
        db.session.flush()

        # 2. Shows
        show_objs = {}
        for show_data in data["shows"]:
            show = Show(**show_data)
            db.session.add(show)
            db.session.flush()
            show_objs[show.id] = show

        # 3. Sections
        section_objs = {}
        for section_data in data["sections"]:
            section = BandSection(**section_data)
            db.session.add(section)
            db.session.flush()
            section_objs[section.id] = section

                # 4. Sets
        set_columns = {c.name for c in Set.__table__.columns}
        set_objs = {}
        set_name_tuples = set()
        for set_data in data["sets"]:
            # Collect set_name and related fields if present
            set_name = set_data.get("set_name")
            school_id = set_data.get("school_id")
            show_id = set_data.get("show_id")
            set_id = set_data.get("id")
            section_id = set_data.get("section_id")
            if set_name and school_id and show_id and set_id and section_id:
                set_name_tuples.add((set_name, school_id, show_id, set_id, section_id))
            filtered_set_data = {k: v for k, v in set_data.items() if k in set_columns}
            _set = Set(**filtered_set_data)
            db.session.add(_set)
            db.session.flush()
            set_objs[_set.id] = _set

        # 4b. Insert unique set_names into SetName table with all parameters
        for name, school_id, show_id, set_id, section_id in set_name_tuples:
            set_name_obj = SetName(
                name=name,
                school_id=school_id,
                show_id=show_id,
                set_id=set_id,
                section_id=section_id
            )
            db.session.add(set_name_obj)
        db.session.flush()

        # 5. Users and ShowUsers
        for user_data in data["users"]:
            show_users_data = user_data.pop("show_users", [])
            user = User(**user_data)
            db.session.add(user)
            db.session.flush()

            for su_data in show_users_data:
                su_data["user_id"] = user.id
                show_user = ShowUser(**su_data)
                db.session.add(show_user)
                db.session.flush()

        db.session.commit()
        print("Backup data from both files imported successfully.")

if __name__ == "__main__":
    import_backup("backup_data.json", "backup_data_2.json")