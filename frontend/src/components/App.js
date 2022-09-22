import React, { useState, useEffect, useRef } from 'react'
import './App.css';
import Canvas from './Canvas'

const SCHOOL_CODE = "12345678";

function App() {
	const [dots, setDots] = useState([]);
	const [curSet, setCurSet]  = useState(0);
	const [curSetNumb, setCurSetNumb]  = useState("1");
	const [curSetInfo, setCurSetInfo]  = useState(null);
	const [sets, setSets] = useState([]);
	const [dimensions, setDimensions]  = useState({"w": 0, "h": 0});
	const [loading, setLoading] = useState(false);

	const setInput = useRef(null);

	useEffect(() => {
		if (dimensions["w"] !== 0 && dimensions["h"] !== 0 && sets.length !== 0) {
			console.log("Recalculating Points! " + dimensions["w"] + "x" + dimensions["h"]);

			setLoading(true);

			const url1 = "http://127.0.0.1:5000/end-all-be-all?set_numb=" + sets[curSet]["setNumb"] + "&school_code=" + SCHOOL_CODE +
				"&width=" + dimensions["w"] + "&height=" + dimensions["h"];
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
		return dots;
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
			<div className="flex-column justify-content-center d-flex align-items-center sideBarClass">
				<div className='mb-2' style={{height: "20vh"}}>
					{
						!loading ?
						<input 
							ref={setInput} 
							value={curSetNumb} 
							className="invisibleInput" 
							onChange={(e) => setCurSetNumb(e.target.value)} 
							onKeyDown={(e) => changeCurSetNumb(e)}>
						</input> :
						<div className="spinner-border" role="status">
							<span className="visually-hidden">Loading...</span>
					  	</div>
					}
					
					{
						!loading && curSetInfo !== null ?
						<div>
							<h1 className='centerText'><strong>Measure:</strong> {curSetInfo["measure"]}</h1>
							<h1 className='centerText'><strong>Counts:</strong> {curSetInfo["counts"]}</h1>
						</div>
						: <div></div>
					}
					
				</div>
				<div className='mb-2'>
					<button 
						type="button" 
						className="btn btn-warning" 
						onClick={() => changeCurSet(curSet - 1)}
						disabled={curSet > 0 ? false : true}
					>&#8592;</button>
					<button 
						type="button" 
						className="btn btn-success" 
						onClick={() => changeCurSet(curSet + 1)}
						disabled={curSet < sets.length - 1 ? false : true}
					>&#8594;</button>
				</div>
			</div>
		</div>
	);
}

export default App;
