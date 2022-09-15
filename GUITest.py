from app import Dot, Set, Users

_curSet = 0
_sets = []

# Space Key Pressed
def increaseSet(canvasRef, width=750, height=400, modifier=1):
    global _curSet

    canvasRef.delete("all")

    if _curSet + modifier + 1 < len(_sets) and _curSet + modifier >= 0: 
        _curSet = _curSet + modifier

    drawFieldLines(c=canvasRef, width=width, height=height, setID=_sets[_curSet], nextSetID=_sets[_curSet + 1])
    renderDots(c=canvasRef, setID=_sets[_curSet], nextSetID=_sets[_curSet + 1], color="black", width=width, height=height)


def renderDots(c, setID, nextSetID, color, width, height):
    import convertHashToCords

    set = Set.query.filter(Set.setID == setID).first()
    if set == None:
        global _curSet
        _curSet = str(int(_curSet) - 1)
        
        print("OUT OF RANGE!")
        
        return

    dots = Dot.query.filter(Dot.setNumb == set.id).all()


    set2 = Set.query.filter(Set.setID == nextSetID).first()
    dots2 = Dot.query.filter(Dot.setNumb == set2.id).all()
    
    print(f"Showing set {set.setID}; with {len(dots)} dots")
    print(f"Showing set {set2.setID}; with {len(dots2)} dots")

    for i in range(len(dots)):
        dot = dots[i]
        dot2 = dots2[i]
        x, y = convertHashToCords.convertHashToCords(
            dot.direction, dot.line, dot.steps, 
            dot.side, dot.fbSteps, dot.fbDirection, 
            dot.useHash, width=width, height=height
        )
        # """
        x2, y2 = convertHashToCords.convertHashToCords(
            dot2.direction, dot2.line, dot2.steps, 
            dot2.side, dot2.fbSteps, dot2.fbDirection,
            dot2.useHash, width=width, height=height
        )
        # """
        # print(f"({x}, {y}) and ({x2, y2})")
        person = Users.query.filter(Users.id == dot.userID).first()

        c.create_oval(x-2,y-2,x+2,y+2)
        c.create_oval(x2-2,y2-2,x2+2,y2+2, outline="red")

        c.create_line(x, y, x2, y2, fill="blue")

        c.create_text(x, y - 4, text=person.label, fill=color, font=('Helvetica 8'))
        c.create_text(x2, y2 - 4, text=person.label, fill=color, font=('Helvetica 8'))


def drawFieldLines(c, width, height, setID="None", nextSetID="None"):
    for x in range(11):
        val = x * (width / 20)
        c.create_line(val, 0, val, height)
        c.create_text(val, height * 0.75, text=f"{x * 5}", fill="black", font=('Helvetica 16'))
    for x in range(11, 21):
        val = x * (width / 20)
        c.create_line(val, 0, val, height)
        c.create_text(val, height * 0.75, text=f"{(20 - x) * 5}", fill="black", font=('Helvetica 16'))

    c.create_line(0, height * (1 / 3), width, height * (1 / 3))
    c.create_line(0, height * (2 / 3), width, height * (2 / 3))

    if setID != "None" and nextSetID != "None":
        c.create_text(width * 0.9, height * 0.9, text=f"Set: {setID}", fill="black", font=('Helvetica 16'))
        c.create_text(width * 0.9, height * 0.95, text=f"Next Set: {nextSetID}", fill="black", font=('Helvetica 16'))


# For testing without web server
def GUITest(width=750, height=400):
    import tkinter as tk
    window = tk.Tk()

    window.geometry(f"{width}x{height}")

    c = tk.Canvas(window, width=width, height=height)

    global _sets
    for set in Set.query.all():
        _sets.append(set.setID)

    drawFieldLines(c=c, width=width, height=height, setID=_sets[_curSet], nextSetID=_sets[_curSet + 1])

    renderDots(c=c, setID=_sets[_curSet], nextSetID=_sets[_curSet + 1], color="black", width=width, height=height)
    
    c.pack()

    window.bind('<Right>', lambda event: increaseSet(canvasRef=c, width=width, height=height, modifier=1))
    window.bind('<Left>', lambda event: increaseSet(canvasRef=c, width=width, height=height, modifier=-1))

    window.mainloop()