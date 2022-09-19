import React, {useRef, useEffect, useState} from 'react'

const FUTURE_DOT_COLOR = "rgb(0, 100, 0)";

const MAX_ZOOM = 3;
const MIN_ZOOM = 1;
const SCROLL_SENSITIVITY = 0.0005;

const STEPS_TO_5_MAJOR = 2;
const STEPS_TO_5_MINOR = 8;
const HEIGHT_DIVIDED_INTO_5_YARDS = (53 + 1/3) / 5;

const FRONT_HASH_RATIO = 1/3;
const BACK_HASH_RATIO = 2/3;
const DISTANCE_BETWEEN_HASHES_IN_YDS = (53 + 1/3) / 3;
const HEIGHT_IN_YDS = 53 + 1/3;
const RELATIVE_HASH_HEIGHT = 0.01;
const RELATIVE_HASH_WIDTH = 0.005;

const GRID_MAJOR_DIVISION_COLOR = "rgb(100, 100, 255)";
const GRID_MINOR_DIVISION_COLOR = "rgb(200, 200, 255)";

const Canvas = props => {

    const { draw, setDimensions, curDimensions, ...rest } = props
    // const { draw, postdraw=_postdraw, ...rest } = props
    // const canvasRef = useCanvas(draw, {predraw, postdraw})
    const canvasRef = useRef(null)
    const [dots, setDots] = useState([]);
    const [hoverDot, setHoverDot] = useState({});
    const [cameraOffset, setCameraOffset] = useState(null);
    const [lastCameraOffset, setLastCameraOffset] = useState(null);
    // const [totalMovement, setTotalMovement] = useState({x: 0, y: 0})
    const [cameraZoom, setCameraZoom] = useState(1);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPinchDistance, setInitialPinchDistance] = useState(null);
    const [lastZoom, setLastZoom] = useState(1);

    useEffect(() => {

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let frameCount = 0
        let animationFrameId

        const drawUserDialogue = (dotX, dotY, dot) => {
            // console.log("drawing dialogue: " + dot["userLabel"])
            const w = canvas.width * 0.075;
            const h = canvas.height * 0.075;
            const x = dotX + canvas.height * 0.01;
            const y = dotY - h - canvas.height * 0.01;
            const radius = 5;



            const r = x + w;
            const b = y + h;

            context.beginPath();
            context.strokeStyle="black";
            context.fillStyle="rgb(240, 240, 240)";
            context.lineWidth="4";
            context.moveTo(x+radius, y);
            context.lineTo(r-radius, y);
            context.quadraticCurveTo(r, y, r, y+radius);
            context.lineTo(r, y+h-radius);
            context.quadraticCurveTo(r, b, r-radius, b);
            context.lineTo(x+radius, b);
            context.quadraticCurveTo(x, b, x, b-radius);
            context.lineTo(x, y+radius);
            context.quadraticCurveTo(x, y, x+radius, y);
            context.stroke();
            context.fill();
            context.closePath();

            context.beginPath();
            context.font = canvas.height * 0.03 + 'px serif';
            context.fillStyle = "black";
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(dot["userLabel"], x + w * 0.2, y + h * 0.25);

            if (dot["userName"] !== "None None") {
                context.font = canvas.height * 0.025 + 'px serif';

                context.fillText(dot["userName"], x + w * 0.5, y + h * 0.6);
                context.closePath();
            } else {
                context.font = canvas.height * 0.025 + 'px serif';
                context.fillStyle = "red";

                context.fillText("Unactivated", x + w * 0.5, y + h * 0.6);
                context.closePath();
            }
        }

        const drawLine = (x0, y0, x1, y1, color, thickness) => {
            // console.log("(" + x0, ", " + y0 + ") -> (" + x1 + ", " + y1 + ")");
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.strokeStyle = color;
            context.lineWidth = thickness;
            context.stroke();
            context.closePath();

            // const w = canvas.width;
            // const h = canvas.height;
        };

        const drawPoint = (x, y, color, userLabel) => {
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, canvas.height * 0.006, 0, 2 * Math.PI);
            context.fill();
            context.closePath();

            context.beginPath();
            context.font = canvas.height * 0.025 + 'px serif';
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(userLabel, x, y + canvas.height * 0.02);
            context.closePath();
        };

        const drawVerticalGirdLine = (x, color, thickness) => {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.strokeStyle = color;
            context.lineWidth = thickness;
            context.stroke();
            context.closePath();
        };

        const drawHorizontalGirdLine = (y, color, thickness) => {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.strokeStyle = color;
            context.lineWidth = thickness;
            context.stroke();
            context.closePath();
        };

        const drawHash = (startX, endX, y) => {
            // Draw little lines for each yard | There are 5 yards between each major yard line 
            for (var i = 0; i < 5; i++) {
                const x = ((endX - startX) / 5) * i + startX;

                drawLine(x, y - canvas.height * RELATIVE_HASH_HEIGHT, x, y + canvas.height * RELATIVE_HASH_HEIGHT, "black", 1)
            }
        }

        const drawGridLines = (startX, endX, startY, endY) => {
            for (var i = 1; i < STEPS_TO_5_MAJOR; i++) {
                const x = ((endX - startX) / STEPS_TO_5_MAJOR) * i + startX;

                drawVerticalGirdLine(x, GRID_MAJOR_DIVISION_COLOR, 1);
                
                // Draw all the minor division grid lines between the major divisions
                for (var ii = 1; ii < STEPS_TO_5_MINOR; ii++) {
                    const x2 = ((endX - startX) / STEPS_TO_5_MINOR) * ii + startX;

                    if (x2 !== x) {
                        drawVerticalGirdLine(x2, GRID_MINOR_DIVISION_COLOR, 1);
                    }
                
                }
            }
            
        }

        const drawHorizontalGrid = (hashRatio, color) => {
            // const startY = (canvas.height * FRONT_HASH_RATIO);
            //const endY = (canvas.height * BACK_HASH_RATIO);

            // const hashes = DISTANCE_BETWEEN_HASHES_IN_YDS / 5 * STEPS_TO_5_MAJOR;

            // const startY = 0;
            // const endY = (canvas.height * FRONT_HASH_RATIO);;

            // const hashes = DISTANCE_BETWEEN_HASHES_IN_YDS / 5 * STEPS_TO_5_MAJOR;

            const hashes = 28;
            const hashLocation = hashRatio * canvas.height;
            // height(px) -> ?height/1" 
            // 22.5" = 1 step
            // 90" = 4 steps
            // 1920" = 
            const oneStep = canvas.height / 1920 * 22.5;
            const hashDistance = oneStep * (28 / STEPS_TO_5_MAJOR);
            const startY = hashLocation - hashDistance;
            const endY = hashLocation + hashDistance;
            // console.log(hashes);

            for (var i = 0; i < hashes / STEPS_TO_5_MAJOR; i++) {
                const y = ((endY - startY) / (hashes / STEPS_TO_5_MAJOR)) * i + startY;
                const nextY = ((endY - startY) / (hashes / STEPS_TO_5_MAJOR)) * (i + 1) + startY;

                drawHorizontalGirdLine(y, color, 1);
                
                
                // Draw all the minor division grid lines between the major divisions
                for (var ii = 1; ii <= STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR; ii++) {
                    const y2 = ((y - nextY) /  (STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR)) * ii + y;

                    if (y2 !== y) {
                        drawHorizontalGirdLine(y2, GRID_MINOR_DIVISION_COLOR, 1);
                    }
                
                }
                
            }
        }

        const drawGrid = () => {
            // This draws the 5 yard lines up through the 50, from the left
            for (var x = 0; x < 21; x++) {
                var val = x * (canvas.width / 20);
                var nextVal = (x + 1) * (canvas.width / 20);

                drawVerticalGirdLine(val, "black", 2);
                
                
                if (nextVal <= canvas.width) {
                    drawHash(val, nextVal, canvas.height * FRONT_HASH_RATIO);
                    drawHash(val, nextVal, canvas.height * BACK_HASH_RATIO);

                    drawGridLines(val, nextVal, 0, canvas.height);
                }

                // Draw little lines on the hash marks | FRONT HASH
                drawLine(
                    val - canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * FRONT_HASH_RATIO, 
                    val + canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * FRONT_HASH_RATIO,
                    "black", 1
                );
                // Draw little lines on the hash marks | BACK HASH
                drawLine(
                    val - canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * BACK_HASH_RATIO, 
                    val + canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * BACK_HASH_RATIO,
                    "black", 1
                );

                context.beginPath();
                context.font = canvas.height * 0.05 + 'px serif';
                context.textBaseline = "middle";
                context.textAlign = "center";

                if (x > 11) {
                    context.fillText((20 - x) * 5, val, canvas.height * 0.75);
                } else {
                    context.fillText(x * 5, val, canvas.height * 0.75);
                }
            
                context.closePath();
            }

            // drawHorizontalGrid(0, (canvas.height * FRONT_HASH_RATIO));
            drawHorizontalGrid(0, "rgb(0, 255, 0)");
            drawHorizontalGrid(FRONT_HASH_RATIO, "rgb(0, 0, 255)");
            drawHorizontalGrid(BACK_HASH_RATIO, "rgb(255, 0, 0)");
            drawHorizontalGrid(1, "rgb(0, 255, 0)");
            // drawHorizontalGrid((canvas.height * BACK_HASH_RATIO), canvas.height);

            // Draw the front HS Hash
            // drawHorizontalGirdLine(canvas.height * (1 / 3), "black", 1);
            
            // Draw the back HS Hash
            // drawHorizontalGirdLine(canvas.height * (2 / 3), "black", 1);
        }

        const clear = () => {
            setDots([]);
            // Clear everything
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            drawGrid();
        };

        const render = ctx => {
            ctx.save();

            // Dynamic resizing!
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                // 15x8
                canvasRef.current.style.width = "100%";
                canvasRef.current.style.height = "100%";

                const heightRatio = canvas.offsetWidth * 4 / 9;
                const widthRatio = canvas.offsetHeight * 9 / 4;

                if (heightRatio > canvas.offsetHeight && widthRatio ) {
                    canvas.width  = widthRatio;
                    // canvas.height = canvas.offsetHeight;
                    canvas.height = canvas.offsetHeight;

                    canvasRef.current.style.width = "";
                    canvasRef.current.style.height = "100%";
                } else {
                    canvas.width  = canvas.offsetWidth;
                    // canvas.height = canvas.offsetHeight;
                    canvas.height = heightRatio;

                    canvasRef.current.style.width = "100%";
                    canvasRef.current.style.height = "";
                }
            }

            if (curDimensions["w"] !== canvas.width || curDimensions["h" !== canvas.height]) {
                setDimensions({"w": canvas.width, "h": canvas.height});
            }
            if (cameraOffset === null) {
                // setCameraOffset({x: canvas.width / 2, y: canvas.height / 2});
                setCameraOffset({x: 0, y: 0})
            }

            if (cameraOffset !== null) {
                ctx.translate( canvas.width / 2, canvas.height / 2 )        // Translate to center for zoom
                ctx.scale(cameraZoom, cameraZoom)                           // Zoom
                ctx.translate( -canvas.width / 2, -canvas.height / 2 )      // Go back

                ctx.translate(cameraOffset.x, cameraOffset.y);
                const m = ctx.getTransform();
                const translationX = m.e;
                const translationY = m.f;
                const scale = Math.hypot(m.a, m.b);

                const xInBound = -translationX / scale >= 0 && -translationX + canvas.width <= canvas.width * scale;
                const yInBound = -translationY / scale >= 0 && -translationY + canvas.height <= canvas.height * scale;
                // console.log(translationX, translationY, scale)
                ctx.translate(-cameraOffset.x, -cameraOffset.y);

                if (!xInBound || !yInBound) {
                    if (!isDragging) {
                        setCameraOffset({x: lastCameraOffset.x, y: lastCameraOffset.y});
                    } else {
                        ctx.translate(lastCameraOffset.x, lastCameraOffset.y);
                    }
                } else {
                    ctx.translate(cameraOffset.x, cameraOffset.y);
                    if (lastCameraOffset !== cameraOffset) {
                        setLastCameraOffset(cameraOffset);
                    }
                }
            }

            clear();
            
            // Calls a function provided in props that returns a dict of values
            var data = draw()

            /* 
            -- Draw Return Structure --
            {
                "lines": [ {"startX": 0, "startY": 0, "endX": 100, "endY": 100} ],
                "pts": [ { "x": 0, "y": 0, "r": 255, "g": 255, "b": 255 } ]
            }
            */
            // console.log(data)
            if (data["lines"]) {
                for (var x = 0; x < data["lines"].length; x++) {
                    const line = data["lines"][x];
                    const color = "rgb(" + line["r"] + ", " + line["g"] + ", " + line["b"] + ")";
                    drawLine(line["startX"], line["startY"], line["endX"], line["endY"], color, 2);
                    drawPoint(line["endX"], line["endY"], FUTURE_DOT_COLOR, "");
                    // console.log(line);
                }
            }

            if (data["pts"]) {
                for (var x = 0; x < data["pts"].length; x++) {
                    const dot = data["pts"][x];
                    const color = "rgb(" + dot["r"] + ", " + dot["g"] + ", " + dot["b"] + ")";
                    drawPoint(dot["x"], dot["y"], color, dot["userLabel"]);
                    setDots(dots => [...dots, dot])
                }
            }

            if (data["sets"] && data["curSet"] !== null) {
                if (data["sets"][data["curSet"]] !== undefined) {
                    context.beginPath();
                    context.font = '36px serif';
                    context.fillStyle = "black";
                    context.textBaseline = "middle";
                    context.textAlign = "center";
                    context.fillText(data["sets"][data["curSet"]]["setNumb"], canvas.width * 0.025, canvas.height * 0.9);
                    context.closePath();
                }
            }

            if (hoverDot["x"] !== undefined) {
                drawUserDialogue(hoverDot["x"], hoverDot["y"], hoverDot);
            }
            ctx.restore()

            frameCount++
            animationFrameId = requestAnimationFrame(() => render(ctx))
        }
        render(context)


        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [draw, hoverDot, cameraOffset, cameraZoom])

    const dotHover = (event) => {
        var x = event.pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft),
            y = event.pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop);

        const margin = canvasRef.current.height * 0.006;

        var wasOnDot = false;

        // Collision detection between clicked offset and element.
        dots.forEach(function(dot) {
            if (y > dot["y"] - margin && y < dot["y"] + margin  && x > dot["x"] - margin && x < dot["x"] + margin) {
                // alert('This is: ' + dot["userLabel"]);
                wasOnDot = true;
                setHoverDot(dot);
            }
        });

        if (!wasOnDot) {
            setHoverDot({});
        }
    }

    // PAN TILT SECTION
    const getEventLocation = (e) => {
        if (e.touches && e.touches.length === 1) {
            const x = e.touches[0].pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft),
            y = e.touches[0].pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop);

            return { x: x, y: y }
        }
        else if (e.clientX && e.clientY) {
            const x = e.pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft),
            y = e.pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop);

            // console.log(x, y)
            return { x: x, y: y }
        }
    }

    const onPointerDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: getEventLocation(e).x / cameraZoom - cameraOffset.x,
            y: getEventLocation(e).y / cameraZoom - cameraOffset.y
        });
    }

    const onPointerUp = (e) => {
        setIsDragging(false);
        setInitialPinchDistance(null);
        setLastZoom(cameraZoom);
    }

    const onPointerMove = (e) => {
        // console.log("MOUSE")
        if (isDragging) {
            setCameraOffset({x: getEventLocation(e).x/cameraZoom - dragStart.x, y: getEventLocation(e).y/cameraZoom - dragStart.y});
        }
        dotHover(e);
    }

    const handleTouch = (e, singleTouchHandler) => {
        if ( e.touches.length === 1 ) {
            singleTouchHandler(e)
        } else if (e.type === "touchmove" && e.touches.length === 2) {
            setIsDragging(false);
            handlePinch(e)
        }
    }

    const handlePinch = (e) => {
        e.preventDefault()

        let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

        // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
        let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2

        if (initialPinchDistance == null) {
            setInitialPinchDistance(currentDistance);
        } else {
            adjustZoom( null, currentDistance/initialPinchDistance )
        }
    }

    const adjustZoom = (zoomAmount, zoomFactor) => {
        if (!isDragging) {
            var tempCameraZoom = cameraZoom;
            if (zoomAmount) {
                tempCameraZoom = tempCameraZoom + zoomAmount;
            } else if (zoomFactor) {
                // console.log(zoomFactor)
                tempCameraZoom = zoomFactor*lastZoom;
            }

            tempCameraZoom = Math.min(tempCameraZoom, MAX_ZOOM);
            setCameraZoom(Math.max(tempCameraZoom, MIN_ZOOM));

            // console.log(zoomAmount)
        }
    }

    return <canvas
        ref={canvasRef}
        style={{width: '100%'}}
        onMouseDown={onPointerDown}
        onTouchStart={(e) => handleTouch(e, onPointerDown)}
        onMouseUp={onPointerUp}
        onTouchEnd={(e) => handleTouch(e, onPointerUp)}
        onMouseMove={onPointerMove}
        onTouchMove={(e) => handleTouch(e, onPointerMove)}
        onWheel={(e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY)}
    />;
}

export default Canvas