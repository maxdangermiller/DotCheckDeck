from enum import Enum
from datetime import datetime
import pytz

from database.show import Show


def init():
	# Memory Store for show data
	global show_data_cache
	show_data_cache = dict()

	# Show update tracker
	global show_update_reference
	show_update_reference = []

class UpdateType(Enum):
	SHOW = 1
	USER = 2
	SET = 3
	BAND_SECTION = 4
	SET_NAME = 5
	SHOW_USER = 6
	DOT = 7
	DOT_ICON = 8
	MAJOR_UPDATE = 9

class Update:
	def __init__(self, updateType: UpdateType, updateObj: any) -> None:
		self.updateType = updateType
		self.updateObj = updateObj
	
	def __str__(self) -> str:
		return f"Update(updateType={self.updateType}, updateObj={self.updateObj})"
	
	def __repr__(self) -> str:
		return self.__str__()

class ShowUpdate:
	def __init__(self, databaseVersion: int, updates: list[Update]) -> None:
		self.databaseVersion = databaseVersion
		self.time = datetime.now(pytz.timezone("US/Central"))
		self.updates = updates
	
	def __str__(self) -> str:
		return f"ShowUpdate(databaseVersion={self.databaseVersion}, time={self.time}), updates={self.updates}"
	
	def __repr__(self) -> str:
		return self.__str__()

# Add an update tracker
# Called when there's a change made
# dotCacheManager.addUpdate(show, show.last_update, [dotCacheManager.Update()])
def addUpdate(updateShow: Show, databaseVersion: int, updates: list[Update]):
	DELETE_THRESHOLD = 604800 # 1 Week

	# Create an update log
	newUpdateObj = ShowUpdate(databaseVersion=databaseVersion, updates=updates)

	for i in range(len(show_update_reference)):
		if show_update_reference[i]["id"] == updateShow.id:
			newUpdatesList = list()

			# Check for any outdated updates
			for oldUpdateObj in show_update_reference[i]["showUpdates"]:
				if newUpdateObj.time - oldUpdateObj.time < DELETE_THRESHOLD:
					newUpdatesList.append(oldUpdateObj)
			
			# Add newest update
			newUpdatesList.append(newUpdateObj)

			show_update_reference[i]["showUpdates"] = newUpdatesList
			return
	
	update =  {
		'id': updateShow.id,
		'showUpdates': [newUpdateObj]
	}

	print("\r\nMaking new update: ", update)
	show_update_reference.append(update)

def getUpdatesForShow(show: Show) -> list[ShowUpdate]:
	for _show in show_update_reference:
		if _show["id"] == show.id:
			return _show["showUpdates"]
	
	return []

def getUpdatesForShow(show: Show, sinceVersion: int) -> list[ShowUpdate]:
	updates = []

	for _show in show_update_reference:
		if _show["id"] == show.id:
			updates = _show["showUpdates"]
			break
	
	if len(updates) == 0:
		return []
	
	since_version_updates = list()
	since_time = -1

	for update in updates:
		if update.databaseVersion == sinceVersion:
			since_time = update.time
		
		elif since_time != -1 and update.time > since_time:
			since_version_updates.append(update)
	
	# If there aren't any updates that means all of these are from past the 'sinceVersion'
	if since_time == -1:
		return updates
		
	
	return since_version_updates

def getUpdateCodeTime(show: Show, databaseVersion: int) -> int:
	showUpdates = getUpdatesForShow(show)

	for showUpdate in showUpdates:
		if showUpdate.databaseVersion == databaseVersion:
			return showUpdate.time
		
	return -1
