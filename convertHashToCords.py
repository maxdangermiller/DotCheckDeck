def side2Convert(line) -> int:
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
    raise ValueError


def hashConvert(useHash):
    pass


def convertHashToCords(direction, line, steps, side, fbSteps, fbDirection, useHash):
    print(f"direction: {direction}, line: {line}, steps: {steps}, side: {side}, fbSteps: {fbSteps}, fbDirection: {fbDirection}, useHash: {useHash}")

    # 15 to 8 ratio
    width = 1500
    height = 800

    wHalf = width / 2

    if direction == "Inside":
        dModifier = 1
    elif direction == "":
        dModifier = 0
    else:
        dModifier = -1

    if line != "yd":
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



    relY = int(fbSteps) + (dModifier * sModifier * steps)
    y = round(relY * (height / 100))


    print(f"rel: ({relX}%, y) -> ({x}, y)")

    """
    Front Side Line: 0%
    Front Hash: 0.33375%
    Back Hash: 0.66625%
    Back Side Line 100%
    """