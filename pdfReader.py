import PyPDF2
from tabula import read_pdf
import dotHelperClasses


def goThroughTable(regions_raw) -> list:
	# If there isn't a dot sheet here, just return nothing
	if regions_raw[0]["extraction_method"] == "":
		return []

	skipStrings = ["cou", "counts"]

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
		if "(unnamed)" not in perfFormatted:
			performerSymbol = perfFormatted[perfFormatted.index("Symbol") + 9:perfFormatted.index("Label")].replace(" ", "")
			performerLabel = perfFormatted[perfFormatted.index("Label") + 6:].replace(" ", "")
		else:
			performerSymbol = perfFormatted[perfFormatted.index("Symbol") + 9:].replace(" ", "")
			performerLabel = "N/A"

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
			if part1[2] != "Side" and part1[2] != "On":
				setNumb = part1[0]
				measure = part1[1]
				try:
					counts = int(part1[2])
				except:
					if part1[2] in skipStrings:
						# input(f"Is \"{part2}\" a valid value that should stay, or should it be removed?")
						part1 = part1[0:2] + part1[3:]
						counts = int(part1[2])
				# print(part1)

				# When it says it's on the 50, it doesn't say side, this handles that
				if part1[3] != "On":
					side = int(part1[4].replace(":", ""))
					steps = float(part1[5].replace("On", "0"))  # The replace method is to convert On to 0, so it can be converted to a float


					# Check to see if we're on the line
					if steps != 0:
						direction = part1[7]
						line = part1[8]
					else:
						direction = ""
						line = part1[6]
						

				# This means the dot is on the 50!
				# ['16', '63-66', '16', 'On', '50', 'yd', 'ln']
				else:
					side = 0
					steps = float(part1[3].replace("On", "0"))  # The replace method is to convert On to 0, so it can be converted to a float
					direction = ""
					line = part1[4]
			else:
				setNumb = part1[0]
				measure = ""

				# counts sometimes ends up with a weird string it in, this just moves on to the next value if that's the case
				try:
					counts = int(part1[1])
				except:
					if part1[1] in skipStrings:
						part1 = part1[0:1] + part1[2:]
						counts = int(part1[1])

				if part1[2] != "On":
					side = int(part1[3].replace(":", ""))
					steps = float(part1[4].replace("On", "0"))  # The replace method is to convert On to 0, so it can be converted to a float
				else:
					side = 0
					steps = float(part1[2].replace("On", "0"))  # The replace method is to convert On to 0, so it can be converted to a float

				# Check to see if we're on the line
				if steps != 0:
					direction = part1[6]
					line = part1[7]
				elif steps == 0 and side == 0:
					direction = ""
					line = part1[3]
				else:
					direction = ""
					line = part1[5]

			part2 = regions_raw[page]["data"][x][3]["text"].split(" ")
			# ['13.0', 'steps', 'In', 'Front', 'Of', 'Front', 'Hash', '(HS)']
			# ['7.75', 'steps', 'Behind', 'Front', 'side', 'line']

			# print(part2)
			if part2[0] != "On":
				fbSteps = float(part2[0])
				fbDirection = part2[2].replace("In", "Front")
			# ['On', 'Front', 'Hash', '(HS)']
			else:
				fbSteps = 0.0
				fbDirection = "On"
			
			useHash = f"{part2[len(part2) - 3]} {part2[len(part2) - 2]}"
			
			# print(f"{useHash}: {part2}")

			dot = dotHelperClasses.Dot(setNumb, measure, counts, steps, direction, line, side, fbSteps, fbDirection, useHash)
			dots.append(dot)

		dotSheet = dotHelperClasses.DotSheet(performerSymbol, performerLabel, dots)
		dotSheets.append(dotSheet)

	return dotSheets


def pdfReader(file) -> list:

	pdfFileObj = open(file, 'rb')
	pdfReaderObj = PyPDF2.PdfReader(pdfFileObj)
	n_pages = len(pdfReaderObj.pages)

	pages = [x for x in range(1, n_pages + 1)]
	# pages = [15]
	print(f"Trying to read pages {pages}")

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
	return dotSheets


if __name__ == "__main__":
	pdfReader("Mvt-1and2.pdf")
