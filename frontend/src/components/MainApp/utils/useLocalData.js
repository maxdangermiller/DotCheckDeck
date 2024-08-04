import { useState } from 'react';

const LOCAL_SETS_KEY    = "local-sets";
const LOCAL_DATA_KEY    = "local-data";
const LOCAL_SN_DATA_KEY = "local-set-name-data";
const LOCAL_TIME_KEY    = "database-timestamp";
const LOCAL_SN_TIME_KEY = "sn-database-timestamp";

function useLocalData(isOffline) {

    const [data, setData] = useState([]);
    const [curDatabaseTimestamp, setCurDatabaseTimestamp] = useState(-1);
	const [curDatabaseSNTimestamp, setCurDatabaseSNTimestamp] = useState(-1);
    const [sets, setSets] = useState([]);

    /**
     * Grabs sets from local storage and saves them to the sets state object
     * @returns {boolean} should be updating?
     */
    const checkLocalSets = () => {
		// Check If Saved
		// Check Version number?
		let localSets = window.localStorage.getItem(LOCAL_SETS_KEY);
		try {
			if (localSets !== "" && localSets !== null) {
				let parsedSets = JSON.parse(localSets);

				if (parsedSets === undefined) { return false; }
				if (parsedSets.length === 0) { return false; }

				// Check version number
				if (!isOffline) {
					for (let i = 0; i < parsedSets.length; i++) {
						let timestamp = parsedSets[i].update_timestamp;
						if (timestamp !== curDatabaseTimestamp) {
							// Start UPDATING THOSE SETS
							return false;
						}
					}
				}

				console.log("USING LOCAL SETS!", parsedSets);
				setSets(parsedSets);
				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

    /**
     * Grabs data from local storage and saves them to the data state object
     * @returns {boolean} should be updating?
     */
	const checkLocalData = () => {
		let localData = window.localStorage.getItem(LOCAL_DATA_KEY);
		try {
			if (localData !== "" && localData !== null) {
				let parsedData = JSON.parse(localData);

				// Check version number
				if (!isOffline) {
					for (let i = 0; i < parsedData.length; i++) {
						let timestamp = parsedData[i].update_timestamp;
						if (timestamp !== curDatabaseTimestamp) {
							console.log("Found timestamp of: " + timestamp + ", when the current timestamp is: " + curDatabaseTimestamp)
							// Start UPDATING THOSE SETS
							return false;
						}
					}
				}

				if (parsedData.length < sets.length || sets.length === 0) {
					console.log("USING INCOMPLETE LOCAL DATA!", parsedData.length, sets.length);
					// setData(parsedData);
					return false;
				}

				// console.log("USING COMPLETE LOCAL DATA!");
				setData(parsedData);

				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

    /**
     * Gets data from local storage
     * @returns {Array} Local Data
     */
	// eslint-disable-next-line no-unused-vars
	const getLocalData = () => {
		try {
			let localData = window.localStorage.getItem(LOCAL_DATA_KEY);
			let parsedData = JSON.parse(localData);
			return parsedData;
		} catch {
			return [];
		}
	}

    /**
     * Save Data to local Storage and to state
     * @param {Array} newData Data to Save
     */
	const saveData = (newData) => {
		try {
            setData(newData);
			localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(newData));
			localStorage.setItem(LOCAL_TIME_KEY, curDatabaseTimestamp);
		} catch (error) {
			localStorage.clear();
		}
	}

    /**
     * Save Data to local Storage
     * @param {Array} newData Data to Save
     */
	const saveLocalData = (newData) => {
		try {
			localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(newData));
			localStorage.setItem(LOCAL_TIME_KEY, curDatabaseTimestamp);
		} catch (error) {
			localStorage.clear();
		}
	}

    /**
     * Save Sets to local Storage and to state
     * @param {Array} newSets Sets to Save
     */
	const saveSets = (newSets) => {
        setSets(newSets);
		localStorage.setItem(LOCAL_SETS_KEY, JSON.stringify(newSets));
		localStorage.setItem(LOCAL_TIME_KEY, curDatabaseTimestamp);
	}

    /**
     * Save Sets to local Storage
     * @param {Array} newSets Sets to Save
     */
	const saveLocalSets = (newSets) => {
		localStorage.setItem(LOCAL_SETS_KEY, JSON.stringify(newSets));
		localStorage.setItem(LOCAL_TIME_KEY, curDatabaseTimestamp);
	}

    /**
     * Helper Method for checkLocalSetNames()
     * @param {Array} setNames 
     */
	const updateSetNames = (setNames) => {
		let newSets = sets;
		let changedSomething = false;

		for (let i = 0; i < setNames.length; i++) {
			if (newSets[i].id === setNames[i].set_id && newSets[i].set_name !== setNames[i].set_name) {
				newSets[i].set_name = setNames[i].set_name;
				changedSomething = true;
			}
		}

		if (changedSomething) {
			setSets(newSets);
			saveLocalSets(newSets);
		}
	}

    /**
     * Grabs set names from local storage and saves them to the data state object
     * @returns {boolean} should be updating
     */
	const checkLocalSetNames = () => {
		// Check if Saved
		let localData = window.localStorage.getItem(LOCAL_SN_DATA_KEY);
		try {
			if (localData === "" || localData === null) {
				// console.log("useLocalData - checkLocalSetNames - Debug 1");
				return false;
			}

			let parsedData = JSON.parse(localData);

			if (parsedData === undefined) {
				// console.log("useLocalData - checkLocalSetNames - Debug 2");
				return false;
			}

			// If not offline, then Check the version number of each set name
			if (!isOffline) {
				for (let i = 0; i < Object.keys(parsedData).length; i++) {
					let timestamp = parsedData[i].update_timestamp;

					// console.log("Checking Timestamp: " + curDatabaseSNTimestamp + " against set name timestamp: " + timestamp)

					if (timestamp !== curDatabaseSNTimestamp) {
						// Start UPDATING THOSE SET NAMES
						// console.log("useLocalData - checkLocalSetNames - Debug 3");
						return false;
					}
				}
			}
			
			if (Object.keys(parsedData).length < sets.length || sets.length === 0) {
				// console.log("useLocalData - checkLocalSetNames - Debug 4");
				return false;
			}
			updateSetNames(parsedData);

			// console.log("useLocalData - checkLocalSetNames - Debug 5");
			return true;
		} catch {
			// console.log("useLocalData - checkLocalSetNames - Debug 6");
			return false;
		}
	}

    /**
     * Save Set Names to local storage
     * @param {Array} newSetNames set names to save
     */
	const saveLocalSetNames = (newSetNames) => {
		window.localStorage.setItem(LOCAL_SN_DATA_KEY, JSON.stringify(newSetNames));
		window.localStorage.setItem(LOCAL_SN_TIME_KEY, curDatabaseSNTimestamp);
	}
    
    /**
     * Set states for timestamps and save to local data
     * @param {Integer} timestamp current database timestamp
     * @param {Integer} sn_timestamp current Set Name timestamp
     */
    const saveCurTimestamps = (timestamp, sn_timestamp) => {
		// console.log("saving cur timestamps ", timestamp, " ", sn_timestamp);
        setCurDatabaseTimestamp(timestamp);
        // setCurDatabaseSNTimestamp(sn_timestamp);

        localStorage.setItem(LOCAL_TIME_KEY, timestamp);
        // localStorage.setItem(LOCAL_SN_TIME_KEY, sn_timestamp);
    }

    /**
     * Set state for sn timestamps and saves to local data
     * @param {Integer} sn_timestamp current Set Name timestamp
     */
    const saveSNTimestamp = (sn_timestamp) => {
		console.log("SAVING NEWEST SN TIMESTAMP!!");
        setCurDatabaseSNTimestamp(sn_timestamp);

        localStorage.setItem(LOCAL_SN_TIME_KEY, sn_timestamp);
    }

    /**
     * Gets the local timestamps
     * @returns {(Integer, Integer)} database timestamp and set name timestamp
     */
    const getLocalTimestamps = () => {
        try {
			const localTimestamp = parseInt(localStorage.getItem(LOCAL_TIME_KEY));
            const localSNTimestamp = parseInt(localStorage.getItem(LOCAL_SN_TIME_KEY));
			return { localTimestamp: localTimestamp, localSNTimestamp: localSNTimestamp }; 
		} catch (error) {
			console.log("NO SAVED TIMESTAMP!");
		}

		return null;
    }

	/**
	 * Update Specific Set Name
	 * For use in SetNameModel.js
	 * 
	 * @param {String} set_name 
	 * @param {Integer} set_id 
	 * @param {Integer} new_sn_timestamp 
	 */
	const updateSpecificSetName = (set_name, set_id, new_sn_timestamp) => {
		let newSets = sets.map((value, index) => {
			if (value.id === set_id) {
				console.log(value);
				value.set_name = set_name;
			}

			return value;
		})

		setSets(newSets);
		localStorage.setItem(LOCAL_SETS_KEY, JSON.stringify(newSets));

		setCurDatabaseSNTimestamp(new_sn_timestamp);
	}



	return {
		checkLocalSets: checkLocalSets,
		checkLocalData: checkLocalData,
		saveData: saveData,
        saveLocalData: saveLocalData,
		saveSets: saveSets,
        checkLocalSetNames: checkLocalSetNames,
        saveLocalSetNames: saveLocalSetNames,
		updateSetNames: updateSetNames,
        setCurDatabaseTimestamp: setCurDatabaseTimestamp,
        setCurDatabaseSNTimestamp: setCurDatabaseSNTimestamp,
        saveCurTimestamps: saveCurTimestamps,
		saveSNTimestamp: saveSNTimestamp,
        getLocalTimestamps: getLocalTimestamps,
		updateSpecificSetName:updateSpecificSetName,
        data,
        curDatabaseTimestamp,
        curDatabaseSNTimestamp,
        sets
	}

}

export default useLocalData;