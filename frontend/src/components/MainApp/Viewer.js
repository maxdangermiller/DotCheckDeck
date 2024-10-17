import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";

import Canvas from './Canvas'
import ViewerSideBar from './ViewerComponents/ViewerSideBar';
import getApi from '../utils/getApi';
import CustomDownloadProgress from './ViewerComponents/CustomDownloadProgress';
import UserInfoDialogue from './ViewerComponents/UserInfoDialogue';
import UpdatePrompt from '../utils/UpdatePrompt';
import UserSectionSelection from '../utils/UserSectionSelection';
import FollowUserBtn from './ViewerComponents/FollowUserBtn';

import AppNavBar from './MainAppNavBar/AppNavBar';

import logo from '../../icons/logo.svg';

// Utilities
import useLocalData from './utils/useLocalData';
import useUserOptions from './utils/useUserOptions';

import './Viewer.css';
import 'bootstrap/dist/css/bootstrap.css';

const WINDOW_LOCATION = getApi();

const darkTheme = createTheme({
	palette: {
	  mode: 'dark',
	},
});

let audio = null;
let lastCheckedVersionTime = 0;
const MIN_TIMESTAMP_INTERVAL = 120000;  // 2 minutes


const Viewer = (props) => {
	const { token, showCode, userData, showID, isOffline, logout } = props;

	const {set_numb_param} = useParams();

	const [curSet, setCurSet]  = useState(0);                                                   // Store current index of the show
	const [audioPlaying, setAudioPlaying] = useState(false);                                    // Is the audio playing?
	const [curPlayTime, setCurPlayTime] = useState(0);                                          // Current Play Time in Show
	const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);     // Check if we're in landscape
	const [hoverUserInfo, setHoverUserInfo] = useState({show: false, dot: null});               // Store Data about the user that's being hovered over (ie Name & Label)
	const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);                            // Show Prompt To Ask If We Should Update
	const [newestTimestamps, setNewestTimestamps] = useState({"data": -1, "sn": -1});           // Store what the newest available timestamp is
    const [isDownloading, setIsDownloading] = useState(false);                                  // Are we CAPTIVE downloading
    const [downloadingProgress, setDownloadingProgress] = useState(0);                          // What percentage is done?

    // Use Local Data
    const { 
        // Methods
        checkLocalSets,
		checkLocalData,
		saveData,
        saveLocalData,
		saveSets,
        checkLocalSetNames,
        saveLocalSetNames,
        updateSetNames,
        setCurDatabaseTimestamp,
        setCurDatabaseSNTimestamp,
        saveCurTimestamps,
		saveSNTimestamp,
        getLocalTimestamps,
		updateSpecificSetName,  // For SetNameModel.js
        // Vars
        data,
        curDatabaseTimestamp,
        curDatabaseSNTimestamp,
        sets
    } = useLocalData(isOffline);

    // Use Local Options
    const {
        setUserOptions, userOptions
    } = useUserOptions(userData);


    const setInput = useRef(null);
	const canvasRef = useRef(null);


	/**
	 * Get If User Has Show User For Show
	 * @returns {boolean} if user has a show user for the show thats being viewed
	 */
	const getIfUserHasShowUserForShow = () => {
		if (userData["show_users"].length === 0) {
			return false;
		}

		for (let i = 0; i < userData["show_users"].length; i++) {
			let showUser = userData["show_users"][i];
			if (showUser["show"]["code"] === showCode) {
				return true;
			}
		}

		return false;
	}

    /**
     * Call when an update is requested by user
     * Takes the most up to date timestamps and sets the current timestamps
     */
	const changeTimestampsToNewUpdate = () => {
		console.log("Initiating Update!")
        saveCurTimestamps(newestTimestamps.data, curDatabaseSNTimestamp);
		setShowUpdatePrompt(false);

		console.log(getLocalTimestamps())
		startCaptiveDownload(newestTimestamps.data);
	}

    /**
     * Fetch the newest update timestamps!
     */
	const getDatabaseVersion = () => {
        const { localTimestamp, localSNTimestamp } = getLocalTimestamps();

		// console.log(localTimestamp, localSNTimestamp);

		if (isOffline) {
			console.log("Detected offline usage")
			if (localTimestamp !== null && localSNTimestamp !== null) {
				setCurDatabaseTimestamp(localTimestamp);
				setCurDatabaseSNTimestamp(localSNTimestamp);
			} else {
				window.location.href = "/login";
			}
			return;
		}

		// If we just updated less than MIN_TIMESTAMP_INTERVAL seconds ago, don't update
		let curTime = (new Date()).getTime();
		if (curTime - lastCheckedVersionTime <= MIN_TIMESTAMP_INTERVAL) { 
			if (localTimestamp !== curDatabaseTimestamp || localSNTimestamp !== curDatabaseSNTimestamp) {
				console.log("Using old data")
				setCurDatabaseTimestamp(localTimestamp);
				setCurDatabaseSNTimestamp(localSNTimestamp);
			}
			return;
		}

		if (showCode === undefined || showCode === "undefined") {
			window.location.href = "/error?message=Invalid Show Code! The API sent over something invalid, or the cookie was not saved";
			return;
		}

		setShowUpdatePrompt(false);

		console.log("Getting updated database version")
		fetch(WINDOW_LOCATION + "/database-version?show_code=" + showCode + "&token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
					console.log("(getDatabaseVersion) -> ", result.timestamp, result.set_name_timestamp, "Old time stamps: ", localTimestamp, localSNTimestamp)

					
					// If any timestamps are COMPLETELY missing, then we must save them
					if (localTimestamp === null || localSNTimestamp === null || isNaN(localTimestamp) || isNaN(localSNTimestamp)) {
						saveCurTimestamps(result.timestamp, result.set_name_timestamp);
					}
					
					// If either timestamps are outdated...
					else if (localTimestamp !== result.timestamp || localSNTimestamp !== result.set_name_timestamp) {
						// If it's the main dot data then show update prompt
						if (localTimestamp !== result.timestamp) {
							setShowUpdatePrompt(true);
						}

						// If it's just set names, then just update the set name timestamp
						if (localSNTimestamp !== result.set_name_timestamp) {
							saveSNTimestamp(result.set_name_timestamp);
							checkSetNames();
							
						}

						// Save what are the newest timestamps for a captive download
						setNewestTimestamps({data: result.timestamp, sn: result.set_name_timestamp});

						// Check if the newest timestamp is different from the one actually loaded in data
						if (localTimestamp !== curDatabaseTimestamp || localSNTimestamp !== curDatabaseSNTimestamp) {
							console.log("Using outdated data with older database version number")
							setCurDatabaseTimestamp(localTimestamp);
							setCurDatabaseSNTimestamp(localSNTimestamp);
						}
					}

					// Check if the newest timestamp is different from the one actually loaded in data
					else if (localTimestamp !== curDatabaseTimestamp || localSNTimestamp !== curDatabaseSNTimestamp) {
						console.log("Using outdated data with older database version number")
						setCurDatabaseTimestamp(localTimestamp);
                    	setCurDatabaseSNTimestamp(localSNTimestamp);
					}

					lastCheckedVersionTime = curTime;
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
	}

    // Data Handling
    /**
     * Get the data given a VALID setIndex from the /get-dots API endpoint
     * @param {Array} _sets 
     * @param {Integer} set_index 
     * @param {Integer} show_code 
     * @param {String} _token 
     * @returns {AxiosPromise} axios request
     */
    const retrieveDataFromAPI = (_sets, set_index, show_code, _token) => {
        const url1 = WINDOW_LOCATION + "/get-dots?show_code=" + show_code 
			+ "&set=" + _sets[set_index]["set_numb"] + "&token=" + _token;
			
        return axios({
            method: "GET",
            url:url1,
        });
    }

    /**
     * Gets the first hole in the loaded valid data
     * @param {Array} _data 
     * @param {Array} _sets 
     * @param {Integer} timestamp 
     * @param {Boolean} checkTimestamp 
     * @returns {Integer} index that needs to be loaded
     */
    const findFirstBufferHole = (_data, _sets, timestamp, checkTimestamp) => {
        const BUFFER_SIZE = 4;
        
		let indices = [];
        for (let i = 0; i < _data.length; i++) {
            indices.push(_data[i]["index"]);
        }

        for (let i = 0; i < _sets.length; i++) {
            let foundValid = false;

            for (let j = 0; j < indices.length; j++) {
                const correctIndex = _sets[i]["showIndex"] === indices[j];
                const correctTimestamp = _data[i]["update_timestamp"] === timestamp || !checkTimestamp;
                // console.log(correctIndex, correctTimestamp, _sets[i], _data[i], timestamp)
                if (correctIndex && correctTimestamp) {
                    foundValid = true;
                    indices.splice(j, 1);
                    break;
                }
            }

            if (!foundValid) {
                let value = i + BUFFER_SIZE;
                let out = value < sets.length ? value : i;
				return out;
            }
        }

        return -1;
    }

    /**
	 * This takes all of the buffered sets and makes a formatted list for debug
	 * @param {array} _data 
	 * @param {array} _sets 
	 * @returns void
	 */
	const convertIndicesListToRangeString = (_data, _sets) => {
		let curStartRange = -1;
		let string = "";

		for (let i = 0; i < _sets.length; i++) {
			if (curStartRange === -1 && _data[i] !== undefined) {
				curStartRange = i;
			}
			else if (curStartRange !== -1 && _data[i] === undefined) {
				if (string === "") {
					string = _data[curStartRange].setNumb + "-" + _data[i - 1].setNumb;
				} else {
					string = string + ", " + _data[curStartRange].setNumb + "-" + _data[i - 1].setNumb;
				}
				curStartRange = -1;
			}
			// console.log(string, _data[i]);
		} 

		if (curStartRange !== -1) {
			if (string === "") {
				string = _data[curStartRange].setNumb + "-" + _data[_sets.length - 1].setNumb;
			} else {
				string = string + ", " + _data[curStartRange].setNumb + "-" + _data[_sets.length - 1].setNumb;
			}
		}

		return string;
	}

    /**
     * Recursive method for processing a captive download
     * @param {Array} localData 
     * @param {Array} localSets 
     * @param {Integer} timestamp 
     */
    const captiveDownload = (localData, localSets, timestamp, depth) => {
        if (depth >= 15) {
			window.location.href = "/error?message=An Unknown Problem Occurred. (Captive Download Error 1)\r\nIt is recommended to press the 'Reset Client' button&return=/app";
            return;
        }

        // Check if a download was started without valid set data
        if (sets === undefined || sets === null || sets.length === 0) {
            return;
        }
 
        // Get the first place that needs to be updated
        let useSetIndex = findFirstBufferHole(localData, sets, timestamp, false);

        // Base Case
        // If we're buffered then don't worry about calling the API
		if (useSetIndex === -1) { 
			console.log("DATA FULLY DOWNLOADED! Set count: " + localData.length);
			saveData(localData);
			setIsDownloading(false); 
            setShowUpdatePrompt(false);

			if (newestTimestamps.data === -1) {
				getDatabaseVersion();
			}
			else {
				saveCurTimestamps(newestTimestamps.data, curDatabaseSNTimestamp);
			}

			return; 
		}

        try {
            retrieveDataFromAPI(localSets, useSetIndex, showCode, token).then((response) => {      
                for (let i = 0; i < response.data["data"].length; i++) {
                    const setNumb = response.data["data"][i]["index"];
                    localData[setNumb] = response.data["data"][i];
                }
                
                console.log("Currently have loaded set(s): " + convertIndicesListToRangeString(localData, sets) + ".")
                
                setDownloadingProgress(parseInt(localData.length / sets.length * 100));
                console.log(localData);
                
                saveLocalData(localData);

				if (response.data["data-timestamp"] !== newestTimestamps.data || response.data["set_name_timestamp"] !== newestTimestamps.sn) {
					setNewestTimestamps(response.data["data-timestamp"], response.data["set_name_timestamp"])
				}
                
                // Recurse
                captiveDownload(localData, localSets, timestamp, depth + 1);
            }).catch((error) => {
                console.log(error)
                if (error.response && (error.response.status === 401 || error.response.status === 400)) {
                    console.log(error.response)

                    // window.location.href = "/login";
					window.location.href = "/error?message=Unauthorized! Try logging in again&return=/login";
                } else if (error.response && error.response.status === 404) {
                    window.location.href = "/error?message=An Unknown Problem Occurred. \r\nIt is recommended to press the 'Reset Client' button&return=/app";
                }
            })
        } catch (error) {
            window.location.href = "/error?message=An Unknown Problem Occurred. \r\nIt is recommended to press the 'Reset Client' button&return=/app";
        }


    }

    /**
     * Start Captive Download
     */
    const startCaptiveDownload = (timestamp) => {
        setIsDownloading(true);
		setDownloadingProgress(0);

		try {
			captiveDownload([], sets, timestamp, 0);
		} catch (error) {
			window.location.href = "/error?message=An Unknown Error occurred. Press 'Go Back' to return&return=/app";
		}
    }

    /**
     * Check Current Data
     */
    const checkCurData = () => {
        // Wait until both sets and curDatabaseTimestamp are loaded
		if (sets.length === 0 || curDatabaseTimestamp === "") {
			console.log("Currently missing sets and or timestamp", sets.length, curDatabaseTimestamp)
			// Stall for time
			return;
		} 

		if (checkLocalData()) {
			// Display the quick view if we have the query param
			// TODO: Figure out Later
			/*
			if (set_numb_param !== undefined) {
				changeCurSetWithSetNumb(set_numb_param);
			}
			*/

			return;
		}

		if (data.length !== 0) {
			// Display the quick view if we have the query param
			// TODO: Figure out Later
			/*
			if (set_numb_param !== undefined) {
				changeCurSetWithSetNumb(set_numb_param);
			}
			*/

			return;	
		}

		// START DOWNLOAD
		startCaptiveDownload(curDatabaseTimestamp);
    }
    
    /**
     * Check Set Names
     */
    const checkSetNames = () => {
		try {
			if (!getIfUserHasShowUserForShow()) { return; }
			if (sets.length === 0) { return; }
			if (checkLocalSetNames()) { return; }

			console.log("Updating set names!")

			fetch(WINDOW_LOCATION + "/get-set-names?show_code=" + showCode + "&token=" + token)
				.then(res => res.json())
				.then(
					(result) => {
						console.log("Got Updated Set Names: ", result);
						saveLocalSetNames(result);
						updateSetNames(result);
					},
					// Note: it's important to handle errors here
					// instead of a catch() block so that we don't swallow
					// exceptions from actual bugs in components.
					(error) => {
						console.log(error);
					}
			);
		} catch (error) {
			console.log("ERROR " + error);
		}
	}

    // Update Viewer Effect
    useEffect(() => {
		try {
			getDatabaseVersion();
			checkCurData();
			checkSetNames();
		} catch (error) {
			console.log("ERROR " + error);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [curSet, sets, curDatabaseTimestamp])
    
    // On initial open, call the API and get all of the sets
    useEffect(() => {
		try {
			if (curDatabaseTimestamp === -1) { return; }
			if (!checkLocalSets()) {
				fetch(WINDOW_LOCATION + "/sets?show_code=" + showCode + "&token=" + token)
					.then(res => res.json())
					.then(
						(result) => {
							// console.log(result)
							saveSets(result);
						},
						// Note: it's important to handle errors here
						// instead of a catch() block so that we don't swallow
						// exceptions from actual bugs in components.
						(error) => {
							console.log(error);
						}
				);
			}
		} catch (error) {
			console.log("ERROR " + error);
		}
    	// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [curDatabaseTimestamp])

	// Get Audio From API
	useEffect(() => {
		if (isOffline) { return; }
		audio = new Audio(WINDOW_LOCATION + "/get-audio?school_code=" + showCode + "&token=" + token);
		audio.load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

    // If audio isn't null, play if audioPlaying is true
	useEffect(() => {
		if (audio === null) { return; }
		if (audioPlaying) {
			audio.loop = false;
			audio.play();
		} else {
			audio.pause();
		}
	}, [audioPlaying])

	// Check to see if we're in landscape, if not display a "Rotate Please" message
	useEffect(() => {
		function handleResize() {
			console.log('resized to: ', window.innerWidth, 'x', window.innerHeight)
			setIsLandscape(window.innerWidth > window.innerHeight)
	  	}
	  
		window.addEventListener('resize', handleResize)
		window.addEventListener('orientationchange', handleResize)
	}, [])

    /**
     * Change Current Set Index to Supplied Value and Sync Audio
     * @param {Integer} x set index
     */
	const changeCurSet = (x) => {
		if (x >= 0 && x < sets.length && curSet !== x) {
			console.log("Changing set");
			setCurSet(x);
		}
	}

	/**
	 * Change Current Set Index given a set number string
	 * @param {String} set_numb 
	 * @returns void
	 */
	const changeCurSetWithSetNumb = (set_numb) => {
		for (let x = 0; x < sets.length; x++) {
			if (sets[x]["set_numb"].toLowerCase() === set_numb.toLowerCase()) {
				changeCurSet(x);
				return;
			}
		}
	}

    /**
     * Change Current Set Index to Supplied Value
     * @param {Integer} x direction (either -1 or 1)
     */
	const handelSetBtnControls = (x) => {
		if (isCountsMode()) {
			const start_time_code = sets[curSet].start_time_code;
			const end_time_code = sets[curSet].end_time_code;
			const counts = sets[curSet].counts;

			if (counts === 0){
				audio.currentTime = sets[curSet + x]["start_time_code"] / 1000;
				setCurPlayTime(sets[curSet + x]["start_time_code"] / 1000);
				setCurSet(curSet + x);
				return;
			}

			const curTime = curPlayTime * 1000 - start_time_code;
			const length = end_time_code - start_time_code;
			const msInCount = length / counts;
			const curCount = parseInt(curTime / msInCount);

            const newMSTime = (curCount + x) * msInCount + start_time_code + 1;
			const newCount = parseInt(newMSTime / msInCount);

			console.log(`${curCount}/${counts} (${curTime}) > ${newCount}/${counts} (${newMSTime})`);

			if (curSet === sets.length - 1 && newMSTime > end_time_code) {
				return;
			}

			updateSetBasedOnAudioTime(newMSTime);
			setCurPlayTime(newMSTime / 1000);
			audio.currentTime = newMSTime / 1000;

			return;
		}

		const setIndex = curSet;
		
		// IS IN SET DISPLAY MODE
		if (setIndex + x >= 0 && setIndex + x < sets.length) {
			if (!audioPlaying) {
				changeCurSet(setIndex + x);
			} 

            if (audio !== null && sets[setIndex + x]["start_time_code"] !== null) {
				audio.currentTime = sets[setIndex + x]["start_time_code"] / 1000;
				setCurPlayTime(sets[setIndex + x]["start_time_code"] / 1000);
				// console.log("Changing cur play time to " + sets[setIndex + x]["start_time_code"] / 1000)
			} else {
				console.log("Something is wrong with audio or start_time_code for this set!", audio, sets[setIndex + x])
			}
		}
	}

    /**
     * Method to handle input from set number input
     * @param {Event} event 
     */
	const changeCurSetNumb = (event) => {
        if (event.key !== "Enter") { return; }
		event.preventDefault();
		for (let x = 0; x < sets.length; x++) {
			if (sets[x]["set_numb"].toLowerCase() === event.target.value.toLowerCase()) {
				
				if (!audioPlaying) {
					changeCurSet(x);
				} 
	
				if (audio !== null && sets[x]["start_time_code"] !== null) {
					audio.currentTime = sets[x]["start_time_code"] / 1000;
					setCurPlayTime(sets[x]["start_time_code"] / 1000);
					console.log("Changing cur play time to " + sets[x]["start_time_code"] / 1000)
				} else {
					console.log("Something is wrong with audio or start_time_code for this set!", audio, sets[x])
				}

                setInput.current.blur();
				return;
			}
		}
        console.log("Didn't find set number: " + event.target.value);
	}

    /**
     * Is a given set within a given time?
     * @param {Object} set 
     * @param {Integer} curTime 
     * @returns {Boolean} is the set within the curTime
     */
    const isSetWithinTime = (set, curTime) => {
		// console.log("Checking if it's already within time: ", curTime)
        if (set["start_time_code"] !== null && set["end_time_code"] !== null) {
            let startTime = set["start_time_code"];
            let endTime = set["end_time_code"];

            return curTime >= startTime && curTime < endTime;
        }
        return false;
    }

    /**
     * Get the set that's synced with the audio
     * @returns {void}
     */
	const getAudioSyncedSet = () => {
		if (audio === null) { return; }
        if (sets.length === 0) { return; }
		let msElapsed = audio.currentTime * 1000;

        // Find if we're within the current set
        if (isSetWithinTime(sets[curSet], msElapsed)) {
            return;
        }

        let start = 0;

        // If the msElapsed is already past the current set, we know it must be past in the array
        if (sets[curSet]["end_time_code"] < msElapsed) {
            start = curSet;
        }


		for (let i = start; i < sets.length; i++) {
			if (sets[i]["start_time_code"] !== null && sets[i]["end_time_code"] !== null) {
				let startTime = sets[i]["start_time_code"];
				let endTime = sets[i]["end_time_code"];

				if(msElapsed >= startTime && msElapsed < endTime) {
					// console.log("Setting " + sets[i].set_numb + " to cur set (syncing with audio)")
					// sets[i] is currently active
					if (curSet !== i) {
						changeCurSet(i);
						return;
					}
				}
			}
		}
	}

	/**
     * Get if the user has selected counts display mode
     * @returns {boolean} If the display mode is counts
     */
    const isCountsMode = () => {
        return userOptions["displayMode"] === 1;
    }

	/**
	 * With a time code, sync the set
	 * @param {Integer} time_code in milliseconds!
	 */
	const updateSetBasedOnAudioTime = (time_code) => {
		const setsWithinTime = isSetWithinTime(sets[curSet], time_code);

		if (isCountsMode() && setsWithinTime) {
			return;
		} 

		// Must be in sets display mode or the next set in counts mode

		// Find if we're within the current set
        if (setsWithinTime) {
            return;
        }

		// console.log("New Time of: ", time_code);

        let start = 0;

        // If the msElapsed is already past the current set, we know it must be past the current set in the array
        if (sets[curSet]["end_time_code"] < time_code) {
            start = curSet;
        }


		for (let i = start; i < sets.length; i++) {
			if (sets[i]["start_time_code"] !== null && sets[i]["end_time_code"] !== null) {
				let startTime = sets[i]["start_time_code"];
				let endTime = sets[i]["end_time_code"];

				if(time_code >= startTime && time_code < endTime) {
					// sets[i] is currently active
					if (curSet !== i) {
						// console.log("Setting " + sets[i].set_numb + " to cur set (syncing with audio)", i)
						setCurSet(i);
						return;
					} else {
						console.log("THIS SHOULDN'T HAPPEN!")
					}
				}
			}
		}
	}

    /**
     * Get all the set data at curSet
     * @returns {Object} set info 
     */
    const getCurSetInfo = () => {
        return sets[curSet];
    }
    
    /**
     * Get the set number at curSet
     * @returns {String} set number 
     */
    const getCurSetNumb = () => {
        if (sets[curSet] === undefined) {
            return ""
        }
        return sets[curSet]["set_numb"];
    }

	/**
	 * Is Admin Authorized?
	 * @returns {Boolean} is authed
	 */
	const isAdminAuthorized = () => {
		if (token === "" || token === undefined || isOffline) {
			return false;
		}

		if (userData !== undefined && userData["is_admin"] !== undefined) {
			return userData["is_admin"];
		}
		return false;
	}

    // Return if downloading
	if (isDownloading) {
		return (
			<ThemeProvider theme={darkTheme}><section className="gradient-custom fullScreen">
				<div className="d-flex flex-column justify-content-center align-items-center fullScreen">
					<AppNavBar 
						token={token} 
						loggedIn={token !== "" && token !== undefined} 
						logout={logout}
						data={data} 
						curSet={curSet} 
						isOffline={isOffline}
						userData={userData}
						showSetInfo={false}
					/>
					
					<div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">
						<div className="col-12 col-md-8 col-lg-6 col-xl-5 loginFormHeight">
							<div className="card bg-dark text-white loginFormHeight" style={{borderRadius: '1rem'}}>
								<div className="card-body p-5 text-center loginFormTextHeight">
									<div className='flex-column justify-content-center d-flex align-items-center' style={{height: "100%"}}>
										<img src={logo} alt="" width="40%" height="40%" />
										<div className="mb-md-5 mt-md-4">
											<h2 className="fw-bold mb-2 text-uppercase">Downloading</h2>

											<CustomDownloadProgress variant="determinate" value={downloadingProgress} />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section></ThemeProvider>
		);
	}

    // Return if landscape
	if (!isLandscape) {
		return (
			<div className="d-flex flex-column justify-content-center align-items-center fullScreen">
				<AppNavBar 
					token={token} 
					loggedIn={token !== "" && token !== undefined} 
					logout={logout}
					data={data} 
					curSet={curSet} 
					isOffline={isOffline}
					userData={userData}
					showSetInfo={false}
				/>
				<div className="flex-column justify-content-center d-flex align-items-center ViewerFullScreen">
					<h1>Rotate Please</h1>
					<h2>or switch to basic mode</h2>
					<button className='btn btn-primary' onClick={(e) => {window.location.href = "/app/basic"}}>Open Basic</button>
					<UserSectionSelection 
						data={data} 
						curSet={curSet} 
						showCode={showCode} 
						token={token} 
						userData={userData}
						showID={showID}
					/>
					<UpdatePrompt
						show={showUpdatePrompt}
						setShow={setShowUpdatePrompt}
						update={changeTimestampsToNewUpdate}
					/>
				</div>
			</div>
		);
	}


	return (
		<div className="d-flex flex-column justify-content-center align-items-center fullScreen">
			<AppNavBar 
				token={token} 
				loggedIn={token !== "" && token !== undefined} 
				logout={logout}
				data={data} 
				curSet={curSet} 
				isOffline={isOffline}
				userData={userData}
				showSetInfo={true}
			/>

			<div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">
				<div className="flex-row justify-content-center d-flex align-items-center canvasDivClass" ref={canvasRef}>
					<Canvas 
						data={data} 
						curSet={curSet} 
						curPlayTime={curPlayTime}
						audioPlaying={audioPlaying}
						userOptions={userOptions}
						setUserOptions={setUserOptions}
						userData={userData}
						token={token}
						hoverUserInfo={hoverUserInfo}
						setHoverUserInfo={setHoverUserInfo}
						isOffline = {isOffline}
					/>
					<UserInfoDialogue hoverUserInfo={hoverUserInfo} canvasRef={canvasRef}/>
				</div>
				<ViewerSideBar 
					curSetInfo={getCurSetInfo()} 
					getCurSetNumb={getCurSetNumb()} 
					setInput={setInput} 
					curSet={curSet} 
					sets={sets} 
					setSets={saveSets}
					handelSetBtnControls={handelSetBtnControls}
					changeCurSetNumb={changeCurSetNumb}
					userOptions={userOptions}
					setUserOptions={setUserOptions}
					data={data}
					audioPlaying={audioPlaying}
					setAudioPlaying={setAudioPlaying}
					audio={audio}
					curPlayTime={curPlayTime}
					setCurPlayTime={setCurPlayTime}
					token={token}
					userData={userData}
					updateSetBasedOnAudioTime={updateSetBasedOnAudioTime}
					updateSpecificSetName={updateSpecificSetName}
					isAdminAuthorized={isAdminAuthorized()}
					isOffline={isOffline}
				/>

				<UserSectionSelection 
					data={data} 
					curSet={curSet} 
					showCode={showCode} 
					token={token} 
					userData={userData}
					showID={showID}
				/>
				<UpdatePrompt
					show={showUpdatePrompt}
					setShow={setShowUpdatePrompt}
					update={changeTimestampsToNewUpdate}
				/>
			</div>
		</div>
	);
}

export default Viewer;
