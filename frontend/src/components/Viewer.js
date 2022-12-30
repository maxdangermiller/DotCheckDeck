import React, { useState, useEffect, useRef } from 'react'
import './Viewer.css';
import Canvas from './Canvas'
import ViewerSideBar from './ViewerSideBar';
import axios from "axios";
import { APISetWithDots, DotCordData, DotData } from "./utils/APIClasses";

const SCHOOL_CODE = "12345678";

// https://www.cs.colostate.edu/~anderson/newsite/javascript-zoom.html
const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const Viewer = (props) => {
	const [data, setData] = useState([]);
	const [curSet, setCurSet]  = useState(0);
	const [curSetNumb, setCurSetNumb]  = useState("1");
	const [curSetInfo, setCurSetInfo]  = useState(null);
	const [sets, setSets] = useState([]);
	const [dimensions, setDimensions]  = useState({"w": 0, "h": 0});
	const [loading, setLoading] = useState(false);
	const [sentRequest, setSentRequest] = useState(false);

	let audio = new Audio("https://arrangerspublishingcompany.com/count_s45/shows/steampunk.mp3");

	// This will be set by the OptionsDropDown.js file, passing through the ViewerSideBar.js fine
	const [userOptions, setUserOptions] = useState({
		"multiSelect": false, "drawPath": false,
		"useSectionColors": true,
		"showMovementBrackets": false, "highlightUser": null,
		"moveSpeed": 10,
	});

	const setInput = useRef(null);

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
			if (_data[i] === undefined) {
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
			if (_data[i] === undefined) {
				let value = i + BUFFER_SIZE;
				return value < _sets.length ? value : -1;
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

		return string;
	}

	/**
	 * Calls the API and gets a section of data
	 * @param {boolean} useBuffer Whether or not to use or throw out the buffer
	 * @returns void
	 */
	const retrievePoints = (useBuffer) => {

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
				+ "&set=" + sets[useSetIndex]["setNumb"] + 
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

				console.log(dataBackup);
				console.log("Currently have loaded set(s): " + convertIndicesListToRangeString(dataBackup, sets) + ".")

				setData(dataBackup);

				setSentRequest(false);
				if (!curSetBuffered || loading) { setLoading(false); }
			}).catch((error) => {
				if (error.response && error.response.status === 401) {
					// console.log(error.response)
					// console.log(error.response.status)
					// console.log(error.response.headers)

					window.location.href = "/login";
				}
			})
		}
	} 

	useEffect(() => {
		retrievePoints(true);
	}, [curSet, sets])

	useEffect(() => {
		retrievePoints(false);
	}, [dimensions])

	// On initial open, call the API and get all of the sets
	useEffect(() => {
		fetch(WINDOW_LOCATION + "/sets?school_code=" + props.schoolCode + "&token=" + props.token)
			.then(res => res.json())
			.then(
				(result) => {
					// console.log(result)
					setSets(result);
					setCurSetInfo(result[0]);
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
	}, [])

	// This is passed to the Canvas and is called to get the data for drawing
	const draw = () => {
		// console.log("DRAWING!")
		// return {dots: dots, userOptions: userOptions};
		return {data: data, userOptions: userOptions};
	}

	const changeCurSet = (x) => {
		if (x >= 0 && x < sets.length && !loading) {
			// console.log("Changing set");
			setCurSet(x);
			setCurSetNumb(sets[x]["setNumb"]);
			setCurSetInfo(sets[x]);
		}
	}

	const changeCurSetNumb = (event) => {
		if (event.key !== "Enter") { return; }
		event.preventDefault();
		for (let x = 0; x < sets.length; x++) {
			if (sets[x]["setNumb"] === event.target.value) {
				setCurSet(x);
				// setCurSetNumb(numb);
				return;
			}
		}
		setCurSetNumb(sets[curSet]["setNumb"]);
		setInput.current.blur();
	}

	const playMusic = () => {
		audio.play();
	}

	return (
		<div className="flex-row justify-content-center d-flex align-items-center fullScreen">
			<div className="flex-row justify-content-center d-flex align-items-center canvasDivClass">
				<Canvas 
					draw={draw} 
					setDimensions={setDimensions} 
					curDimensions={dimensions} 
					curSet={curSet} 
					sets={sets} 
					loading={loading} 
					timeCode={audio.getStartDate}
				/>
			</div>
			<ViewerSideBar 
				curSetInfo={curSetInfo} 
				curSetNumb={curSetNumb} 
				setInput={setInput} 
				curSet={curSet} 
				sets={sets} 
				changeCurSet={changeCurSet}
				loading={loading}
				setCurSetNumb={setCurSetNumb}
				changeCurSetNumb={changeCurSetNumb}
				userOptions={userOptions}
				setUserOptions={setUserOptions}
				data={data}
				playMusic={playMusic}
			/>
		</div>
	);
}

export default Viewer;
