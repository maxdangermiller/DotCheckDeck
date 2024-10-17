import React, { useState, useEffect, useRef } from 'react'

// Components
import AppNavBar from './AppNavBar/AppNavBar';
import NormalViewer from './NormalViewer/NormalViewer';

// Utilities
import useLocalData from './utils/useLocalData';
import useUserOptions from './utils/useUserOptions';
import getApi from '../utils/getApi';
import axios from "axios";


// Styling
import './BetaViewer.css';
import 'bootstrap/dist/css/bootstrap.css';


const WINDOW_LOCATION = getApi();

// Version Update Settings
let lastCheckedVersionTime = 0;
const MIN_TIMESTAMP_INTERVAL = 120000;  // 2 minutes


const BetaViewer = (props) => {
    const { token, showCode, userData, showID, isOffline, logout } = props;


    const [newestTimestamps, setNewestTimestamps] = useState({"data": -1, "sn": -1});           // Store what the newest available timestamp is
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);                            // Show Prompt To Ask If We Should Update
    const [isDownloading, setIsDownloading] = useState(false);                                  // Are we CAPTIVE downloading
    const [downloadingProgress, setDownloadingProgress] = useState(0);                          // What percentage is done?

    // Use Local Data
    const localDataHandler = useLocalData(isOffline);

    // Use Local Options
    const userOptionsHandler = useUserOptions(userData);


    /**
     * Fetch the newest update timestamps!
     */
	const getDatabaseVersion = () => {
        const { localTimestamp, localSNTimestamp } = localDataHandler.getLocalTimestamps();

		// console.log(localTimestamp, localSNTimestamp);

		if (isOffline) {
			console.log("Detected offline usage")
			if (localTimestamp !== null && localSNTimestamp !== null) {
				localDataHandler.setCurDatabaseTimestamp(localTimestamp);
				localDataHandler.setCurDatabaseSNTimestamp(localSNTimestamp);
			} else {
				window.location.href = "/login";
			}
			return;
		}

		// If we just updated less than MIN_TIMESTAMP_INTERVAL seconds ago, don't update
		let curTime = (new Date()).getTime();
		if (curTime - lastCheckedVersionTime <= MIN_TIMESTAMP_INTERVAL) { 
			if (localTimestamp !== localDataHandler.curDatabaseTimestamp || localSNTimestamp !== localDataHandler.curDatabaseSNTimestamp) {
				console.log("Using old data")
				localDataHandler.setCurDatabaseTimestamp(localTimestamp);
				localDataHandler.setCurDatabaseSNTimestamp(localSNTimestamp);
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
						localDataHandler.setCurDatabaseTimestamp(result.timestamp);
                    	localDataHandler.setCurDatabaseSNTimestamp(result.set_name_timestamp);
						localStorage.setItem("database-timestamp", result.timestamp);
						localStorage.setItem("sn-database-timestamp", result.set_name_timestamp);
					}
					else if (localTimestamp !== result.timestamp || localSNTimestamp !== result.set_name_timestamp) {
						setShowUpdatePrompt(true);
					 	setNewestTimestamps({data: result.timestamp, sn: result.set_name_timestamp});

						if (localTimestamp !== localDataHandler.curDatabaseTimestamp || localSNTimestamp !== localDataHandler.curDatabaseSNTimestamp) {
							console.log("Using old data")
							localDataHandler.setCurDatabaseTimestamp(localTimestamp);
							localDataHandler.setCurDatabaseSNTimestamp(localSNTimestamp);
						}
					} 
					else if (localTimestamp !== localDataHandler.curDatabaseTimestamp || localSNTimestamp !== localDataHandler.curDatabaseSNTimestamp) {
						console.log("Using old data")
						localDataHandler.setCurDatabaseTimestamp(localTimestamp);
                    	localDataHandler.setCurDatabaseSNTimestamp(localSNTimestamp);
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
     * @param {Integer} data_section starting at 0
     * @returns {AxiosPromise} axios request
     */
    const retrieveDataFromAPI = (show_code, _token, data_section) => {
        const url = WINDOW_LOCATION + "/api/get-data?show_code=" + show_code 
			+ "&data_section=" + data_section + "&token=" + _token;
			
        return axios({
            method: "GET",
            url:url,
        });
    }

    /**
     * Recursive method for processing a captive download
     * @param {Array} localData 
     * @param {Array} localSets 
     * @param {Integer} dataSection 
     */
    const captiveDownload = (localData, timestamp, dataSection) => {
        const MAX_DATA_SECTION = 15;

        if (dataSection >= MAX_DATA_SECTION) {
			window.location.href = "/error?message=An Unknown Problem Occurred. (Captive Download Error 1)\r\n" + 
                "It is recommended to press the 'Reset Client' button&return=/app";
            return;
        }

        try {
            retrieveDataFromAPI(showCode, token, dataSection).then((response) => {     

                // Test if everything is loaded
                if (response.data.error !== undefined && response.data.error === "Data Section Out Of Range")  {
                    // WE'RE DONE!!!
                    // TODO: MODIFY FOR NEW PURPOSES
                    console.log("DATA FULLY DOWNLOADED! Set count: " + localData.length);
                    localDataHandler.saveData(localData);
                    setIsDownloading(false); 
                    setShowUpdatePrompt(false);

                    if (newestTimestamps.data === -1) {
                        getDatabaseVersion();
                    }
                    else {
                        localDataHandler.saveCurTimestamps(newestTimestamps.data, newestTimestamps.sn);
                    }

                    return; 
                } 

                // If this is the first recursion, save the sets
                if (dataSection === 0) {
                    // Get Sets 
					console.log("SAVING SETS")
                    let set_data = response.data["sets"];
                    localDataHandler.saveSets(set_data);
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
                
                localDataHandler.saveLocalData(localData);

				if (response.data["update_version"] !== newestTimestamps.data) {
					console.log("Found timestamp of ", response.data["update_version"])
					localDataHandler.saveCurTimestamps({data: response.data["update_version"], sn: newestTimestamps.sn});
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
		if (localDataHandler.data.length !== 0) {
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

    useEffect(() => {
		startCaptiveDownload(-1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])



    return (
        <div className="d-flex flex-column justify-content-center align-items-center fullScreen">
            <AppNavBar 
				token={token} 
				loggedIn={token !== "" && token !== undefined} 
				logout={logout}
				data={{}} 
				curSet={"0"} 
				isOffline={isOffline}
				userData={userData}
				showSetInfo={true}
			/>
            <div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">
                <NormalViewer 
                    localDataHandler={localDataHandler}
                    userOptionsHandler={userOptionsHandler}
                    token={token}
                    showCode={showCode}
                    userData={userData}
                    showID={showID}
                    isOffline={isOffline}
                    logout={logout}
                />
                {/*
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
                */}
			</div>
        </div>
    )
}

export default BetaViewer;