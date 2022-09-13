from turtle import Turtle


def side2Convert(line) -> int:
    if line == 50:
        return 50
    if line == 45:
        return 55
    if line == 40:
        return 60
    if line == 35:
        return 65
    if line == 30:
        return 70
    if line == 25:
        return 75
    if line == 20:
        return 80
    if line == 15:
        return 85
    if line == 10:
        return 90
    if line == 5:
        return 95
    if line == 0:
        return 100
    print(f"ERROR WITH LINE: {line}")
    raise ValueError


def hashConvert(useHash) -> float:
    if useHash == "Front side":
        return 160
    if useHash == "Front Hash":
        return 106 + 2/3
    if useHash == "Back Hash":
        return 53 + 1/3
    return 0


def convertHashToCords(direction, line, steps, side, fbSteps, fbDirection, useHash, width=750, height=400, debug=False):
    # print(f"direction: {direction}, line: {line}, steps: {steps}, side: {side},"
    #    + f" fbSteps: {fbSteps}, fbDirection: {fbDirection}, useHash: {useHash}")

    # 15 to 8 ratio
    # width = 750
    # height = 400

    wHalf = width / 2

    if direction == "Inside":
        dModifier = 1
    elif direction == "":
        dModifier = 0
    else:
        dModifier = -1

    if line != "ln":
        # Side 1 is left
        if side == 1:
            sModifier = 1
        else:
            line = side2Convert(int(line))
            sModifier = -1
    else:
        line = 50
        sModifier = 0

    ydsInStep = 0.625

    relX = int(line) + (dModifier * sModifier * steps * ydsInStep)
    x = round(relX * (width / 100))

    if fbDirection == "Behind":
        fbdModifier = -1
    elif fbDirection == "":
        fbdModifier = 0
    else:
        fbdModifier = 1

    ftInStep = 1.875

    hashY = hashConvert(useHash)

    if debug:
        print(f"{hashY} + {(fbdModifier * fbSteps * ftInStep)} = {hashY + (fbdModifier * fbSteps * ftInStep)}")
    
    relY = hashY + (fbdModifier * fbSteps * ftInStep)
    """
     relY       ?
    ------ = --------
     160      height
    """
    y = round((relY * height) / 160)

    if debug:
        print(f"rel: ({relX}yd, {relY}ft) -> ({x}, {y})")
    
    return x, y


# This will give the points between this and next dot
def findDirectPath(x1, y1, x2, y2, slices=16) -> []:
    # Calculate how much movement is happening
    difference = x2 - x1

    # print(f"({x1}, {y1}) -> ({x2}, {y2}), diff: {difference}")

    cords = list()
    
    for i in range(1, slices + 1):
        movement = (difference / slices) * i

        if x2 - x1 != 0:
            m = (y2 - y1) / (x2 - x1)
        else:
            m = 0
        # print(f"   (y2 - y1) / (x2 - x1) = ({y2} - {y1}) / ({x2} - {x1}) = {y2 - y1} / {x2 - x1}")
        x = movement

        # y = mx + b | Linear equation
        y = m * x + y1
        # print(f"y = mx + b | {y} = ({m})({x}) + {y1}")

        cords.append({"x": round(x + x1), "y": round(y)}) 
    
    return cords
