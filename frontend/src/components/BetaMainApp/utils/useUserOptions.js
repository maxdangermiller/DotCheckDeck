import { useState, useEffect } from 'react';

import { DisplayMode } from '../NormalViewer/normal_viewer_utils';

const LOCAL_USER_OPTIONS_KEY = "beta-local-user-options";

const DEFAULT_USER_OPTIONS = {
	"showNextSet": false, "showLastSet": false, "drawPath": false,
	"highlightSection": false,
	"useSectionColors": true,
	"showMovementBrackets": true, "highlightUser": null,
	"moveSpeed": 10, "useActualSetLength": false,
	"dimOtherUsers": false, "showCollegeHash": true,
	"followingUser": false, "useCollegeHash": false,
	"basicUseCollegeHash": false, "displayMode": DisplayMode.SETS_MODE
};


function useUserOptions(userData) {
    const [userOptions, setUserOptions] = useState(DEFAULT_USER_OPTIONS);


	/**
	 * Save User Options Locally and to State
	 * @param {*} data 
	 */
    const saveUserOptions = (data) => {
		// Prevent Duplicate Saves

		if(areObjectsEqual(userOptions, data)) { 
			return; 
		}

        setUserOptions(data);
        localStorage.setItem(LOCAL_USER_OPTIONS_KEY, JSON.stringify(data));
    }

	/**
	 * Sets User Options as long as it's changing something, to prevent unnecessary refreshes
	 * @param {*} data 
	 */
	const safeSetUserOptions = (data) => {
		if(!areObjectsEqual(userOptions, data)) {
			setUserOptions(data);
		}
	}


	/**
	 * 
	 * @returns {Object} dictionary of user options
	 */
    const getLocalUserOptions = () => {
        let localUserOptions = localStorage.getItem(LOCAL_USER_OPTIONS_KEY);
        let parsedData = JSON.parse(localUserOptions);

		/*
		for (const [key, value] of Object.entries(DEFAULT_USER_OPTIONS)) {
			if (!(key in parsedData)) {
				parsedData[key] = DEFAULT_USER_OPTIONS[key];
			}
		}
		*/

        // Check a random key to see if we actually have the data
        if (parsedData.dimOtherUsers === undefined) {
            throw new Error('Yeah... Sorry');
        }

        return parsedData;
    }

	/**
	 * Select User For Highlighting
	 */
    const selectUserForHighlighting = () => {
		if (userData === null) {
			return;
		}
		if (userData.is_admin && userData.label === undefined) {
			// DO NOTHING
			return;
		}
		
		if (userData.label !== undefined) {
			saveUserOptions({...userOptions,  "highlightUser": {"id": userData.show_user_id, "label": userData.label}, "followingUser": false});
		} else {
			saveUserOptions({...userOptions,  "highlightUser": null, "followingUser": false});
		}
		// console.log(userOptions)
    }

	/**
	 * Change Highlight User
	 * @param {Int} id 
	 * @param {String} label 
	 */
	const changeHighlightUser = (id, label) => {
		saveUserOptions({...userOptions, "highlightUser": {"id": id, "label": label}});
	}	


	// On Mount, load local user options
	useEffect(() => {
		let options = userOptions;
		try {
			safeSetUserOptions(getLocalUserOptions());
		} catch {
			options = DEFAULT_USER_OPTIONS;
			saveUserOptions(options);
		}
	}, []);


    // Automatically Grab The Users Info and select them for highlighting
	useEffect(() => {
		if (userData !== null) {

			selectUserForHighlighting();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userData])


    return {
        setUserOptions: saveUserOptions,
		selectUserForHighlighting: selectUserForHighlighting,
		changeHighlightUser: changeHighlightUser,
        userOptions
    };
}

export default useUserOptions;


// Utility
function areObjectsEqual(obj1, obj2) {
	// 1. Check for strict equality (same object reference or primitive values)
	if (obj1 === obj2) {
		return true;
	}

	// 2. Check if either is null or not an object
	if (obj1 === null || typeof obj1 !== 'object' ||
		obj2 === null || typeof obj2 !== 'object') {
		return false;
	}

	// 3. Get keys and compare their lengths
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) {
		return false;
	}

	// 4. Iterate through keys and recursively compare values
	for (const key of keys1) {
		if (!keys2.includes(key) || !areObjectsEqual(obj1[key], obj2[key])) {
		return false;
		}
	}

	// 5. If all checks pass, the objects are deeply equal
	return true;
}
