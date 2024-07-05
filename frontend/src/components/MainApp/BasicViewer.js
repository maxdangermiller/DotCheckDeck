import React, { useState, useEffect, useRef } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import getApi from '../utils/getApi';
import axios from "axios";
import { Switch, Stack, Typography } from '@mui/material';
import UpdatePrompt from '../utils/UpdatePrompt';
import logo from '../../icons/logo.svg';
import CustomDownloadProgress from './ViewerComponents/CustomDownloadProgress';
import SetNameModel from './ViewerComponents/ViewerSideBarComponents/SetNameModel';
import AppNavBar from './MainAppNavBar/AppNavBar';

import useLocalData from './utils/useLocalData';
import useUserOptions from './utils/useUserOptions';


import 'bootstrap/dist/css/bootstrap.css';

const darkTheme = createTheme({
	palette: {
	  mode: 'dark',
	},
});

const WINDOW_LOCATION = getApi();

let lastCheckedVersionTime = 0;
const MIN_TIMESTAMP_INTERVAL = 120000;  // 2 minutes

const BasicViewer = (props) => {
    const {token, showCode, userData, isOffline, logout} = props;

    const [curSet, setCurSet]  = useState(0);                                                   // Store current index of the show
	const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);                            // Show Prompt To Ask If We Should Update
	const [newestTimestamps, setNewestTimestamps] = useState({"data": -1, "sn": -1});           // Store what the newest available timestamp is
    const [isDownloading, setIsDownloading] = useState(false);                                  // Are we CAPTIVE downloading
    const [downloadingProgress, setDownloadingProgress] = useState(0);                          // What percentage is done?
    const [showEditSetName, setShowEditSetName] = useState(false);                              // Edit Set Name
    const [tempCurSetInfo, setTempCurSetInfo] = useState({});                                   // Edit Set Name

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
                if (error.response && (error.response.status === 401 || error.response.status === 400)) {
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
		try {
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
		} catch (error) {
			console.log("ERROR " + error);
		}
    	// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [curDatabaseTimestamp])


    const convertToCollegeHash = (dot) => {
        let hash = dot.use_hash;
        let steps = dot.fb_steps; 
        let direction = dot.fb_direction;   // "Behind" or "Front" or "On"

        
        if (hash === "Back Hash") {
            if (direction === "Behind") {
                return {...dot, fb_steps: dot.fb_steps + 4};
            }
            if (direction === "On") {
                return {...dot, fb_steps: 4, fb_direction: "Front"};
            }
            if (direction === "Front") {
                if (dot.fb_steps < 4) {
                    return {...dot, fb_steps: 4 - dot.fb_steps, fb_direction: "Front"};
                }
                return {...dot, fb_steps: dot.fb_steps - 4};
            }
        }
        if (hash === "Front Hash") { 
            if (direction === "Behind") {
                if (dot.fb_steps < 4) {
                    return {...dot, fb_steps: 4 - dot.fb_steps, fb_direction: "Front"};
                }
                return {...dot, fb_steps: dot.fb_steps - 4};
            }
            if (direction === "Front") {
                return {...dot, fb_steps: dot.fb_steps + 4};
            }
            if (direction === "On") {
                return {...dot, fb_steps: 4, fb_direction: "Front"};
            }
        }

        return dot;
    }

    const getDotText1 = (dot) => {
        if (dot.steps !== 0) {
            return (
                <strong>
                {dot.steps} steps {dot.direction} {dot.line}yd line, on side {dot.side}
                </strong>
            );
        }
        return (
            <strong>
            On {dot.line}yd line, on side {dot.side}
            </strong>
        );
    }

    const getDotText2 = (dot) => {
        let useHash = "HS"
        if (userOptions.basicUseCollegeHash) {
            dot = convertToCollegeHash(dot)
            useHash = "College"
        }

        if (dot.fb_steps !== 0) {
            let fbDirection = dot.fb_direction === "Front" ? "in front of" : dot.fb_direction;
            return (
                <strong>
                {dot.fb_steps} steps {fbDirection} {dot.use_hash} ({useHash})
                </strong>
            );
        }
        return (
            <strong>
            On {dot.use_hash} ({useHash})
            </strong>
        );
    }

    const openEditSetName = (setInfo) => {
        console.log(setInfo)
        setShowEditSetName(true);
        setTempCurSetInfo(JSON.parse(JSON.stringify(setInfo)));
    }

    /**
     * Filter all the dots down to just the user's dots
     * @returns {Object} user's dots
     */
    const getOnlyUserDots = () => {
        let userDots = [];
        for (let i = 0; i < data.length; i++) {
            let setDots = data[i].dots;
            for (let j = 0; j < setDots.length; j++) {
                if (setDots[j].dot.show_user_id === userData.show_user_id) {
                    userDots.push(setDots[j]);
                    break;
                }
            }
        }

        return userDots;
    }

    const setUseCollegeHash = (value) => {
        setUserOptions({...userOptions,  "basicUseCollegeHash": value});
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

    if (data.length === 0) {
        return (
            <div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
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
			/>

            <div className="flex-column justify-content-center d-flex align-items-center ViewerFullScreen">
                <div className="overflow-auto" style={{height: '80vh', width:'min(100%, 800px'}}>
                <ul className="list-group">
                {
                    getOnlyUserDots().map((dotData, index) =>
                        <li className="list-group-item flex-row justify-content-between d-flex align-items-center" key={index} style={{width:'100%', height:'180px'}}>
                            <div className='flex-column justify-content-center d-flex align-items-center' style={{width:'30%', height:'100%'}}>
                                <div style={{width:'100%', height:'60%', fontSize:'32px'}} className='flex-column justify-content-center d-flex align-items-center'>
                                    {sets[index].set_numb}
                                </div>
                                <div style={{width:'100%', height:'40%', textAlign:'center'}} className='flex-column justify-content-center d-flex align-items-center'>
                                    {sets[index].set_name}
                                </div>
                            </div>
                            <div className='flex-column justify-content-center d-flex align-items-start' style={{width:'65%'}}>
                                <div className='mb-2'>{getDotText1(dotData.dot)}</div>
                                <div className='mb-2'>{getDotText2(dotData.dot)}</div>
                                <div className='mb-2'>For {dotData.counts} counts</div>
                                <div className='mb-2'>Measures: {dotData.measure}</div>
                            </div>
                            <div style={{right: "1rem", bottom: "1rem", position: "absolute"}}>    
                                {
                                    userData.is_section_leader ?
                                    <button className='btn btn-secondary' onClick={(e) => openEditSetName(sets[index])}>Edit</button>
                                    : null
                                }
                                <button className='btn btn-success' disabled onClick={(e) => {
                                    window.location.href = "/viewer-quick-display/" + dotData.set_numb + "?return=" + window.location.href
                                }} >View</button>
                            </div>
                        </li>

                    )
                }
                </ul>
                </div>
                <br />
                <div className='d-flex flex-row justify-content-between align-items-center' style={{width:"100%", padding:"1rem"}}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>High School</Typography>
                        <Switch
                            checked={userOptions.basicUseCollegeHash}
                            onChange={(e) => setUseCollegeHash(e.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                            size='xl'
                        />
                        <Typography>College</Typography>
                    </Stack>

                    <button className='btn btn-primary' onClick={(e) => {window.location.href = "/app"}}>Normal</button>
                </div>
                
                <UpdatePrompt
                    show={showUpdatePrompt}
                    setShow={setShowUpdatePrompt}
                    update={changeTimestampsToNewUpdate}
                />

                <SetNameModel 
                    show = {showEditSetName}
                    setShow = {setShowEditSetName}
                    token = {token}
                    curSetInfo={tempCurSetInfo}
                    setCurSetInfo={setTempCurSetInfo}
                    updateSpecificSetName={updateSpecificSetName}
                />
            </div>
        </div>
    );
}

export default BasicViewer;