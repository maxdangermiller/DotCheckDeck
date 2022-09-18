import React, { useState, useEffect } from 'react'
import './App.css';
import Canvas from './Canvas'

const SCHOOL_CODE = "12345678";

function App() {
	const [dots, setDots] = useState([]);
	const [paths, setPaths] = useState([]);
	const [curSet, setCurSet]  = useState(0);
	const [sets, setSets] = useState([]);
	const [dimensions, setDimensions]  = useState({"w": 0, "h": 0});

	useEffect(() => {
		if (dimensions["w"] !== 0 && dimensions["h"] !== 0 && sets.length !== 0) {
			console.log("Recalculating Points! " + dimensions["w"] + "x" + dimensions["h"]);

			const url1 = "http://127.0.0.1:5000/cords?set_numb=" + sets[curSet]["setNumb"] + "&school_code=" + SCHOOL_CODE +
				"&width=" + dimensions["w"] + "&height=" + dimensions["h"];
			fetch(url1)
				.then(res => res.json())
				.then(
					(result) => {
						// console.log(result)
						setDots(result);
					},
					// Note: it's important to handle errors here
					// instead of a catch() block so that we don't swallow
					// exceptions from actual bugs in components.
					(error) => {
						console.log(error);
					}
				);
			const url2 = "http://127.0.0.1:5000/paths?set_numb_1=" + sets[curSet]["setNumb"] + "&school_code=" + SCHOOL_CODE +
				"&width=" + dimensions["w"] + "&height=" + dimensions["h"];
			fetch(url2)
				.then(res => res.json())
				.then(
					(result) => {
						// console.log(result)
						setPaths(result);
					},
					// Note: it's important to handle errors here
					// instead of a catch() block so that we don't swallow
					// exceptions from actual bugs in components.
					(error) => {
						console.log(error);
					}
			);
		}
	}, [curSet, dimensions, sets])

	useEffect(() => {
		fetch("http://127.0.0.1:5000/sets?school_code=" + SCHOOL_CODE)
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
		return {"pts": dots["pts"], "lines": paths["lines"], "paths": paths["paths"], "sets": sets, "curSet": curSet};
	}

	const changeCurSet = (x) => {
	  if (x >= 0 && x < sets.length) {
		  setCurSet(x);
	  }
	}

	return (
		<div className="flex-row justify-content-center d-flex align-items-center fullScreen">
			<div className="flex-row justify-content-center d-flex align-items-center canvasDivClass">
				<Canvas draw={draw} setDimensions={setDimensions} curDimensions={dimensions}/>
			</div>
			<div className="flex-column justify-content-center d-flex align-items-center sideBarClass">
				HELLO?
			</div>
			<button style={{position: 'absolute', bottom: '2vh', right: '7vh', width: '4vh', height: '4vh'}} onClick={() => changeCurSet(curSet - 1)}>&#8592;</button>
			<button style={{position: 'absolute', bottom: '2vh', right: '2vh', width: '4vh', height: '4vh'}} onClick={() => changeCurSet(curSet + 1)}>&#8594;</button>
		</div>
	);
}

export default App;
