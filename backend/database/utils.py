import random
import math

def generateUpdateCode() -> int:
	return random.randint(0, math.pow(2, 31) - 1)	
