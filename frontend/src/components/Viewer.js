import Canvas from "./Canvas";
import 'Viewer.css';

// https://www.cs.colostate.edu/~anderson/newsite/javascript-zoom.html

function Viewer() {

	const draw = () => {
        if (currentDrawValues.length > 0 && currentDrawIndex < currentDrawValues.length) {
            let val = currentDrawValues[currentDrawIndex]
            currentDrawIndex += 1;
            return val;
        }
        if (clearDraw) {
            setClearDraw(false);
            currentDrawIndex = 0;
            return {'type': 'clear'}
        }
        return {'type': ''}
    }

	return (
		<div className="fullScreen">
			<Canvas draw={draw}/>
		</div>
  	);
}

export default Viewer;
