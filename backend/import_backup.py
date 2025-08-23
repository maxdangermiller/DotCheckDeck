import json
from app import app, db
from database.school import School
from database.bandSection import BandSection
from database.set import Set
from database.show import Show
from database.user import User
from database.showUser import ShowUser
from database.setName import SetName
from datetime import datetime

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

def convert_date_str(value):
    try:
        return datetime.strptime(value["created_date"], "%Y-%b-%dT%H:%M:%S.%f")
    except:
        return None

def import_backup(json_path1, json_path2):
    with open(json_path1, "r") as f1, open(json_path2, "r") as f2:
        data1 = json.load(f1)
        data2 = json.load(f2)
        data = merge_json_data(data1, data2)

    with app.app_context():
        # db.drop_all()
        # db.create_all()

        # 2. Shows
        show_id = input("Add everything to Show ID: ")
        imp_show_id = input("Get everything from Show ID: ")
        show = Show.query.filter(Show.id == show_id).first()

        if show is None:
            print("ID DOSEN'T EXIST! Quitting!")
            return

        # 3. Sections
        section_objs = {}
        for section_data in data["sections"]:
            section = BandSection.query.filter(BandSection.name == section_data["name"]).first()

            if section is None:
                # section_data["created_date"] = convert_date_str(section_data["created_date"])
                # section_data["last_updated"] = convert_date_str(section_data["last_updated"])
                # section_data["last_updated_date"] = convert_date_str(section_data["last_updated_date"])

                section = BandSection(**section_data)
                db.session.add(section)
            else:
                section.color_r = section_data["color_r"]
                section.color_g = section_data["color_g"]
                section.color_b = section_data["color_b"]

            section_objs[section.id] = section

        # Add all the band sections
        db.session.commit()
        

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

            # Save the Set Name to add in step 4b
            if set_name and school_id and show_id and set_id and section_id:
                set_name_tuples.add((set_name, school_id, show_id, set_id, section_id))

            _set = Set.query.filter(Set.set_numb == set_data["set_numb"]).first()

            if _set is None:
                print(f"Set {set_data['set_numb']} can't be found")
                """
                filtered_set_data = {k: v for k, v in set_data.items() if (k in set_columns and k is not "id")}
                filtered_set_data = {
                    "start_time_code": set_data["start_time_code"],
                    "end_time_code": set_data["end_time_code"],
                    "notes": set_data["notes"],
                    "set_numb": set_data["set_numb"],
                    "counts": set_data["start_time_code"],
                    
                }
                _set = Set(**filtered_set_data)
                """
            else:
                _set.start_time_code = set_data["start_time_code"]
                _set.end_time_code = set_data["end_time_code"]
                _set.notes = set_data["notes"]      
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

        db.session.commit()
        # db.session.flush()

        # 5. Users and ShowUsers
        for user_data in data["users"]:
            user = User.query.filter(User.email == user_data["email"]).first()

            if user is None:
                user = User(
                    email = user_data["email"], 
                    first_name = user_data["first_name"], 
                    last_name = user_data["last_name"], 
                    is_admin = user_data["is_admin"], 
                    send_admin_email = user_data["send_admin_email"], 
                    school_id = show.school_id, 
                    last_updated = convert_date_str(user_data["last_updated"]),
                    created_date = convert_date_str(user_data["created_date"]), 
                    activated_date = convert_date_str(user_data["activated_date"]), 
                    verified_date = convert_date_str(user_data["verified_date"]), 
                    last_login = convert_date_str(user_data["last_login"]), 
                )
                db.session.add(user)

            show_user_data = {}

            for show_user_dict in user_data["show_users"]:
                # print(f"{show_user_dict['show_id']} == {imp_show_id}", show_user_dict)
                if int(show_user_dict["show_id"]) == int(imp_show_id):
                    show_user_data = show_user_dict
                    break

            if len(show_user_data.items()) is not 0:

                show_user = ShowUser.query.filter(
                    ShowUser.label == show_user_data["label"], 
                    ShowUser.symbol == show_user_data["symbol"], 
                    ShowUser.show_id == show.id
                ).first()

                if show_user is not None:
                    show_user.user = user
                    show_user.band_section = 
                else:
                    print(f"SHOW USER {show_user_data['label']}  {show_user_data['symbol']}")
            else:
                print(f"SHOW USER {show_user_data}")


        db.session.commit()
        print("Backup data from both files imported successfully.")

if __name__ == "__main__":
    import_backup("backup_data.json", "backup_data_2.json")