from calendar import c
from enum import unique
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_restful import Api, Resource
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
ma = Marshmallow(app)
api = Api(app)


class Dot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setNumb = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
    userID = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    direction = db.Column(db.String(16))
    line = db.Column(db.String(16))

    steps = db.Column(db.Float)
    side = db.Column(db.Integer)
    fbSteps = db.Column(db.Float)
    fbDirection = db.Column(db.String(16))
    useHash = db.Column(db.String(32))

    def __repr__(self):
        return f"Dot({self.setNumb})"


class Set(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setID = db.Column(db.String(8), nullable=False)
    measure = db.Column(db.String(16))
    counts = db.Column(db.Integer, nullable=False)


class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(16))
    label = db.Column(db.String(16))
    email = db.Column(db.String(128), unique=True)
    """
    password_hash = db.Column(db.String(128))
    firstName = db.Column(db.String(64))
    lastName = db.Column(db.String(64))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __str__(self) -> str:
        return f"<User {self.firstName} {self.lastName} > {self.symbol} {self.label}>"
    
    def __repr__(self) -> str:
        return f"<User {self.firstName} {self.lastName} > {self.symbol} {self.label}>"
    """


# Uncomment when resetting the database
# db.create_all()

# Serializers
class DotSchema(ma.Schema):
    class Meta:
        fields = (
            "id", "setNumb", "userID", "direction", "line", 
            "steps", "side", "fbSteps", "fbDirectsion", "useHash"
        )
        model = Dot


class SetSchema(ma.Schema):
    class Meta:
        fields = ("id", "setID", "measure", "counts")
        model = Set
 

class UsersSchema(ma.Schema):
    class Meta:
        fields = ("id", "symbol", "label")
        model = Users


dot_schema = DotSchema()
dots_schema = DotSchema(many=True)
set_schema = SetSchema()
sets_schema = SetSchema(many=True)
user_schema = UsersSchema()
users_schema = UsersSchema(many=True)


# API

class DotListResource(Resource):
    def get(self):
        setNumb = request.args.get('set_numb', None)
        userID = request.args.get('user_id', None)
        print(userID)

        if setNumb is not None and userID is not None:
            dots = Dot.query.filter(Dot.setNumb == setNumb, Dot.userID == userID).all()
        elif setNumb is not None:
            dots = Dot.query.filter(Dot.setNumb == setNumb).all()
        elif userID is not None:
            dots = Dot.query.filter(Dot.userID == userID).all()
        else:
            dots = Dot.query.all()

        return dots_schema.dump(dots)


class SetListResource(Resource):
    def get(self):
        setID = request.args.get('set_id', None)
        measure = request.args.get('measure', None)

        if setID is not None and measure is not None:
            sets = Set.query.filter(Set.setID == setID, Set.measure == measure).all()
        elif setID is not None:
            sets = Set.query.filter(Set.setID == setID).all()
        elif measure is not None:
            sets = Set.query.filter(Set.measure == measure).all()
        else:
            sets = Set.query.all()

        return sets_schema.dump(sets)


class UsersListResource(Resource):
    # Dynamic Option: https://blog.mindee.com/flask-sqlalchemy/
    def get(self):
        users = Users.query.all()

        return users_schema.dump(users)
    """
    def post(self):
        user = Users.query.filter(
            title=request.json['title'],
            content=request.json['content']
        ).first()
    """



api.add_resource(DotListResource, '/dots')
api.add_resource(SetListResource, '/sets')
api.add_resource(UsersListResource, '/users')


# For use to build database
# TODO: Move to an API call
def addAllDataFromPDF(file):
    import pdfReader

    stuff = pdfReader.pdfReader(file)
    print(stuff[34])
    for dotSheet in stuff:
        if Users.query.filter_by(symbol=dotSheet.symbol, label=dotSheet.label).first() is None:
            user = Users(symbol=dotSheet.symbol, label=dotSheet.label)
            db.session.add(user)
            db.session.commit()
        else:
            user = Users.query.filter_by(symbol=dotSheet.symbol, label=dotSheet.label).first()
            
        for dot in dotSheet.dots:
            if Set.query.filter_by(setID=str(dot.setNumb)).first() is None:
                _set = Set(setID=str(dot.setNumb), measure=dot.measure, counts=dot.counts)
                db.session.add(_set)
                db.session.commit()
            else:
                _set = Set.query.filter_by(setID=str(dot.setNumb)).first()
            print(f"Adding dot: '{dot}' to DATABASE [SET {_set.setID}]")
            _dot = Dot(
                setNumb=_set.id, userID=user.id, direction=str(dot.direction),
                line=str(dot.line), steps=float(dot.steps), side=int(dot.side), fbSteps=float(dot.fbSteps),
                fbDirection=str(dot.fbDirection), useHash=str(dot.useHash)
            )
            db.session.add(_dot)
            db.session.commit()


# For testing without web server
def GUITest():
    import tkinter as tk
    window = tk.Tk()

    window.geometry("750x400")

    c= tk.Canvas(window, width=750, height=400)

    for x in range(11):
        val = x * (750 / 20)
        c.create_line(val, 0, val, 400)
        c.create_text(val, 300, text=f"{x * 5}", fill="black", font=('Helvetica 16'))
    for x in range(11, 21):
        val = x * (750 / 20)
        c.create_line(val, 0, val, 400)
        c.create_text(val, 300, text=f"{(20 - x) * 5}", fill="black", font=('Helvetica 16'))


    import convertHashToCords

    set = Set.query.all()[31]
    print(set.setID)
    dots = Dot.query.filter(Dot.setNumb == set.setID).all()

    set2 = Set.query.all()[33]
    print(set2.setID)
    dots2 = Dot.query.filter(Dot.setNumb == set2.setID).all()
    
    print(f"Showing set {set.setID}; with {len(dots)} dots")

    for i in range(len(dots)):
        dot = dots[i]
        dot2 = dots2[i]
        x, y = convertHashToCords.convertHashToCords(
            dot.direction, dot.line, dot.steps, 
            dot.side, dot.fbSteps, dot.fbDirection, 
            dot.useHash
        )
        x2, y2 = convertHashToCords.convertHashToCords(
            dot2.direction, dot2.line, dot2.steps, 
            dot2.side, dot.fbSteps, dot2.fbDirection, 
            dot2.useHash
        )
        # print(f"({x}, {y})")
        person = Users.query.filter(Users.id == dot.userID).first()

        c.create_oval(x-2,y-2,x+2,y+2)
        c.create_oval(x2-2,y2-2,x2+2,y2+2)

        c.create_line(x, y, x2, y2)

        # for thing in convertHashToCords.findDirectPath(x, y, x2, y2):
        #    c.create_oval(thing['x'] - 2, thing['y']- 2, thing['x'] + 2, thing['y'] + 2)

        # print(person.label)
        c.create_text(x, y - 4, text=person.label, fill="black", font=('Helvetica 8'))
        
    
    c.pack()
    
    window.mainloop()


if __name__ == "__main__":
    # addAllDataFromPDF("Mvt-1and2.pdf")

    GUITest()
    
    # app.run(debug=True)
    