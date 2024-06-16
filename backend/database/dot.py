from database import ma, db
from cache import regions, CacheableMixin, query_callable
from datetime import datetime
from database.utils import generateUpdateCode
import math


class Dot(CacheableMixin, db.Model):
	cache_label = "dot"
	cache_regions = regions
	query_class = query_callable(regions)

	id = db.Column(db.Integer, primary_key=True)

	# Relationships
	school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
	show_id = db.Column(db.Integer, db.ForeignKey('show.id'), nullable=False)
	set_id = db.Column(db.Integer, db.ForeignKey('set.id'), nullable=False)
	show_user_id = db.Column(db.Integer, db.ForeignKey('show_user.id'), nullable=False)
	dot_icon_id = db.Column(db.Integer, db.ForeignKey('dot_icon.id'), nullable=True)

	# Data
	direction = db.Column(db.String(16))
	line = db.Column(db.String(16))
	steps = db.Column(db.Float)
	side = db.Column(db.Integer)
	fb_steps = db.Column(db.Float)
	fb_direction = db.Column(db.String(16))
	use_hash = db.Column(db.String(32))

	# Timestamps
	created_date = db.Column(db.DateTime, default=datetime.now, nullable=True)
	last_updated_date = db.Column(db.DateTime, default=None, nullable=True, onupdate=datetime.now)
	last_updated = db.Column(db.Integer, default=None, nullable=True, onupdate=generateUpdateCode())

	def __repr__(self):
		return f"Dot({self.show_user_id} ->{self.id})"

	def __str__(self):
		return f"Dot({self.show_user_id} ->{self.id})"

	def posToBits(self):
		"""
		Position To Bits
		
		Keyword arguments:
		argument -- description
		Return: 29 bits representing the position information

		(direction: 2 bits)(line: 4 bits)(steps: 8 bits)(side: 1 bit)
		(fb_steps: 10 bits)(fb_direction: 2 bits)(use_hash: 2 bits)
		10 1101 00000000 0 0000000000 00 00
		"""

		output = 0

		output += (self.directionToBits() << 27)
		output += (self.lineToBits() << 23)
		output += (self.stepsToBits(self.steps) << 15)
		output += (self.sideToBits() << 14)
		output += (self.stepsToBits(self.fb_steps) << 4)
		output += (self.fbDirToBits() << 2)
		output += self.hashToBits()

		# print(bin(output))

		return output
	
	def posFromBits(self, binary):
		"""
		Position From Bits
		
		Keyword arguments:
		binary -- binary 29 bits representing the position information
		Return: return_description
		"""
		
		bDir 		= int(binary >> 27)
		bLine 		= int(binary % math.pow(2, 27)) >> 23
		bSteps	 	= int(binary % math.pow(2, 23)) >> 15
		bSide 		= int(binary % math.pow(2, 15)) >> 14
		bFBSteps	= int(binary % math.pow(2, 14)) >> 4
		bFBDir 		= int(binary % math.pow(2, 4)) >> 2
		bHash 		= int(binary % math.pow(2, 2))

		print(f"{bDir} = {self.directionToBits()} = {self.directionFromBits(bDir)} = {self.direction}")
		print(f"{bLine} = {self.lineToBits()} = {self.lineFromBits(bLine)} = {self.line}")
		print(f"{bSteps} = {self.stepsToBits(self.steps)} = {self.stepsFromBits(bSteps)} = {self.steps}")
		print(f"{bSide} = {self.sideToBits()} = {self.sideFromBits(bSide)} = {self.side}")
		print(f"{bFBSteps} = {self.stepsToBits(self.fb_steps)} = {self.stepsFromBits(bFBSteps)} = {self.fb_steps}")
		print(f"{bFBDir} = {self.fbDirToBits()} = {self.fbDirFromBits(bFBDir)} = {self.fb_direction}")
		print(f"{bHash} = {self.hashToBits()} = {self.hashFromBits(bHash)} = {self.use_hash}")


		# self.direction = self.directionFromBits(bDir)
		# self.line = self.lineFromBits(bLine)
		# self.steps = self.stepsFromBits(bSteps)
		# self.side = self.sideFromBits(bSide)
		# self.fb_steps = self.stepsFromBits(bFBSteps)
		# self.fb_direction = self.fbDirFromBits(bFBDir)
		# self.use_hash = self.hashFromBits(bHash)

	def directionToBits(self):
		"""
		Direction to Bits
		
		Keyword arguments:
		Return: two bits 0-2 representing the definition
		"""
		
		if (self.direction == "On"):
			return 0
		
		if (self.direction == "Inside"):
			return 1
		# Must be Outside
		return 2

	def directionFromBits(self, bits):
		"""
		Direction From Bits
		
		Keyword arguments:
		bits -- 0-2
		Return: direction string
		"""
		
		if (bits == 0):
			return "On"

		if (bits == 1):
			return "Inside"
		
		return "Outside"

	def lineToBits(self):
		"""
		Line to Bits
		
		Keyword arguments:
		argument -- description
		Return: four bits 0-10
		"""
		
		return int(int(self.line) / 5)

	def lineFromBits(self, bits):
		"""
		Line From Bits
		
		Keyword arguments:
		bits -- 0-10
		Return: line (ie 5, 10..., 50)
		"""
		
		return bits * 5

	def stepsToBits(self, steps):
		"""
		Steps to bits
		
		Keyword arguments:
		steps -- either fb_steps or steps
		Return: 8-10 bits
		"""

		"""
		Round to One digit
		NUMB|DECIMAL
		000000|0000
		
		Decimal representations
		0.0: 	0
		0.1: 	1
		0.2: 	2
		0.25: 	3
		0.3		4
		0.4		5
		0.5		6
		0.6		7
		0.7		8
		0.75	9
		0.8		10
		0.9		11
		"""
		
		stepsModified = int(steps) << 4
		decimal = steps % 1
		# System.out.println(steps + " " + stepsModified + " " + decimal)
		if (self.compareDecimal(decimal, 0.1)):
			return stepsModified + 1
		
		if (self.compareDecimal(decimal, 0.2)):
			return stepsModified + 2
		
		if (self.compareDecimal(decimal, 0.25)):
			return stepsModified + 3
		
		if (self.compareDecimal(decimal, 0.3)):
			return stepsModified + 4
		
		if (self.compareDecimal(decimal, 0.4)):
			return stepsModified + 5
		
		if (self.compareDecimal(decimal, 0.5)):
			return stepsModified + 6
		
		if (self.compareDecimal(decimal, 0.6)):
			return stepsModified + 7
		
		if (self.compareDecimal(decimal, 0.7)):
			return stepsModified + 8
		
		if (self.compareDecimal(decimal, 0.75)):
			return stepsModified + 9
		
		if (self.compareDecimal(decimal, 0.8)):
			return stepsModified + 10
		
		if (self.compareDecimal(decimal, 0.9)):
			return stepsModified + 11
		
		return stepsModified
	
	def stepsFromBits(self, binarySteps):
		"""
		Steps from bits
		
		Keyword arguments:
		binarySteps -- 8-10 bits, generated by stepsToBits()
		Return: steps
		"""
		
		integer = binarySteps >> 4
		decimal = binarySteps % int(math.pow(2, 4))

		# System.out.println()
		# System.out.println(Long.toBinaryString(binarySteps))
		# System.out.println(Long.toBinaryString(integer) + " > " + integer)
		# System.out.println(Long.toBinaryString(decimal) + " > " + decimal)
		# System.out.println()

		if (decimal == 1):
			return integer + 0.1
		
		if (decimal == 2):
			return integer + 0.2
		
		if (decimal == 3):
			return integer + 0.25
		
		if (decimal == 4):
			return integer + 0.3
		
		if (decimal == 5):
			return integer + 0.4
		
		if (decimal == 6):
			return integer + 0.5
		
		if (decimal == 7):
			return integer + 0.6
		
		if (decimal == 8):
			return integer + 0.7
		
		if (decimal == 9):
			return integer + 0.75
		
		if (decimal == 10):
			return integer + 0.8
		
		if (decimal == 11):
			return integer + 0.9
		

		return integer
	
	def sideToBits(self):
		"""
		Side to Bits
		
		Keyword arguments:
		Return: 1 bit representing the side
		"""
		
	
		return self.side - 1
	
	def sideFromBits(self, bits):
		"""
		Side From Bits
		
		Keyword arguments:
		bits -- 0-1
		Return: side 1-2
		"""
		
		return bits + 1
	
	def fbDirToBits(self):
		"""
		Forward-Backward Direction to Bits
		
		Keyword arguments:
		argument -- description
		Return: 2 bits
		"""
		
		if (self.fb_direction == "On"):
			return 0
		
		if (self.fb_direction == "Front"):
			return 1
		
		# Must be Behind
		return 2
	
	def fbDirFromBits(self, bits):
		"""
		FB Direction From Bits
		
		Keyword arguments:
		bits -- 0-3
		Return: fb Direction string
		"""
		
		if (bits == 0): 
			return "On"
		
		if (bits == 1):
			return "Front"
		
		return "Behind"
	
	def hashToBits(self):
		"""
		Hash To Bits
		
		Keyword arguments:
		Return: 2 bits
		"""
		
	
		if (self.use_hash == "Front side"):
			return 0
		
		if (self.use_hash == "Front Hash"):
			return 1
		
		if (self.use_hash == "Back Hash"):
			return 2
		
		# Must be Back Side
		return 3
	
	def hashFromBits(self, bits):
		"""
		Hash From Bits
		
		Keyword arguments:
		bits -- 0-3
		Return: hash string
		"""
		
		if (bits == 0):
			return "Front Side"
		
		if (bits == 1):
			return "Front Hash"
		
		if (bits == 2):
			return "Back Hash"
		
		return "Back Side"
	
	def compareDecimal(self, a, b):
		"""
		Compare decimals, and see if theres less than a threshold of 0.01 between them
		
		Keyword arguments:
		a -- decimal A
		b -- decimal B
		Return: if they're close to the same
		"""
		
		return int(((a - b) * 100)) == 0
	