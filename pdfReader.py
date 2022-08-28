import json
import PyPDF2
from tabula import read_pdf
import dotHelperClasses


def goThroughTable(regions_raw) -> list:
	# If there isn't a dot sheet here, just return nothing
	if regions_raw[0]["extraction_method"] == "":
		return []

	# Write to a test file for debugging
	# fileWrite = open("./test.json", "w")
	# fileWrite.write(json.dumps(regions_raw, indent=4))
	dotSheets = list()

	for page in range(len(regions_raw)):
		# Store the header parts in a var
		try:
			headerData = regions_raw[page]["data"][0]
		except IndexError:
			# print("ERROR")
			continue

		# Looks like this: "Performer:Symbol: FLabel: 1"
		perfFormatted = headerData[0]['text'].replace(":", ": ").replace("Label", "  Label")  # The header comes as one line but needs some formatting
		performerSymbol = perfFormatted[perfFormatted.index("Symbol") + 9:perfFormatted.index("Label")].replace(" ", "")
		performerLabel = perfFormatted[perfFormatted.index("Label") + 6:].replace(" ", "")

		# print(f"Reading:  \"{performerSymbol}: {performerLabel}\"")

		dots = list()

		# Skip 0 and 1 indices because they are the header and column labels respectively
		# Also skip the last index because it gives the print date
		for x in range(2, len(regions_raw[page]["data"]) - 1):
			# When the data is loaded it combines the set, measure, count, and right-left columns for some reason
			part1 = regions_raw[page]["data"][x][0]["text"].split(" ")

			# ['22A', '93-94', '8', 'Side', '1:', '3.0', 'steps', 'Outside', '45', 'yd', 'ln']
			# print(part1)

			# Check to see if this is opening set
			if part1[2] != "Side":
				setNumb = part1[0]
				measure = part1[1]
				counts = int(part1[2])

				# When it says it's on the 50, it doesn't say side, this handles that
				if part1[3] != "On":
					side = int(part1[4].replace(":", ""))
					steps = float(part1[5].replace("On", "0"))  # The replace method is to convert On to 0, so it can be converted to a float

					# Check to see if we're on the line
					if steps != 0:
						direction = part1[7]
						line = part1[8]
					else:
						direction = None
						line = part1[7]

				# This means the dot is on the 50!
				# ['16', '63-66', '16', 'On', '50', 'yd', 'ln']
				else:
					side = None
					steps = float(part1[3].replace("On", "0"))  # The replace method is to convert On to 0, so it can be converted to a float
					direction = None
					line = part1[4]
			else:
				setNumb = part1[0]
				measure = None
				counts = int(part1[1])
				side = int(part1[3].replace(":", ""))
				steps = float(part1[4].replace("On", "0"))  # The replace method is to convert On to 0, so it can be converted to a float

				# Check to see if we're on the line
				if steps != 0:
					direction = part1[6]
					line = part1[7]
				else:
					direction = None
					line = part1[6]

			part2 = regions_raw[page]["data"][x][3]["text"].split(" ")
			# ['13.0', 'steps', 'In', 'Front', 'Of', 'Front', 'Hash', '(HS)']
			# ['7.75', 'steps', 'Behind', 'Front', 'side', 'line']

			# print(part2)
			if part2[0] != "On":
				fbSteps = float(part2[0])
				fbDirection = part2[2].replace("In", "Front")
				if direction == "Front":
					useHash = f"{part2[5]} {part2[6]}"
				else:
					useHash = f"{part2[3]} {part2[4]}"
			# ['On', 'Front', 'Hash', '(HS)']
			else:
				fbSteps = 0
				fbDirection = "On"
				useHash = f"{part2[1]} {part2[2]}"

			dot = dotHelperClasses.Dot(setNumb, measure, counts, steps, direction, line, side, fbSteps, fbDirection, useHash)
			dots.append(dot)

		dotSheet = dotHelperClasses.DotSheet(performerSymbol, performerLabel, dots)
		dotSheets.append(dotSheet)

	return dotSheets


def pdfReader(file):

	pdfFileObj = open(file, 'rb')
	pdfReaderObj = PyPDF2.PdfFileReader(pdfFileObj)
	n_pages = pdfReaderObj.getNumPages()

	pages = [x for x in range(1, n_pages + 1)]
	# pages = [18, 19]
	print(f"Trying to read pages {pages}")

	dotSheets = list()

	# Read the top right table in json
	regions_raw = read_pdf(file, pages=pages, area=[0, 0, 50, 50], relative_area=True, output_format="json")
	dotSheets = goThroughTable(regions_raw)

	regions_raw = read_pdf(file, pages=pages, area=[0, 50, 50, 100], relative_area=True, output_format="json")
	dotSheets = dotSheets + goThroughTable(regions_raw)

	regions_raw = read_pdf(file, pages=pages, area=[50, 0, 100, 50], relative_area=True, output_format="json")
	dotSheets = dotSheets + goThroughTable(regions_raw)

	regions_raw = read_pdf(file, pages=pages, area=[50, 50, 100, 100], relative_area=True, output_format="json")
	dotSheets = dotSheets + goThroughTable(regions_raw)

	print(f"Just read {len(dotSheets)} dot sheets")


if __name__ == "__main__":
	pdfReader("Mvt-1and2.pdf")
