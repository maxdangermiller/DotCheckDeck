import React, { useState, useEffect, useRef } from 'react'
import './Viewer.css';
import Canvas from './Canvas'
import ViewerSideBar from './ViewerSideBar';

const SCHOOL_CODE = "12345678";

// https://www.cs.colostate.edu/~anderson/newsite/javascript-zoom.html

const Viewer = (props) => {
    const [dots, setDots] = useState([]);
	const [curSet, setCurSet]  = useState(0);
	const [curSetNumb, setCurSetNumb]  = useState("1");
	const [curSetInfo, setCurSetInfo]  = useState(null);
	const [sets, setSets] = useState([]);
	const [dimensions, setDimensions]  = useState({"w": 0, "h": 0});
	const [loading, setLoading] = useState(false);

	// This will be set by the OptionsDropDown.js file, passing through the ViewerSideBar.js fine
	const [userOptions, setUserOptions] = useState({
		"multiSelect": false, "drawPath": false,
		"showMovementBrackets": false, "highlightUser": null,
		"moveSpeed": 10,
	});

	const setInput = useRef(null);

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

	const draw = () => {
		// console.log("DRAWING!")
		return {dots: dots, userOptions: userOptions};
	}

	const changeCurSet = (x) => {
		if (x >= 0 && x < sets.length && !loading) {
			// console.log("Changing set");
			setCurSet(x);
			setCurSetNumb(sets[x]["setNumb"]);
			setCurSetInfo(sets[x]);
			console.log(sets[x])
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

	return (
		<div className="flex-row justify-content-center d-flex align-items-center fullScreen">
			<div className="flex-row justify-content-center d-flex align-items-center canvasDivClass">
				<Canvas draw={draw} setDimensions={setDimensions} curDimensions={dimensions} curSet={curSet} sets={sets}/>
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
				dots={dots}
			/>
		</div>
	);
}

export default Viewer;
