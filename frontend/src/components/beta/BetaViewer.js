import React, { useState, useEffect, useRef } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";

import BetaCanvas from './BetaCanvas'
import ViewerSideBar from './ViewerComponents/ViewerSideBar';
import getApi from '../getApi';
import CustomDownloadProgress from '../CustomDownloadProgress';
import UserInfoDialogue from './ViewerComponents/UserInfoDialogue';
import UpdatePrompt from '../utils/UpdatePrompt';
import UserSectionSelection from '../utils/UserSectionSelection';
import FollowUserBtn from './ViewerComponents/FollowUserBtn';

import logo from '../../logo.svg';

// Utilities
import useLocalData from './utils/useLocalData';
import useUserOptions from './utils/useUserOptions';

import './BetaViewer.css';
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
	const { token, showCode, userData, showID, isOffline } = props;

	const [curSet, setCurSet]  = useState(0);                                                   // Store current index of the show
	const [loading, setLoading] = useState(false);                                              // Show Spinny thing?
	const [sentRequest, setSentRequest] = useState(false);                                      // Prevent sending multiple requests
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
		getLocalData,
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
        // Vars
        data,
        curDatabaseTimestamp,
        curDatabaseSNTimestamp,
        sets
    } = useLocalData(isOffline);

    // Use Local Options
    const {
        setUserOptions, userOptions, selectUserForHighlighting
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

		console.log(newestTimestamps.data)
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

		console.log("Getting updated database version")
		fetch(WINDOW_LOCATION + "/database-version?show_code=" + showCode + "&token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
					console.log("(getDatabaseVersion) -> ", result.timestamp, result.set_name_timestamp)
					
					console.log(localTimestamp, localTimestamp === NaN)

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
     * @param {Array} _sets 
     * @param {Integer} set_index 
     * @param {Integer} show_code 
     * @param {String} _token 
     * @returns {AxiosPromise} axios request
     */
    const retrieveDataFromAPI = (_sets, set_index, show_code, _token) => {
        const url1 = WINDOW_LOCATION + "/get-dots?school_code=" + show_code 
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
        if (depth >= 10) {
            return;
        }

        // Check if a download was started without valid set data
        if (sets.length === 0) {
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
            saveCurTimestamps(newestTimestamps.data, newestTimestamps.sn);
			return; 
		}

        try {
            retrieveDataFromAPI(localSets, useSetIndex, showCode, token).then((response) => {      
                for (let i = 0; i < response.data.length; i++) {
                    const setNumb = response.data[i]["index"];
                    localData[setNumb] = response.data[i];
                }
                
                console.log("Currently have loaded set(s): " + convertIndicesListToRangeString(localData, sets) + ".")
                
                setDownloadingProgress(parseInt(localData.length / sets.length * 100));
                console.log(localData);
                
                saveLocalData(localData);
                
                // Recurse
                captiveDownload(localData, localSets, timestamp, depth + 1);
            }).catch((error) => {
                console.log(error)
                if (error.response && error.response.status === 401 || error.response.status === 400) {
                    console.log(error.response)

                    window.location.href = "/login";
                } else if (error.response && error.response.status === 404) {
                    window.localStorage.removeItem("localSets")
                    window.location.reload();
                }
            })
        } catch (error) {
            window.localStorage.clear();
			window.location.reload();
        }


    }

    /**
     * Start Captive Download
     */
    const startCaptiveDownload = (timestamp) => {
        setIsDownloading(true);
		setDownloadingProgress(0);

		captiveDownload([], sets, timestamp, 0);
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
			return;
		}

		if (data.length !== 0) {
			// retrievePoints(useBuffer);
			return;	
		}

		// START DOWNLOAD
		startCaptiveDownload(curDatabaseTimestamp);
    }
    
    /**
     * Check Set Names
     */
    const checkSetNames = () => {
		if (sets.length === 0) { return; }
		if (checkLocalSetNames()) { return; }
		fetch(WINDOW_LOCATION + "/get-set-names?school_code=" + props.schoolCode + "&token=" + props.token)
			.then(res => res.json())
			.then(
				(result) => {
					console.log(result);
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
	}

    // Update Viewer Effect
    useEffect(() => {
        getDatabaseVersion();
        checkCurData();
		checkSetNames();
	}, [curSet, sets, curDatabaseTimestamp])
    
    // On initial open, call the API and get all of the sets
    useEffect(() => {
        if (curDatabaseTimestamp === -1) { return; }
        if (!checkLocalSets()) {
            fetch(WINDOW_LOCATION + "/sets?school_code=" + showCode + "&token=" + token)
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
    }, [curDatabaseTimestamp])

	// Get Audio From API
	useEffect(() => {
		if (isOffline) { return; }
		audio = new Audio(WINDOW_LOCATION + "/get-audio?school_code=" + showCode + "&token=" + token);
		audio.load();
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

	// Automatically Grab The Users Info and select them for highlighting
	useEffect(() => {
		let parsedData = userOptions;
		try {
			let localUserOptions = window.localStorage.getItem("localUserOptions");
			parsedData = JSON.parse(localUserOptions);
			if (parsedData.dimOtherUsers === undefined) {
				throw new Error('Yeah... Sorry');
			}
			// console.log("Successfully loaded user preferences")
		} catch {
			console.log("DIDN'T Find Saved User Prefs, creating new ones")
			parsedData = {
				"showNextSet": false, "showLastSet": false, "drawPath": false,
				"highlightSection": false,
				"useSectionColors": true,
				"showMovementBrackets": false, "highlightUser": null,
				"moveSpeed": 10, "useActualSetLength": false,
				"dimOtherUsers": false, "showCollegeHash": true,
				"followingUser": false
			};
			window.localStorage.setItem("localUserOptions", JSON.stringify(parsedData));
		}
		
		if (userData.label !== undefined) {
			console.log(userData)
			setUserOptions({...parsedData,  "highlightUser": {"id": userData.show_user_id, "label": userData.label}, "followingUser": false});
		} else {
			setUserOptions({...parsedData,  "highlightUser": null, "followingUser": false});
		}
	}, [userData])

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
		if (x >= 0 && x < sets.length && !loading) {
			// console.log("Changing set");
			setCurSet(x);
		}
	}

    /**
     * Change Current Set Index to Supplied Value
     * @param {Integer} x set index
     */
	const handelSetBtnControls = (x) => {
		if (x >= 0 && x < sets.length && !loading) {
			if (!audioPlaying) {
				changeCurSet(x);
			} 

            if (audio !== null && sets[x]["start_time_code"] !== null) {
				audio.currentTime = sets[x]["start_time_code"] / 1000;
				setCurPlayTime(sets[x]["start_time_code"] / 1000);
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
			if (sets[x]["set_numb"] === event.target.value) {
				handelSetBtnControls(x);
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

    const canvasLoopCallback = () => {
        getAudioSyncedSet();
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

    // Return if downloading
	if (isDownloading) {
		return (
			<ThemeProvider theme={darkTheme}><section className="gradient-custom">
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
			</section></ThemeProvider>
		);
	}

    // Return if landscape
	if (!isLandscape) {
		return (
			<div className="flex-column justify-content-center d-flex align-items-center ViewerFullScreen">
				<h1>Rotate Please</h1>
				<h2>or switch to basic mode</h2>
				<button className='btn btn-primary' onClick={(e) => {window.location.href = "/basic"}}>Open Basic</button>
				<UserSectionSelection 
					data={data} 
					curSet={curSet} 
					schoolCode={showCode} 
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
		);
	}


	return (
		<div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">
			<div className="flex-row justify-content-center d-flex align-items-center canvasDivClass" ref={canvasRef}>
				<BetaCanvas 
					data={data} 
					curSet={curSet} 
					sets={sets} 
					curPlayTime={curPlayTime}
					audioPlaying={audioPlaying}
					userOptions={userOptions}
					setUserOptions={setUserOptions}
					userData={userData}
					token={token}
					hoverUserInfo={hoverUserInfo}
					setHoverUserInfo={setHoverUserInfo}
					isOffline = {isOffline}
                    loading = {loading}
                    loopCallback = {canvasLoopCallback}
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
				changeCurSet={changeCurSet}
				handelSetBtnControls={handelSetBtnControls}
				loading={loading}
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
			/>
			<FollowUserBtn userOptions={userOptions}/>

			<UserSectionSelection 
				data={data} 
				curSet={curSet} 
				schoolCode={showCode} 
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
	);
}

export default BetaViewer;
