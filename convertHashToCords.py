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
        return 1
    if useHash == "Front Hash":
        return 2/3
    if useHash == "Back Hash":
        return 1/3
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
    x = round(relX * (width / 100), 2)

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
    
    # oneStep = canvas.height / 1920 * 22.5;
    # height / 1920 * 22.5
    oneStep = height / 1920 * 22.5
    relY = (fbdModifier * fbSteps * oneStep)
    """
     relY       ?
    ------ = --------
     160      height
    """
    y = round(height * hashY + relY, 2)

    if debug:
        print(f"rel: ({relX}yd, {relY}px) -> ({x}, {y})")
    
    return x, y


# This will give the points between this and next dot
def findDirectPath(x1, y1, x2, y2, slices=16) -> list:
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


def OrderByDistance(cords):
    # Find bounds
    highX = None
    highY = None
    lowX = None
    lowY = None
    for cord in cords:
        if highX == None:
            highX = cord
            highY = cord
            lowX = cord
            lowY = cord
            print(f"Assigning Default of: ({cord['x']}, {cord['y']})")
        elif cord["x"] > highX["x"]:
            highX = cord
        elif cord["y"] > highY["y"]:
            highY = cord
        elif cord["x"] < lowX["x"]:
            lowX = cord
        elif cord["y"] < lowY["y"]:
            lowY = cord


    # Find the dot closest to center
    centerX = ((highX["x"] - lowX["x"]) / 2) + lowX["x"]
    centerY = ((highY["y"] - lowY["y"]) / 2) + lowY["y"]

    print(f"Bounds ({lowX['x']}, {lowY['y']}) -> ({highX['x']}, {highY['y']}). Center: ({centerX}, {centerY})")

    import numpy as np

    xVals = list()
    yVals = list()

    for cord in cords:
        xVals.append(cord["x"])
        yVals.append(cord["y"])

    x = np.array(xVals)
    y = np.array(yVals)

    test = [np.polyfit(x[i:(i+2)], y[i:(i+2)],2) for i in range(len(x)-1)]
    print(len(test))

