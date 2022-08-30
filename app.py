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
        return f"Dot({self.setNumb})"


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
            print(f"Adding dot: '{dot}' to DATABASE [SET {_set.setID}]")
            _dot = Dot(
                setNumb=_set.setID, personID=person.id, direction=str(dot.direction),
                line=str(dot.line), steps=float(dot.steps), side=int(dot.side), fbSteps=float(dot.fbSteps),
                fbDirection=str(dot.fbDirection), useHash=str(dot.useHash)
            )
            db.session.add(_dot)
            db.session.commit()



if __name__ == "__main__":
    # addAllDataFromPDF("Mvt-1and2.pdf")
    
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

    set = Set.query.all()[34]
    
    dots = Dot.query.filter(Dot.setNumb == set.setID).all()
    
    print(f"Showing set {set.setID}; with {len(dots)} dots")

    for dot in dots:
        x, y = convertHashToCords.convertHashToCords(
            dot.direction, dot.line, dot.steps, 
            dot.side, dot.fbSteps, dot.fbDirection, 
            dot.useHash
        )
        # print(f"({x}, {y})")
        person = Person.query.filter(Person.id == dot.personID).first()

        c.create_oval(x-2,y-2,x+2,y+2)
        # print(person.label)
        c.create_text(x, y - 4, text=person.label, fill="black", font=('Helvetica 8'))
        
    
    c.pack()
    
    window.mainloop()