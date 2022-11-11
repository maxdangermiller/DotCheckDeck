import React, { useState, useEffect, useRef } from 'react'
import './Viewer.css';
import Canvas from './Canvas'
import ViewerSideBar from './ViewerSideBar';
import axios from "axios";

const SCHOOL_CODE = "12345678";

// https://www.cs.colostate.edu/~anderson/newsite/javascript-zoom.html

const Viewer = (props) => {
    const [dots, setDots] = useState([]);
	const [data, setData] = useState([]);
	const [curSet, setCurSet]  = useState(0);
	const [curSetNumb, setCurSetNumb]  = useState("1");
	const [curSetInfo, setCurSetInfo]  = useState(null);
	const [sets, setSets] = useState([]);
	const [dimensions, setDimensions]  = useState({"w": 0, "h": 0});
	const [loading, setLoading] = useState(false);

	let audio = new Audio("https://arrangerspublishingcompany.com/count_s45/shows/steampunk.mp3");

	// This will be set by the OptionsDropDown.js file, passing through the ViewerSideBar.js fine
	const [userOptions, setUserOptions] = useState({
		"multiSelect": false, "drawPath": false,
		"useSectionColors": true,
		"showMovementBrackets": false, "highlightUser": null,
		"moveSpeed": 10,
	});

	const setInput = useRef(null);

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

	useEffect(() => {
		if (dimensions["w"] !== 0 && dimensions["h"] !== 0 && sets.length !== 0 && !alreadyBuffered(data, curSet)) {
			console.log("Recalculating Points! " + dimensions["w"] + "x" + dimensions["h"]);

			setLoading(true);

			const url1 = "http://127.0.0.1:5000/get-dots?school_code=" + SCHOOL_CODE + "&set=" + sets[curSet]["setNumb"] + 
				"&width=" + dimensions["w"] + "&height=" + dimensions["h"] + "&token=" + props.token;

			axios({
				method: "GET",
				url:url1,
			}).then((response) => {
				let dataBackup = data;

				for (let i = 0; i < response.data.length; i++) {
					const setNumb = response.data[i]["index"];

					dataBackup[setNumb] = response.data[i];
				}

				console.log(dataBackup);

				setData(dataBackup);

				setLoading(false);
			}).catch((error) => {
				if (error.response && error.response.status === 401) {
					// console.log(error.response)
					// console.log(error.response.status)
					// console.log(error.response.headers)

					window.location.href = "/login";
				}
			})
		}
	}, [curSet, dimensions, sets])

	useEffect(() => {
		fetch("http://127.0.0.1:5000/sets?school_code=" + SCHOOL_CODE + "&token=" + props.token)
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

	/*
	if (data.length === 0) {
		return(
			<div className="flex-row justify-content-center d-flex align-items-center fullScreen">
				<div className="spinner-border" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}
	*/

	return (
		<div className="flex-row justify-content-center d-flex align-items-center fullScreen">
			<div className="flex-row justify-content-center d-flex align-items-center canvasDivClass">
				<Canvas draw={draw} setDimensions={setDimensions} curDimensions={dimensions} curSet={curSet} sets={sets} loading={loading} timeCode={audio.getStartDate}/>
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

/*
useEffect(() => {
		if (dimensions["w"] !== 0 && dimensions["h"] !== 0 && sets.length !== 0) {
			console.log("Recalculating Points! " + dimensions["w"] + "x" + dimensions["h"]);

			setLoading(true);

			const url1 = "http://127.0.0.1:5000/end-all-be-all?set_numb=" + sets[curSet]["setNumb"] + "&school_code=" + SCHOOL_CODE +
				"&width=" + dimensions["w"] + "&height=" + dimensions["h"] + "&token=" + props.token;
			fetch(url1)
				.then(res => res.json())
				.then(
					(result) => {
						// console.log(result)
						setDots(result);
						setLoading(false);
					},
					// Note: it's important to handle errors here
					// instead of a catch() block so that we don't swallow
					// exceptions from actual bugs in components.
					(error) => {
						console.log(error);
						setLoading(false);
					}
				);
		}
	}, [curSet, dimensions, sets])

	// useEffect(() => { setLoading(false); }, [dots])

	useEffect(() => {
		fetch("http://127.0.0.1:5000/sets?school_code=" + SCHOOL_CODE + "&token=" + props.token)
			.then(res => res.json())
			.then(
				(result) => {
					// console.log(result)
					setSets(result);
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
	}, [])
*/