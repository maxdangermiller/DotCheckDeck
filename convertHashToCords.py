def convertHashToCords(direction, line, steps, side, fbSteps, fbDirection, useHash):
    # 15 to 8 ratio
    width = 1500
    height = 800

    wHalf = width / 2
    
    if direction == "Inside":
        dModifier = -1
    else:
        dModifier = 1
    print(direction)

    """
    Front Side Line: 0%
    Front Hash: 0.33375%
    Back Hash: 0.66625%
    Back Side Line 100%
    """