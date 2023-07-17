import React, { useState, useEffect, useRef } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles';

import './Viewer.css';
import Canvas from './Canvas'
import SimpleCanvas from './SimpleCanvas'
import ViewerSideBar from './ViewerSideBar';
import axios from "axios";
import getApi from './getApi';
import logo from '../logo.svg';
import CustomDownloadProgress from './CustomDownloadProgress';

import {ReactComponent as FindUserButton} from '../circle-question.svg';
import UserSectionSelection from './utils/UserSectionSelection';

// https://www.cs.colostate.edu/~anderson/newsite/javascript-zoom.html
const WINDOW_LOCATION = getApi();

const darkTheme = createTheme({
	palette: {
	  mode: 'dark',
	},
});

let audio = null;
let lastCheckedVersionTime = 0;

const Viewer = (props) => {
	const [data, setData] = useState([]);
	const [curSet, setCurSet]  = useState(0);
	const [curSetNumb, setCurSetNumb]  = useState("1");
	const [curSetInfo, setCurSetInfo]  = useState(null);
	const [sets, setSets] = useState([]);
	const [dimensions, setDimensions]  = useState({"w": 0, "h": 0});
	const [loading, setLoading] = useState(false);
	const [sentRequest, setSentRequest] = useState(false);
	const [audioPlaying, setAudioPlaying] = useState(false);
	const [curPlayTime, setCurPlayTime] = useState(20000);
	const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
	// const [audio, setAudio] = useState(null);

	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadingProgress, setDownloadingProgress] = useState(0);
	
	const [curDatabaseTimestamp, setCurDatabaseTimestamp] = useState();
	const [curDatabaseSNTimestamp, setCurDatabaseSNTimestamp] = useState(-1);

	// This will be set by the OptionsDropDown.js file, passing through the ViewerSideBar.js fine
	const [userOptions, setUserOptions] = useState({
		"showNextSet": false, "showLastSet": false, "drawPath": false,
		"highlightSection": false,
		"useSectionColors": true,
		"showMovementBrackets": false, "highlightUser": null,
		"moveSpeed": 10, "useActualSetLength": false,
		"dimOtherUsers": false, "showCollegeHash": true,
		"followingUser": false
	});

	const setInput = useRef(null);

	const getDatabaseVersion = () => {
		// If we just updated less than 30 seconds ago, don't update
		let curTime = (new Date()).getTime();
		if (curTime - lastCheckedVersionTime <= 30000) { return; }

		fetch(WINDOW_LOCATION + "/database-version?school_code=" + props.schoolCode + "&token=" + props.token)
			.then(res => res.json())
			.then(
				(result) => {
					console.log("(getDatabaseVersion) -> ", result.timestamp, result.set_name_timestamp)
					setCurDatabaseTimestamp(result.timestamp);
                    setCurDatabaseSNTimestamp(result.set_name_timestamp)
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

	/**
	 * Determines if the set is buffered and the sets around it are also buffered
	 * @param {array} _data 
	 * @param {str} _curSet 
	 * @returns boolean
	 */
	const alreadyBuffered = (_data, _curSet) => {
		const BUFFER_SIZE = 2; // While the buffer is actually 4, I don't want to require all of them to be buffered

		if (_data.length === 0) { return false; }

		let startIndex = ( (_curSet - BUFFER_SIZE) > 0 ) ? ( _curSet - BUFFER_SIZE ) : 0;
		let endIndex = ( (_curSet + BUFFER_SIZE) < sets.length ) ? ( _curSet + BUFFER_SIZE ) : sets.length - 1;

		// console.log(startIndex, endIndex);

		for(let i = startIndex; i <= endIndex; i++) {
			// console.log(i + ": " + _data[i])
			if (_data[i] === undefined || _data[i].update_timestamp !== curDatabaseTimestamp) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Finds the first hole in the buffered sets
	 * @param {array} _data 
	 * @param {array} _sets 
	 * @returns int
	 */
	const findFirstBufferHole = (_data, _sets) => {
		const BUFFER_SIZE = 4;
		
		for (let i = 0; i < _sets.length; i++) {
			if (_data[i] === undefined  || _data[i] === null || _data[i].update_timestamp !== curDatabaseTimestamp) {
				let value = i + BUFFER_SIZE;
				return value < _sets.length ? value : i;
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

	const checkLocalSets = () => {
		// Check If Saved
		// Check Version number?
		let localSets = localStorage.getItem("localSets");
		try {
			if (localSets !== "" && localSets !== null) {
				let parsedSets = JSON.parse(localSets);

				// Check version number
				for (let i = 0; i < parsedSets.length; i++) {
					let timestamp = parsedSets[i].update_timestamp;
					if (timestamp !== curDatabaseTimestamp) {
						// Start UPDATING THOSE SETS
						return false;
					}
				}
				// console.log("USING LOCAL DATA!");
				// console.log(parsedData);
				setSets(parsedSets);
				setCurSetInfo(parsedSets[0]);

				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	const checkLocalData = () => {

		// Check Version number?
		// let timestamp = localStorage.getItem("database-timestamp");
		// console.log(timestamp, curDatabaseTimestamp, timestamp !== curDatabaseTimestamp)
		// if (timestamp !== curDatabaseTimestamp) { return false; }
		
		// Check if Saved
		let localData = localStorage.getItem("localData");
		try {
			if (localData !== "" && localData !== null) {
				let parsedData = JSON.parse(localData);

				// Check version number
				for (let i = 0; i < parsedData.length; i++) {
					let timestamp = parsedData[i].update_timestamp;
					if (timestamp !== curDatabaseTimestamp) {
						// Start UPDATING THOSE SETS
						return false;
					}
				}

				// console.log("Trying to use local Data", parsedData.length, sets.length)
				if (parsedData.length < sets.length || sets.length === 0) {
					setData(parsedData);
					return false;
				}
				// console.log("USING LOCAL DATA!");
				// console.log(parsedData);
				setData(parsedData);

				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	const getLocalData = () => {
		try {
			let localData = localStorage.getItem("localData");
			let parsedData = JSON.parse(localData);
			return parsedData;
		} catch {
			return [];
		}
	}

	const saveLocalData = (newData) => {
		localStorage.setItem("localData", JSON.stringify(newData));
		localStorage.setItem("database-timestamp", curDatabaseTimestamp);
	}
	const saveLocalSets = (newSets) => {
		localStorage.setItem("localSets", JSON.stringify(newSets));
		localStorage.setItem("database-timestamp", curDatabaseTimestamp);
	}

	const downloadPoints = (localData) => {
		let useSetIndex = findFirstBufferHole(localData, sets);

		// Don't do it again if we've already sent out a request and it's not pressing because it's already buffered
		// "|| (useSetIndex - 4 >= curSet && useSetIndex + 4 <= curSet)" NOT SURE WHY THIS WAS HERE
		if (sentRequest) { return; }  

		// If we're buffered then don't worry about calling the API
		if (useSetIndex === -1) { 
			setData(localData);
			setIsDownloading(false); 
			return; 
		}

		if (sets.length !== 0 && useSetIndex !== -1) {
			console.log("Recalculating Points! ");

			setSentRequest(true);

			// console.log(sets)
			const url1 = WINDOW_LOCATION + "/get-dots?school_code=" + props.schoolCode 
				+ "&set=" + sets[useSetIndex]["set_numb"] + "&token=" + props.token;

			axios({
				method: "GET",
				url:url1,
			}).then((response) => {
				let dataBackup = localData;

				for (let i = 0; i < response.data.length; i++) {
					const setNumb = response.data[i]["index"];
					dataBackup[setNumb] = response.data[i];
				}

				console.log("Currently have loaded set(s): " + convertIndicesListToRangeString(dataBackup, sets) + ".")

				setDownloadingProgress(parseInt(dataBackup.length / sets.length * 100));
				console.log(dataBackup);

				saveLocalData(dataBackup);

				setSentRequest(false);
				
				// Recurse
				downloadPoints(localData);
			}).catch((error) => {
				if (error.response && error.response.status === 401 || error.response.status === 400) {
					// console.log(error.response)
					// console.log(error.response.status)
					// console.log(error.response.headers)

					window.location.href = "/login";
				}
			})
		}
	}

	const retrievePointsNew = (useBuffer) => {
		// Wait until both sets and curDatabaseTimestamp are loaded
		if (sets.length === 0 || curDatabaseTimestamp === "") {
			// Stall for time
			return;
		} 

		if (checkLocalData()) {
			return;
		}

		if (data.length !== 0) {
			retrievePoints(useBuffer);
			return;	
		}

		// START DOWNLOAD
		setIsDownloading(true);
		setDownloadingProgress(0);

		downloadPoints([]);

	}

	/**
	 * Calls the API and gets a section of data
	 * @param {boolean} useBuffer Whether or not to use or throw out the buffer
	 * @returns void
	 */
	const retrievePoints = (useBuffer) => {
		// Wait until both sets and curDatabaseTimestamp are loaded
		if (sets.length === 0 || curDatabaseTimestamp === "") {
			// Stall for time
			return;
		} 

		if (checkLocalData()) {
			return;
		}

		let useSetIndex = findFirstBufferHole(data, sets);
		let curSetBuffered = alreadyBuffered(data, curSet);

		// console.log(useSetIndex, curSetBuffered);

		// Don't do it again if we've already sent out a request and it's not pressing because it's already buffered
		// "|| (useSetIndex - 4 >= curSet && useSetIndex + 4 <= curSet)" NOT SURE WHY THIS WAS HERE
		if (sentRequest && curSetBuffered && useBuffer) { return; }  

		// If we're buffered then don't worry about calling the API
		if (useBuffer && useSetIndex === -1) { return; }

		let areDimensionsValid = dimensions["w"] !== 0 && dimensions["h"] !== 0;

		// English: Are we using the buffer OR have we buffered the sets that should be buffered OR is there anything left to buffer 
		let macroDeterminate = !useBuffer || !curSetBuffered || useSetIndex !== -1;

		if (areDimensionsValid && sets.length !== 0 && macroDeterminate) {
			console.log("Recalculating Points! " + dimensions["w"] + "x" + dimensions["h"]);

			setSentRequest(true);

			if (!curSetBuffered) { useSetIndex = curSet; setLoading(true); }

			if (!useBuffer) { useSetIndex = curSet; }

			// console.log(sets)
			const url1 = WINDOW_LOCATION + "/get-dots?school_code=" + props.schoolCode 
				+ "&set=" + sets[useSetIndex]["set_numb"] + 
				"&width=" + dimensions["w"] + "&height=" + dimensions["h"] + "&token=" + props.token;

			axios({
				method: "GET",
				url:url1,
			}).then((response) => {
				let dataBackup = data;

				if (!useBuffer) {
					dataBackup = [];
				}

				for (let i = 0; i < response.data.length; i++) {
					const setNumb = response.data[i]["index"];

					// dataBackup[setNumb] = new APISetWithDots.createFromJson(response.data[i]);

					dataBackup[setNumb] = response.data[i];
				}

				// console.log(dataBackup, sets);
				console.log("Currently have loaded set(s): " + convertIndicesListToRangeString(dataBackup, sets) + ".")

				setData(dataBackup);
				saveLocalData(dataBackup);

				setSentRequest(false);
				if (!curSetBuffered || loading) { setLoading(false); }
			}).catch((error) => {
				if (error.response && error.response.status === 401 || error.response.status === 400) {
					// console.log(error.response)
					// console.log(error.response.status)
					// console.log(error.response.headers)

					window.location.href = "/login";
				}
			})
		}
	} 

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

	const checkLocalSetNames = () => {
		// Check if Saved
		let localData = localStorage.getItem("local-set-name-data");
		try {
			if (localData !== "" && localData !== null) {
				let parsedData = JSON.parse(localData);

				// Check version number
				for (let i = 0; i < parsedData.length; i++) {
					let timestamp = parsedData[i].update_timestamp;
					if (timestamp !== curDatabaseSNTimestamp) {
						// Start UPDATING THOSE SET NAMES
						return false;
					}
				}

				// console.log("Trying to use local Data", parsedData.length, sets.length)
				if (parsedData.length < sets.length || sets.length === 0) {
					return false;
				}
				updateSetNames(parsedData);

				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	const saveLocalSetNames = (newData) => {
		localStorage.setItem("local-set-name-data", JSON.stringify(newData));
	}

	const retrieveNewSetNames = () => {
		if (sets.length === 0) { return; }
		if (checkLocalSetNames()) { return; }
		fetch(WINDOW_LOCATION + "/get-set-names?school_code=" + props.schoolCode + "&token=" + props.token)
			.then(res => res.json())
			.then(
				(result) => {
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

	useEffect(() => {
		getDatabaseVersion();
		retrievePointsNew(true);
		retrieveNewSetNames();
	}, [curSet, sets, curDatabaseTimestamp])

	/*
	useEffect(() => {
		getDatabaseVersion();
		retrievePoints(false);
	}, [dimensions])
	*/

	// On initial open, call the API and get all of the sets
	useEffect(() => {
		if (!checkLocalSets()) {
			fetch(WINDOW_LOCATION + "/sets?school_code=" + props.schoolCode + "&token=" + props.token)
				.then(res => res.json())
				.then(
					(result) => {
						console.log(result)
						setSets(result);
						saveLocalSets(result);
						setCurSetInfo(result[0]);
					},
					// Note: it's important to handle errors here
					// instead of a catch() block so that we don't swallow
					// exceptions from actual bugs in components.
					(error) => {
						console.log(error);
					}
			);
		}
	}, [])

	// Get audio!
	useEffect(() => {
		audio = new Audio(WINDOW_LOCATION + "/get-audio?school_code=" + props.schoolCode + "&token=" + props.token);
		audio.load();
	}, [])

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
			let localUserOptions = localStorage.getItem("localUserOptions");
			parsedData = JSON.parse(localUserOptions);
		} catch {
			setUserOptions({
				"showNextSet": false, "showLastSet": false, "drawPath": false,
				"highlightSection": false,
				"useSectionColors": true,
				"showMovementBrackets": false, "highlightUser": null,
				"moveSpeed": 10, "useActualSetLength": false,
				"dimOtherUsers": false, "showCollegeHash": true,
				"followingUser": false
			});
		}
		
		if (props.userData.label !== undefined) {
			console.log(props.userData)
			setUserOptions({...parsedData,  "highlightUser": {"id": props.userData.id, "label": props.userData.label}});
		} else {
			setUserOptions({...parsedData,  "highlightUser": null});
		}
	}, [props.userData])

	// Check to see if we're in landscape, if not display a "Rotate Please" message
	useEffect(() => {
		function handleResize() {
			console.log('resized to: ', window.innerWidth, 'x', window.innerHeight)
			setIsLandscape(window.innerWidth > window.innerHeight)
	  	}
	  
		window.addEventListener('resize', handleResize)
		window.addEventListener('orientationchange', handleResize)
	}, [])

	const setUserOptionsFunc = (data) => {
		localStorage.setItem("localUserOptions", JSON.stringify(data));
		setUserOptions(data);
	}

	// This is passed to the Canvas and is called to get the data for drawing
	const draw = () => {
		if (audioPlaying) { getAudioSyncedSet(); }

		return {data: data, userOptions: userOptions};
	}

	const changeCurSet = (x) => {
		if (x >= 0 && x < sets.length && !loading) {
			// console.log("Changing set");
			setCurSet(x);
			setCurSetNumb(sets[x]["set_numb"]);
			setCurSetInfo(sets[x]);
		}
	}

	const handelSetBtnControls = (x) => {
		if (x >= 0 && x < sets.length && !loading) {
			if (!audioPlaying) {
				changeCurSet(x);
			} 

			if (audio !== null) {
				audio.currentTime = sets[x]["start_time_code"] / 1000;
				setCurPlayTime(sets[x]["start_time_code"] / 1000);
			}
		}
	}

	const changeCurSetNumb = (event) => {
		if (event.key !== "Enter") { return; }
		event.preventDefault();
		for (let x = 0; x < sets.length; x++) {
			if (sets[x]["set_numb"] === event.target.value) {
				setCurSet(x);
				setCurSetNumb(sets[x]["set_numb"]);
				setCurSetInfo(sets[x]);
				// setCurSetNumb(numb);
				return;
			}
		}
		setInput.current.blur();
	}

	const getAudioSyncedSet = () => {
		if (audio === null) { return; }
		let msElapsed = audio.currentTime * 1000;

		// console.log(msElapsed);

		for (let i = 0; i < sets.length; i++) {
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

	const setFollowingUser = (value) => {
		console.log("Setting Following User To: " + value);
		setUserOptions({...userOptions, "followingUser": value});
	}

	const getSetFollowingUserBtnColor = () => {
		if (userOptions.followingUser) {
			return "#5130b8";
		}
		return "#311d6e"; 
	}


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

	if (!isLandscape) {
		return (
			<div className="flex-column justify-content-center d-flex align-items-center ViewerFullScreen">
				<h1>Rotate Please</h1>
				<h2>or switch to basic mode</h2>
				<UserSectionSelection 
					data={data} 
					curSet={curSet} 
					schoolCode={props.schoolCode} 
					token={props.token} 
					userData={props.userData}
				/>
			</div>
		);
	}


	return (
		<div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">
			<div className="flex-row justify-content-center d-flex align-items-center canvasDivClass">
				<Canvas 
					draw={draw} 
					setDimensions={setDimensions} 
					curDimensions={dimensions} 
					curSet={curSet} 
					sets={sets} 
					loading={loading} 
					curPlayTime={curPlayTime}
					audioPlaying={audioPlaying}
					userOptions={userOptions}
					userData={props.userData}
				/>
			</div>
			<ViewerSideBar 
				curSetInfo={curSetInfo} 
				curSetNumb={curSetNumb} 
				setInput={setInput} 
				curSet={curSet} 
				sets={sets} 
				setSets={setSets}
				changeCurSet={changeCurSet}
				handelSetBtnControls={handelSetBtnControls}
				loading={loading}
				setCurSetNumb={setCurSetNumb}
				changeCurSetNumb={changeCurSetNumb}
				userOptions={userOptions}
				setUserOptions={setUserOptionsFunc}
				data={data}
				audioPlaying={audioPlaying}
				setAudioPlaying={setAudioPlaying}
				audio={audio}
				curPlayTime={curPlayTime}
				setCurPlayTime={setCurPlayTime}
				token={props.token}
				userData={props.userData}
			/>
			<button 
				type="button" 
				className='followUserBtn'
				style={{color: getSetFollowingUserBtnColor()}}
				onClick={() => setFollowingUser(!userOptions.followingUser)}
			><FindUserButton height="100%" fill="currentColor"/></button>

			<UserSectionSelection 
				data={data} 
				curSet={curSet} 
				schoolCode={props.schoolCode} 
				token={props.token} 
				userData={props.userData}
			/>
		</div>
	);
}

export default Viewer;
