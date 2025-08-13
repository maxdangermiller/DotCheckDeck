from email.policy import default
from flask import Flask, request
from flask_restful import Resource
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required
import pytz
import json
import time
from enum import Enum

import storage as storage

from database.dot import Dot
# from database.dotIcon import DotIcon
from database.setName import SetName
from database.set import Set
from database.bandSection import BandSection
from database.showUser import ShowUser
from database.user import User
from database.show import Show
from database.school import School
from database.schemas import DotSchema, DotIconSchema, SetNameSchema, SetSchema, BandSectionSchema, ShowUserSchema, UserSchema, ShowSchema, SchoolSchema


import dotCacheManager

DATA_LOAD_SIZE = 8


def constructDotLink(dot: Dot) -> dict:
	if dot.dot_icon_id is not None:
		return {
			"id": dot.id, 
			"dot_info": dot.posToBits(), 
			"dot_icon_id": dot.dot_icon_id, 
			"dot_icon": DotIconSchema().dump(dot.dot_icon)
		}

	return {"id": dot.id, "dot_info": dot.posToBits(), "dot_icon_id": None, "dot_icon": None}


def getDotLinks(sets, showUser: ShowUser) -> list[dict]:
	dots = list()

	for set in sets:
		dot = Dot.query.filter(Dot.set_id == set.id, Dot.show_user_id == showUser.id).first()

		# Some Show Users (like drum majors) don't have dots
		if dot is not None:
			dots.append(dot)

	dotCords = list()

	for i in range(len(dots)):
		curDot = dots[i]

		prevDotInfo = None
		curDotInfo = constructDotLink(curDot)
		nextDotInfo = {"id": -1, "dot_info": -1, "dot_icon_id": -1}
		
		# Check if there IS a previous dot
		if i - 1 >= 0:
			prevDot = dots[i - 1]
			prevDotInfo = constructDotLink(prevDot)

		# Check if there IS a next dot
		if i + 1 < len(dots):
			nextDot = dots[i + 1]
			nextDotInfo = constructDotLink(nextDot)

		# Create Default Set Name
		setName = ""
		
		if showUser.section_id is not None:
			setNameObj = SetName.query.filter(SetName.section_id == showUser.section_id, SetName.set_id == curDot.set_id).first()

			if setNameObj is not None:
				setName = setNameObj.name

		dotCords.append({
			"set_id": curDot.set_id,
			"set_name": setName,
			"counts": sets[i].counts,
			
			"cur_dot": curDotInfo,
			"next_dot": nextDotInfo,
			"prev_dot": prevDotInfo
		})

	return dotCords


def getShowUserData(showUser: ShowUser, sets: list[Set]):
	dotLinks = getDotLinks(sets, showUser)
	
	user = User.query.filter(User.id == showUser.user_id).first()
	# bandSection = BandSection.query.filter(BandSection.id == showUser.section_id).first()

	userInfo = {"id": -1, "first_name": "None", "last_name": None}

	if user is not None:
		userInfo = {
			"id": user.id,
			"first_name": user.first_name,
			"last_name": user.last_name
		}

	return {
		"show_user": {
			"id": showUser.id,
			"symbol": showUser.symbol,
			"label": showUser.label,
			"is_section_leader": showUser.is_section_leader,
			"is_locked": showUser.is_locked,
			"is_prop": showUser.is_prop,
			"is_stationary": showUser.is_stationary,
			# "created_date": showUser.created_date,
			"last_updated": showUser.last_updated,
			# "last_updated_date": showUser.last_updated_date,

			"band_section_id": showUser.section_id,
			# "section_color_r": bandSection.color_r,
			# "section_color_g": bandSection.color_g,
			# "section_color_b": bandSection.color_b
		},
		"user": userInfo,
		"dot_links": dotLinks
	}


def getShowData(show: Show) -> dict:

	"""
	"sets": [
		{
			"id": 109,
			"set_numb": "1",
			"counts": 16,
			"total_counts": 16,
			"measure": "measure",
			"start_time_code": -1,
			"end_time_code": -1,
			"show_index": 0,
			"notes": "NOTES"
		}
		...
	],
	"users": [
		{
			"id": 0,
			"email": "EMAIL",
			"first_name": "Henry",
			"last_name": "Schaefer",
			"password_hash": "PASSWORD"
		}
		...
	],
	"band_sections": [
		{
			"id": 32,
			"r": 0,
			"g": 0,
			"b": 0
		}
	],
	"show_users": [
		{
			"show_user": {
				"id": 0,
				"symbol": "D",
				"label": "D9",
				"is_section_leader": true,
				"is_locked": false,
				"is_prop": false,
				"is_stationary": false,
				"created_date": "null",
				"last_updated": 0,
				"last_updated_date": "null"
			},
			"user": {
				"id": 0,
				"first_name": "Henry",
				"last_name": "Schaefer"
			},
			"dot_links": [
				{
					"counts": 16,
					"set_id": 109,
					"last_dot": {"id": 69,"dot_info": 346048773,"dot_icon_id": null},
					"cur_dot": {"id": 7910,"dot_info": 202917640,"dot_icon_id": null}
				}
				...
			]
		}
		...
	]

	"""

	# Define the final dictionary returned
	out = {}

	# Get all sets in the show
	sets = Set.query.filter(Set.show_id == show.id).order_by(Set.showIndex).all()
	showUsers = ShowUser.query.filter(ShowUser.show_id == show.id).all()
	bandSections = BandSection.query.filter(BandSection.show_id == show.id).all()

	# ADD SETS
	set_out = list()

	for _set in sets:
		set_out.append({
			"id": _set.id,
			"set_numb": _set.set_numb,
			"counts": _set.counts,
			"total_counts": _set.total_counts,
			"measure": _set.measure,
			"start_time_code": _set.start_time_code,
			"end_time_code": _set.end_time_code,
			"show_index": _set.showIndex,
			"notes": _set.notes
		})

	out["sets"] = set_out

	# ADD BAND SECTIONS

	band_sections_out = list()

	for bandSection in bandSections:
		band_sections_out.append({
			"id": bandSection.id,
			"name": bandSection.name,
			"r": bandSection.color_r,
			"g": bandSection.color_g,
			"b": bandSection.color_b
		})

	out["band_sections"] = band_sections_out


	# ADD SHOW USERS & USERS

	# There is supposed to be a section with passwords and emails in this method, 
	# but we don't want that sent to the end user so it's commented out here.
	# usersOut = list()
	showUsersOut = list()

	for showUser in showUsers:
		# Drum Majors don't have dots, so we don't want to add them to data
		if showUser.is_drum_major:
			continue

		showUsersOut.append(getShowUserData(showUser=showUser, sets=sets))

	out["show_users"] = showUsersOut

	out["update_version"] = show.last_update
	out["total_data_sections"] = int(len(showUsersOut) / DATA_LOAD_SIZE) 

	print("SAVING NEW CACHE")
	# with open(f"cache/dots-new/{show.id}.json", "w") as outfile:
	# 	json.dump(out, outfile, indent=4)

	dotCacheManager.show_data_cache[show.id] = out
	
	return out


"""
Audit the data in the cache for a given show

Keyword arguments:
show -- the show in question
sinceVersion -- the update version int of the user
Return: boolean indicating whether there was a change made or not
"""
def auditCacheData(show: Show, data: dict, sinceVersion: int) -> bool:
	if sinceVersion is None:
		sinceVersion = show.last_update
	
	showUpdates = dotCacheManager.getUpdatesForShow(show, sinceVersion)

	if len(showUpdates) == 0:
		print("NO UPDATES NEEDED")
		return False

	for showUpdate in showUpdates:
		updates = showUpdate.updates

		for update in updates:
			print(update.updateType)

			# SHOW UPDATE
			# DO NOTHING
			

			# USER UPDATE
			if update.updateType == dotCacheManager.UpdateType.USER:
				id = update.updateObj["id"]
				user = User.query.filter(User.id == id).first()

				if user is None:
					print(f"Invalid update for a user with id of {id} that doesn't exist")
					continue

				for i in range(len(data["show_users"])):
					userInfo = data["show_users"][i]

					if (userInfo["user"]["id"] == id):
						data["show_users"][i]["user"] = {
							"id": user.id,
							"first_name": user.first_name,
							"last_name": user.last_name
						}
						break


			
			# SET UPDATE
			elif update.updateType == dotCacheManager.UpdateType.SET:
				id = update.updateObj["id"]
				set = Set.query.filter(Set.id == id).first()

				if set is None:
					print(f"Invalid update for a set with id of {id} that doesn't exist")
					continue

				for i in range(len(data["sets"])):
					if (data["sets"][i]["id"] == id):
						data["sets"][i] = {
							"id": set.id,
							"set_numb": set.set_numb,
							"counts": set.counts,
							"total_counts": set.total_counts,
							"measure": set.measure,
							"start_time_code": set.start_time_code,
							"end_time_code": set.end_time_code,
							"show_index": set.showIndex,
							"notes": set.notes
						}
						break


			# BAND SECTION UPDATE
			elif update.updateType == dotCacheManager.UpdateType.BAND_SECTION:
				id = update.updateObj["id"]
				bandSection = BandSection.query.filter(BandSection.id == id).first()

				if bandSection is None:
					print(f"Invalid update for a Band Section with id of {id} that doesn't exist")
					continue

				for i in range(len(data["band_sections"])):
					bandSectionInfo = data["band_sections"][i]

					if (bandSectionInfo["id"] == id):
						data["band_sections"][i] = {
							"id": bandSection.id,
							"name": bandSection.name,
							"r": bandSection.color_r,
							"g": bandSection.color_g,
							"b": bandSection.color_b
						}
						break
			

			# SET NAME UPDATE
			elif update.updateType == dotCacheManager.UpdateType.SET_NAME:
				id = update.updateObj["id"]
				setName = SetName.query.filter(SetName.id == id).first()

				if setName is None:
					print(f"Invalid update for a Set Name with id of {id} that doesn't exist")
					continue

				for i in range(len(data["show_users"])):
					if data["show_users"][i]["show_user"]["band_section_id"] == setName.section_id:
						for j in range(len(data["show_users"][i]["dot_links"])):
							if data["show_users"][i]["dot_links"][j]["set_id"] == setName.set_id:
								data["show_users"][i]["dot_links"][j] = {
									"set_id": data["show_users"][i]["dot_links"][j]["set_id"],
									"counts": data["show_users"][i]["dot_links"][j]["counts"],
									"set_name": setName.name,
									"cur_dot": data["show_users"][i]["dot_links"][j]["cur_dot"],
									"next_dot": data["show_users"][i]["dot_links"][j]["next_dot"]
								}
								break
						break


			# SHOW USER UPDATE
			elif update.updateType == dotCacheManager.UpdateType.SHOW_USER:
				id = update.updateObj["id"]
				showUser = ShowUser.query.filter(ShowUser.id == id).first()

				if showUser is None:
					print(f"Invalid update for a show user with id of {id} that doesn't exist")
					continue

				sets = Set.query.filter(Set.show_id == show.id).all()
				
				for i in range(len(data["show_users"])):
					showUserInfo = data["show_users"][i]
					
					if showUserInfo["show_user"]["id"] == showUser.id:
						data["show_users"][i] = getShowUserData(showUser=showUser, sets=sets)
			

			# DOT UPDATE
			elif update.updateType == dotCacheManager.UpdateType.DOT:
				id = update.updateObj["id"]
				dot = Dot.query.filter(Dot.id == id).first()

				if dot is None:
					print(f"Invalid update for a Dot with id of {id} that doesn't exist")
					continue

				doneCurDot = False
				doneNextDot = False

				for i in range(len(data["show_users"])):
					if data["show_users"][i]["show_user"]["id"] == dot.show_user_id:
						for j in range(len(data["show_users"][i]["dot_links"])):
							if data["show_users"][i]["dot_links"][j]["cur_dot"]["id"] == dot.id:
								data["show_users"][i]["dot_links"][j]["cur_dot"] = {
									"id": dot.id,
									"dot_info": dot.posToBits(), 
									"dot_icon_id": dot.dot_icon_id
								}
								doneCurDot = True
							elif data["show_users"][i]["dot_links"][j]["next_dot"]["id"] == dot.id:
								data["show_users"][i]["dot_links"][j]["next_dot"] = {
									"id": dot.id,
									"dot_info": dot.posToBits(), 
									"dot_icon_id": dot.dot_icon_id
								}
								doneNextDot = True
							
							if doneCurDot and doneNextDot:
								break
						break


			# DOT ICON UPDATE
			# DO NOTHING

			# MAJOR UPDATE
			elif update.updateType == dotCacheManager.UpdateType.MAJOR_UPDATE:
				getShowData(show)
				# No need to process anything else
				return True


		data["update_version"] = showUpdate.databaseVersion


	dotCacheManager.show_data_cache[show.id] = data

	return True


def getBufferedShowUsers(data: dict, dataSection: int, dataLoadSize: int) -> list:
	numShowUsers = len(data["show_users"])
	dataSectionSize = int(numShowUsers / dataLoadSize)
	startIndex = 0 + dataSection * dataSectionSize
	endIndex = startIndex + dataSectionSize
	
	# Make sure the end won't give an out of bound error
	if endIndex > numShowUsers:
		endIndex = numShowUsers

	print(startIndex, endIndex)

	# var to store all of the sets
	out = list()
	
	for i in range(startIndex, endIndex):
		out.append(data["show_users"][i])

	return out


def getBufferedDotsNew(show: Show, dataSection: int, userDatabaseVersion: int):

	if len(dotCacheManager.show_data_cache) == 0:
		return getShowData(show)

	try:
		data = dotCacheManager.show_data_cache[show.id]
		lastDataSection = int(len(data["show_users"]) / DATA_LOAD_SIZE) 

		if dataSection * DATA_LOAD_SIZE >= len(data["show_users"]):
			return {"error": "Data Section Out Of Range", "msg": f"Data Section Out Of Range. Last Section is {lastDataSection}"}

		output = {}

		# Only show sets and band sections if it's the first data section
		if dataSection == 0:
			output["sets"] = data["sets"]
		
		output["band_sections"] = data["band_sections"]

		output["show_users"] = getBufferedShowUsers(data, dataSection, DATA_LOAD_SIZE)
		output["update_version"] = data["update_version"]
		output["total_data_sections"] = lastDataSection

		if userDatabaseVersion is -1:
			userDatabaseVersion = output["update_version"]

		auditCacheData(show, data, userDatabaseVersion)
			
		return output
	except Exception as error:
		print("Error: ", error)
		return getShowData(show)



class APIGetData(Resource):
	@jwt_required()
	def get(self):
		showCode = request.args.get('show_code', None)
		dataSection = int(request.args.get('data_section', 0))

		# Allow a user to pass what database version they're currently on
		userDatabaseVersion = int(request.args.get('database_version', -1))

		# REQUIRE A SHOW CODE
		if showCode is None:
			return "Missing Show Code", 404

		# Attempt to load the Show with that code
		show = Show.query.filter(Show.code == showCode).first()

		# Check to see if we got a show obj
		if show is None:
			return "INVALID SHOW CODE", 404

		return getBufferedDotsNew(show, dataSection, userDatabaseVersion), 200
	