import { useState, useEffect } from 'react';

const LOCAL_USER_OPTIONS_KEY = "local-user-options";

function useUserOptions(userData) {
    const [userOptions, setUserOptions] = useState({
		"showNextSet": false, "showLastSet": false, "drawPath": false,
		"highlightSection": false,
		"useSectionColors": true,
		"showMovementBrackets": false, "highlightUser": null,
		"moveSpeed": 10, "useActualSetLength": false,
		"dimOtherUsers": false, "showCollegeHash": true,
		"followingUser": false, "useCollegeHash": false
	});

    const saveUserOptions = (data) => {
        setUserOptions(data);
        window.localStorage.setItem(LOCAL_USER_OPTIONS_KEY, JSON.stringify(data));
    }

    const getLocalUserOptions = () => {
        let localUserOptions = window.localStorage.getItem(LOCAL_USER_OPTIONS_KEY);
        let parsedData = JSON.parse(localUserOptions);

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
			// console.log("Successfully loaded user preferences")
		} catch {
			// console.log("DIDN'T Find Saved User Prefs, creating new ones")
			options = {
				"showNextSet": false, "showLastSet": false, "drawPath": false,
				"highlightSection": false,
				"useSectionColors": true,
				"showMovementBrackets": false, "highlightUser": null,
				"moveSpeed": 10, "useActualSetLength": false,
				"dimOtherUsers": false, "showCollegeHash": true,
				"followingUser": false
			};
			window.localStorage.setItem(LOCAL_USER_OPTIONS_KEY, JSON.stringify(options));
		}
		
		if (userData.label !== undefined) {
			setUserOptions({...options,  "highlightUser": {"id": userData.show_user_id, "label": userData.label}, "followingUser": false});
		} else {
			setUserOptions({...options,  "highlightUser": null, "followingUser": false});
		}
    }

     // Automatically Grab The Users Info and select them for highlighting
	useEffect(() => {
		selectUserForHighlighting();
	}, [userData])


    return {
        setUserOptions: saveUserOptions,
        userOptions
    };
}

export default useUserOptions;