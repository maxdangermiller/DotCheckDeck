class Dot:
	def __init__(self, setNumb, measure, counts, steps, direction, line, side, fbSteps, fbDirection, useHash):
		self.setNumb = setNumb
		self.measure = measure
		self.counts = counts
		self.steps = steps
		self.direction = direction
		self.line = line
		self.side = side
		self.fbSteps = fbSteps
		self.fbDirection = fbDirection
		self.useHash = useHash

	def __str__(self):
		return f"Set {self.setNumb}: {self.steps} {self.direction} {self.line} on {self.side}; {self.fbSteps} {self.fbDirection} {self.useHash}, for {self.counts} counts"

	def __repr__(self):
		return f"Set {self.setNumb}: {self.steps} {self.direction} {self.line} on {self.side}; {self.fbSteps} {self.fbDirection} {self.useHash}, for {self.counts} counts"


class DotSheet:
	def __init__(self, symbol, label, dots):
		self.symbol = symbol
		self.label = label
		self.dots = dots
