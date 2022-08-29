from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class Dot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setNumb = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
    personID = db.Column(db.Integer, db.ForeignKey('person.id'), nullable=False)

    direction = db.Column(db.String(16))
    line = db.Column(db.String(16))

    steps = db.Column(db.Float)
    side = db.Column(db.Integer)
    fbSteps = db.Column(db.Float)
    fbDirection = db.Column(db.String(16))
    useHash = db.Column(db.String(32))

    def __repr__(self):
        return f"Dot(setNumb:)"


class Set(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setID = db.Column(db.String(8), nullable=False)
    measure = db.Column(db.String(16))
    counts = db.Column(db.Integer, nullable=False)


class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(16))
    label = db.Column(db.String(16))

    def __str__(self) -> str:
        return f"<Person {self.symbol} {self.label}>"
    
    def __repr__(self) -> str:
        return f"<Person {self.symbol} {self.label}>"


# db.create_all()


def addAllDataFromPDF(file):
    import pdfReader

    stuff = pdfReader.pdfReader(file)
    print(stuff[0])
    for dotSheet in stuff:
        if Person.query.filter_by(symbol=dotSheet.symbol, label=dotSheet.label).first() is None:
            person = Person(symbol=dotSheet.symbol, label=dotSheet.label)
            db.session.add(person)
            db.session.commit()
        else:
            person = Person.query.filter_by(symbol=dotSheet.symbol, label=dotSheet.label).first()
            
        for dot in dotSheet.dots:
            if Set.query.filter_by(setID=str(dot.setNumb)).first() is None:
                _set = Set(setID=str(dot.setNumb), measure=dot.measure, counts=dot.counts)
                db.session.add(_set)
                db.session.commit()
            else:
                _set = Set.query.filter_by(setID=str(dot.setNumb)).first()
            print(f"Adding dot: '{dot}' to DATABASE")
            _dot = Dot(
                setNumb=_set.id, personID=person.id, direction=str(dot.direction),
                line=str(dot.line), steps=float(dot.steps), side=int(dot.side), fbSteps=float(dot.fbSteps),
                fbDirection=str(dot.fbDirection), useHash=str(dot.useHash)
            )
            db.session.add(_dot)
            db.session.commit()
    


if __name__ == "__main__":
    # addAllDataFromPDF("Mvt-1and2.pdf")
    # print(Dot.query.all())
    import convertHashToCords

    person = Dot.query.all()[0]
    convertHashToCords.convertHashToCords(
        person.direction, person.line, person.steps, 
        person.side, person.fbSteps, person.fbDirection, 
        person.useHash
    )

    