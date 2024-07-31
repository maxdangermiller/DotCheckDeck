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


const BetaViewer = (props) => {
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
     * Call when an update is requested by user
     * Takes the most up to date timestamps and sets the current timestamps
     */
	const changeTimestampsToNewUpdate = () => {
		console.log("Initiating Update!")
        saveCurTimestamps(newestTimestamps.data, newestTimestamps.sn);
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
					console.log("(getDatabaseVersion) -> ", result.timestamp, result.set_name_timestamp)

					if (localTimestamp === null || localSNTimestamp === null || isNaN(localTimestamp) || isNaN(localSNTimestamp)) {
						console.log(localTimestamp, localSNTimestamp)
						setCurDatabaseTimestamp(result.timestamp);
                    	setCurDatabaseSNTimestamp(result.set_name_timestamp);
						localStorage.setItem("database-timestamp", result.timestamp);
						localStorage.setItem("sn-database-timestamp", result.set_name_timestamp);
					}
					else if (localTimestamp !== result.timestamp || localSNTimestamp !== result.set_name_timestamp) {
						setShowUpdatePrompt(true);
					 	setNewestTimestamps({data: result.timestamp, sn: result.set_name_timestamp});

						if (localTimestamp !== curDatabaseTimestamp || localSNTimestamp !== curDatabaseSNTimestamp) {
							console.log("Using old data")
							setCurDatabaseTimestamp(localTimestamp);
							setCurDatabaseSNTimestamp(localSNTimestamp);
						}
					} 
					else if (localTimestamp !== curDatabaseTimestamp || localSNTimestamp !== curDatabaseSNTimestamp) {
						console.log("Using old data")
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
     * @param {String} show_code 
     * @param {String} _token 
     * @param {Integer} dataSection starting at 0
     * @returns {AxiosPromise} axios request
     */
    const retrieveDataFromAPI = (show_code, _token, dataSection) => {
        const url = WINDOW_LOCATION + "/api/get-data?show_code=" + show_code 
			+ "&data_section=" + dataSection + "&token=" + _token;
			
        return axios({
            method: "GET",
            url:url,
        });
    }

    /**
     * Recursive method for processing a captive download
     * @param {Array} localData 
     * @param {Array} localSets 
     * @param {Integer} timestamp 
     */
    const captiveDownload = (localData, timestamp, dataSection) => {
        if (dataSection >= 15) {
			window.location.href = "/error?message=An Unknown Problem Occurred. (Captive Download Error 1)\r\nIt is recommended to press the 'Reset Client' button&return=/app";
            return;
        }

        try {
            retrieveDataFromAPI(showCode, token, dataSection).then((response) => {                 
                // Test if everything is loaded everything
                console.log(dataSection)
                if (response.data.error !== undefined && response.data.error === "Data Section Out Of Range")  {
                    // WE'RE DONE!!!
                    // TODO: MODIFY FOR NEW PURPOSES
                    console.log("DATA FULLY DOWNLOADED! Set count: " + localData.length);
                    saveData(localData);
                    setIsDownloading(false); 
                    setShowUpdatePrompt(false);

                    if (newestTimestamps.data === -1) {
                        getDatabaseVersion();
                    }
                    else {
                        saveCurTimestamps(newestTimestamps.data, newestTimestamps.sn);
                    }

                    return; 
                } 

                // If this is the first recursion, save the sets
                if (dataSection === 0) {
                    // Get Sets 
                    let set_data = response.data["sets"];
                    saveSets(set_data);

                }

                // Loop through showUsers to add
                for (let i = 0; i < response.data["show_users"].length; i++) {
                    // const showUserID = response.data["show_users"][i]["show_user"]["id"];
					
					// Add in section colors into each show user in a band section
					let band_section_id = response.data["show_users"][i]["show_user"]["band_section_id"];

					let found = false;

					for (let j = 0; j < response.data["band_sections"].length; j++) {
						if (response.data["band_sections"][j]["id"] === band_section_id) {
							localData.push({...response.data["band_sections"][j], ...response.data["show_users"][i]});
							found = true;
							break;
						}
					}

					if (!found) {
						localData.push(response.data["show_users"][i]);
					}
                }
                
                // console.log("Currently have loaded show user(s): " + localData.length + ".")
                
                setDownloadingProgress(parseInt(dataSection / response.data["total_data_sections"] * 100));
                // console.log(localData);
                
                saveLocalData(localData);

				if (response.data["update_version"] !== newestTimestamps.data) {
					setNewestTimestamps(response.data["update_version"], newestTimestamps.sn);
				}
                
                // Recurse
                captiveDownload(localData, timestamp, dataSection + 1);
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
		if (data.length !== 0) {
			// TODO: Remove
			console.log("PREVENTING NEW DOWNLOAD!")
			return
		}
        console.log("Starting Captive Download")
        setIsDownloading(true);
		setDownloadingProgress(0);

		try {
			captiveDownload([], timestamp, 0);
		} catch (error) {
			window.location.href = "/error?message=An Unknown Error occurred. Press 'Go Back' to return&return=/app";
		}
    }

    /**
     * Check Current Data
     */
    const checkCurData = () => {
        // Wait until both sets and curDatabaseTimestamp are loaded
		if (curDatabaseTimestamp === "") {
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
			return;	
		}

		// START DOWNLOAD
		startCaptiveDownload(curDatabaseTimestamp);
    }

    // Update Viewer Effect
    useEffect(() => {
		try {
			getDatabaseVersion();
			checkCurData();
		} catch (error) {
			console.log("ERROR " + error);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) // curSet, sets, curDatabaseTimestamp

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

export default BetaViewer;
