import { useState, useEffect } from 'react';

const LOCAL_USER_OPTIONS_KEY = "beta-local-user-options";

const DEFAULT_USER_OPTIONS = {
	"showNextSet": false, "showLastSet": false, "drawPath": false,
	"highlightSection": false,
	"useSectionColors": true,
	"showMovementBrackets": true, "highlightUser": null,
	"moveSpeed": 10, "useActualSetLength": false,
	"dimOtherUsers": false, "showCollegeHash": true,
	"followingUser": false, "useCollegeHash": false,
	"basicUseCollegeHash": false, "displayMode": 0
};

// Display Mode: 0="sets" 1="counts"

function useUserOptions(userData) {
    const [userOptions, setUserOptions] = useState(DEFAULT_USER_OPTIONS);

    const saveUserOptions = (data) => {
        setUserOptions(data);
        localStorage.setItem(LOCAL_USER_OPTIONS_KEY, JSON.stringify(data));
    }

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

    const selectUserForHighlighting = () => {
        let options = userOptions;
		try {
			options = getLocalUserOptions();
		} catch {
			options = DEFAULT_USER_OPTIONS;
			window.localStorage.setItem(LOCAL_USER_OPTIONS_KEY, JSON.stringify(options));
		}

		
		if (userData.is_admin && userData.label === undefined) {
			// DO NOTHING
		}
		else if (userData.label !== undefined) {
			setUserOptions({...options,  "highlightUser": {"id": userData.show_user_id, "label": userData.label}, "followingUser": false});
		} else {
			setUserOptions({...options,  "highlightUser": null, "followingUser": false});
		}
		console.log(options)
    }

     // Automatically Grab The Users Info and select them for highlighting
	useEffect(() => {
		selectUserForHighlighting();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userData])


    return {
        setUserOptions: saveUserOptions,
        userOptions
    };
}

export default useUserOptions;