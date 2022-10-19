import React, {useRef, useEffect, useState} from 'react'

const FUTURE_DOT_COLOR = "rgb(0, 100, 0)";
const CURRENT_DOT_COLOR = "rgb(0, 0, 255)";

const MAX_ZOOM = 3;
const MIN_ZOOM = 0.9;
const SCROLL_SENSITIVITY = 0.0005;

const STEPS_TO_5_MAJOR = 2;
const STEPS_TO_5_MINOR = 8;
const HEIGHT_DIVIDED_INTO_5_YARDS = (53 + 1/3) / 5;

// Reversed because it draws top to bottom
const FRONT_HASH_RATIO = 2/3;
const BACK_HASH_RATIO = 1/3;
const FRONT_COLLAGE_HASH_RATIO = 10/16;
const BACK_COLLAGE_HASH_RATIO = 6/16;

const DISTANCE_BETWEEN_HASHES_IN_YDS = (53 + 1/3) / 3;
const HEIGHT_IN_YDS = 53 + 1/3;
const RELATIVE_HASH_HEIGHT = 0.01;
const RELATIVE_HASH_WIDTH = 0.005;

const GRID_MAJOR_DIVISION_COLOR = "rgb(100, 100, 255)";
const GRID_MINOR_DIVISION_COLOR = "rgb(200, 200, 255)";
const COLLAGE_HASH_COLOR = "rgb(100, 0, 0)";

const Canvas = props => {

    const { draw, setDimensions, curDimensions, curSet, sets, ...rest } = props
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

    const [translation, setTranslation] = useState({x: 0, y: 0})
    const [isAnimation, setIsAnimation] = useState(false);
    const [drawInfo, setDrawInfo] = useState({});
    const [animationFrame, setAnimationFrame] = useState(0);
    const [animationDirection, setAnimationDirection] = useState(0);  // This will be 0 until there's an animation and then it will be set to 1 for forward or 0 for backward

    useEffect(() => {

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let frameCount = 0
        let animationFrameId

        // Takes the side and line and give the percentage out of 100
        const sideLineRatioConvert = (side, line) => {
            if (side == 1) { return parseInt(line) / 100; }
            switch (line) {
                case 50:
                    return 0.5;
                case 45:
                    return 0.55;
                case 40:
                    return 0.6;
                case 35:
                    return 0.65;
                case 30:
                    return 0.7;
                case 25:
                    return 0.75;
                case 20:
                    return 0.8;
                case 15:
                    return 0.85;
                case 10:
                    return 0.9;
                case 5:
                    return 0.95;
                case 0:
                    return 1;
            
                default:
                    return -1;
            }
        };

        // Takes the string of the hash and converts it to a precentage
        const hashRatioConvert = (hash) => {
            if (hash == "Front side") { return 1; }
            if (hash == "Front Hash") { return FRONT_HASH_RATIO; }
            if (hash == "Back Hash") { return BACK_HASH_RATIO; }

            return 0;
        }

        const drawMovementBrackets = (x, y, dot) => {
            // Find the cords of the closest line and hash
            const lineX = sideLineRatioConvert( dot["curDot"]["line"] ) * canvas.width;
            const hashY = hashRatioConvert(dot["curDot"]["useHash"]) * canvas.height;

            console.log("Drawing Brackets: " + lineX + " : " + hashY)

            context.beginPath();
            context.strokeStyle="black";
            context.fillStyle="rgb(240, 240, 240)";
            context.lineWidth="4";

            context.moveTo(lineX, y);
            context.lineTo(x, y);

            context.moveTo(x, hashY);
            context.lineTo(x, y);

            context.stroke();
            context.closePath();
        }

        const drawUserDialogue = (dotX, dotY, dot) => {
            // console.log("drawing dialogue: " + dot["userLabel"])
            const w = canvas.width * 0.075;
            const h = canvas.height * 0.075;
            const x = dotX + canvas.height * 0.01;
            const y = dotY - h - canvas.height * 0.01;
            const radius = 5;

            const r = x + w;
            const b = y + h;

            // Draw rounded rectangle
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
                context.font = canvas.height * 0.015 + 'px serif';

                context.fillText(dot["userName"], x + w * 0.65, y + h * 0.25);
                context.closePath();
            } else {
                context.font = canvas.height * 0.015 + 'px serif';
                context.fillStyle = "red";

                context.fillText("Unactivated", x + w * 0.65, y + h * 0.25);
                context.closePath();
            }
            
            // {self.steps} {self.direction} {self.line} on {self.side}; {self.fbSteps} {self.fbDirection} {self.useHash}, for {self.counts} counts"
            context.beginPath();
            context.font = canvas.height * 0.015 + 'px serif';
            context.fillStyle = "black";

            const dotI = dot["curDot"]
            const dotStr = dotI["direction"] + " " + dotI["line"] + " on "+ dotI["side"] + "; " + 
                    dotI["fbSteps"] + " " + dotI["dbDirection"] + " " + dotI["useHash"] + ", for " + dotI["set"]["counts"] + " counts"

            if (dotI["steps"] !== 0) {
                context.fillText(dotI["steps"] + " steps " + dotI["direction"] + " " + dotI["line"] + " side " + dotI["side"] + "; ", x + w * 0.5, y + h * 0.5, w * 0.9);
            } else {
                context.fillText("On " + dotI["line"] + ", on side " + dotI["side"] + "; ", x + w * 0.5, y + h * 0.5, w * 0.9);
            }

            if (dotI["fbSteps"] !== 0) {
                const fbDirection = dotI["fbDirection"] === "Front" ? "in front of" : dotI["fbDirection"];
                context.fillText(dotI["fbSteps"] + " steps " + fbDirection + " " + dotI["useHash"], x + w * 0.5, y + h * 0.65, w * 0.9);
            } else {
                context.fillText("On " + dotI["useHash"], x + w * 0.5, y + h * 0.65, w * 0.9);
            }
            context.fillText("for " + dotI["set"]["counts"] + " counts", x + w * 0.5, y + h * 0.8, w * 0.9);
            // console.log(dot);
            context.closePath();
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

        const drawPointAnimation = (x0, y0, x1, y1, counts, count) => {
            // y = mx + b
            if (x1 - x0 !== 0) {
                const m = (y1 - y0) / (x1 - x0)
                const b = y0 - (m * x0) 
    
                const x = ((x1 - x0) / counts * count) + x0;
                const y = m * x + b;

                drawPoint(x, y, "black", "")
            } else {
                const x = x0
                const y = ((y1 - y0) / counts * count) + y0;

                drawPoint(x, y, "black", "")
            }
            
        };

        // This draws a vertical line across the screen
        const drawVerticalGirdLine = (x, color, thickness) => {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.strokeStyle = color;
            context.lineWidth = thickness;
            context.stroke();
            context.closePath();
        };

        // This draws a horizontal line across the screen
        const drawHorizontalGirdLine = (y, color, thickness) => {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.strokeStyle = color;
            context.lineWidth = thickness;
            context.stroke();
            context.closePath();
        };

        // This draws the little hash marks
        const drawHash = (startX, endX, y, color) => {
            // Draw little lines for each yard | There are 5 yards between each major yard line 
            for (var i = 0; i < 5; i++) {
                const x = ((endX - startX) / 5) * i + startX;

                drawLine(x, y - canvas.height * RELATIVE_HASH_HEIGHT, x, y + canvas.height * RELATIVE_HASH_HEIGHT, color, 1)
            }
        }

        // This draw all the Vertical grid lines
        const drawVerticalGrid = (startX, endX, major) => {
            for (var i = 1; i < STEPS_TO_5_MAJOR; i++) {
                const x = ((endX - startX) / STEPS_TO_5_MAJOR) * i + startX;

                if (major) {
                    drawVerticalGirdLine(x, GRID_MAJOR_DIVISION_COLOR, 1);
                } else {
                     // Draw all the minor division grid lines between the major divisions
                    for (var ii = 1; ii < STEPS_TO_5_MINOR; ii++) {
                        const x2 = ((endX - startX) / STEPS_TO_5_MINOR) * ii + startX;

                        if (x2 !== x) {
                            drawVerticalGirdLine(x2, GRID_MINOR_DIVISION_COLOR, 1);
                        }
                    
                    }
                }
            
            }
            
        }

        // This draws all the Horizontal grid lines centered on the hashRatio var which is a ratio less than 1
        const drawHorizontalGrid = (hashRatio, major) => {
            const majorHashes = 8;
            const hashLocation = hashRatio * canvas.height;
            // height(px) -> ?height/1" 
            // 22.5" = 1 step
            // 90" = 4 steps
            // 1920" = 
            const oneStep = canvas.height / 1920 * 22.5;
            const hashDistance = oneStep * 16;
            const startY = hashLocation - hashDistance;
            const endY = hashLocation + hashDistance;
            // console.log(hashes);
            
            for (var i = 1; i < majorHashes; i++) {
                // const y = ((endY - startY) / (majorHashes + 1)) * i + startY;
                // const nextY = ((endY - startY) / (majorHashes + 1)) * (i + 1) + startY;
                const y = startY + oneStep * i * 4;
                const nextY = startY + oneStep * (i + 1) * 4;
                // console.log(y, nextY, oneStep);

                if (y > canvas.height) { break; }
                
                if (major && y > 0 && y < canvas.height) {
                    drawHorizontalGirdLine(y, GRID_MAJOR_DIVISION_COLOR, 1);
                }
                // Draw all the minor division grid lines between the major divisions
                else if (nextY <= endY && y > 0 && y < canvas.height) {
                    for (var ii = 1; ii < (STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR); ii++) {
                        const y2 = ((nextY - y) /  (STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR)) * ii + y;
    
                        if (y2 !== y && y2 !== nextY) {
                            drawHorizontalGirdLine(y2, GRID_MINOR_DIVISION_COLOR, 1);
                        }
                    
                    }
                }
                
            }
        }

        // This draws the Grid Lines
        const drawGridLines = () => {
            drawHorizontalGrid(0, false);
            drawHorizontalGrid(FRONT_HASH_RATIO, false);
            drawHorizontalGrid(BACK_HASH_RATIO, false);
            drawHorizontalGrid(1, false);

            for (var x = 0; x < 21; x++) {
                var val = x * (canvas.width / 20);
                var nextVal = (x + 1) * (canvas.width / 20);

                if (nextVal <= canvas.width) {
                    drawVerticalGrid(val, nextVal, false);
                }
            }

            drawHorizontalGrid(0, true);
            drawHorizontalGrid(FRONT_HASH_RATIO, true);
            drawHorizontalGrid(BACK_HASH_RATIO, true);
            drawHorizontalGrid(1, true);

            for (var x = 0; x < 21; x++) {
                var val = x * (canvas.width / 20);
                var nextVal = (x + 1) * (canvas.width / 20);

                if (nextVal <= canvas.width) {
                    drawVerticalGrid(val, nextVal, true);
                }
            }
        }

        // This draws the Yard Lines, hashes, and Grid Lines
        const drawGrid = () => {
            // Draw Grid Lines
            drawGridLines();

            // This draws the 5 yard lines up through the 50, from the left
            for (var x = 0; x < 21; x++) {
                var val = x * (canvas.width / 20);
                var nextVal = (x + 1) * (canvas.width / 20);

                drawVerticalGirdLine(val, "black", 2);
                
                
                if (nextVal <= canvas.width) {
                    drawHash(val, nextVal, canvas.height * FRONT_HASH_RATIO, "black");
                    drawHash(val, nextVal, canvas.height * BACK_HASH_RATIO, "black");
                    drawHash(val, nextVal, canvas.height * FRONT_COLLAGE_HASH_RATIO, COLLAGE_HASH_COLOR);
                    drawHash(val, nextVal, canvas.height * BACK_COLLAGE_HASH_RATIO, COLLAGE_HASH_COLOR);
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

                // Draw little lines on the hash marks | FRONT COLLAGE HASH
                drawLine(
                    val - canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * FRONT_COLLAGE_HASH_RATIO, 
                    val + canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * FRONT_COLLAGE_HASH_RATIO,
                    COLLAGE_HASH_COLOR, 1
                );
                // Draw little lines on the hash marks | BACK COLLAGE HASH
                drawLine(
                    val - canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * BACK_COLLAGE_HASH_RATIO, 
                    val + canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * BACK_COLLAGE_HASH_RATIO,
                    COLLAGE_HASH_COLOR, 1
                );
                
                context.beginPath();
                context.font = canvas.height * 0.05 + 'px serif';
                context.textBaseline = "middle";
                context.textAlign = "center";

                if (x > 10) {
                    context.fillText((20 - x) * 5, val, canvas.height * 0.75);
                } else {
                    context.fillText(x * 5, val, canvas.height * 0.75);
                }
            
                context.closePath();
            }

            // Draw top and bottom borders
            drawHorizontalGirdLine(0, "black", 2);
            drawHorizontalGirdLine(canvas.height, "black", 2);
        }

        const clear = () => {
            setDots([]);
            const outScale = MIN_ZOOM - 1; // Default will be 0
            // Clear everything
            context.clearRect(
                canvas.width * outScale, 
                canvas.height * outScale, 
                canvas.width + canvas.width * MIN_ZOOM, 
                canvas.height + canvas.height * MIN_ZOOM
            );
            
            drawGrid();
        };

        const render = ctx => {
            ctx.save();

            // Dynamic resizing!
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                // 15x8
                canvasRef.current.style.width = "100%";
                canvasRef.current.style.height = "100%";

                const heightRatio = canvas.offsetWidth * 8 / 15;
                const widthRatio = canvas.offsetHeight * 15 / 8;

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

                const xMin = canvas.width * (MIN_ZOOM - 1);
                const yMin = canvas.height * (MIN_ZOOM - 1);
                const xMax = canvas.width * (MIN_ZOOM + 1);
                const yMax = canvas.height * (MIN_ZOOM + 1);

                const xInBound = -translationX / scale >= xMin && (-translationX + canvas.width) / scale <= xMax;
                const yInBound = -translationY / scale >= yMin && (-translationY + canvas.height) / scale <= yMax;
                // console.log(translationX, translationY, scale)
                ctx.translate(-cameraOffset.x, -cameraOffset.y);

                if (!xInBound || !yInBound) {
                    if (!isDragging) {
                        if (cameraOffset.x !== lastCameraOffset.x || cameraOffset.y !== lastCameraOffset.y) {
                            setCameraOffset({x: lastCameraOffset.x, y: lastCameraOffset.y});
                        }
                    } else {
                        ctx.translate(lastCameraOffset.x, lastCameraOffset.y);
                    }
                } else {
                    ctx.translate(cameraOffset.x, cameraOffset.y);
                    if (lastCameraOffset !== cameraOffset) {
                        setLastCameraOffset(cameraOffset);
                    }
                }

                const m2 = ctx.getTransform();
                const translationX2 = m2.e;
                const translationY2 = m2.f;
                const xTranslation = translationX2;
                const yTranslation = translationY2;

                if (translation.x !== xTranslation || translation.y !== yTranslation || translation.s !== scale) {
                    setTranslation({x: xTranslation, y: yTranslation, s: scale});
                }
            }
            
            // clear();
            
            // Calls a function provided in props that returns a dict of values
            let _draw = draw();
            let data = _draw.dots;
            let userOptions = _draw.userOptions;

            if (data.length !== 0 || isAnimation)  { clear(); }

            /* 
            -- Draw Return Structure --
            {
                "lines": [ {"startX": 0, "startY": 0, "endX": 100, "endY": 100} ],
                "pts": [ { "x": 0, "y": 0, "r": 255, "g": 255, "b": 255 } ]
            }
            */
            // console.log(data)
            if (!isAnimation) {
                
                if (data !== drawInfo) {
                    // console.log("NEW FRAME!")
                    setDrawInfo(data);
                    setAnimationDirection(0);

                    // let newDots = [];

                    for (let x = 0; x < data.length; x++) {
                        if (data[x]["curDot"]) {
                            const dot = data[x];
                            const color = "rgb(" + dot["r"] + ", " + dot["g"] + ", " + dot["b"] + ")";
                            drawPoint(dot["curX"], dot["curY"], color, dot["userLabel"]);
                            // drawPoint(dot["nextX"], dot["nextY"], FUTURE_DOT_COLOR, "");
                            // newDots.push(dot);

                            if (userOptions.highlightUser === dot["userLabel"] && userOptions.showMovementBrackets) {
                                drawMovementBrackets(dot["curX"], dot["curY"], dot);
                            }

                            setDots(dots => [...dots, dot])


                        }
                    }

                    // setDots(newDots);
                } else {
                    // console.log("Using backup: ", animationDirection)
                    for (let x = 0; x < drawInfo.length; x++) {
                        if (drawInfo[x]["curDot"]) {
                            const dot = drawInfo[x];
                            const color = "rgb(" + dot["r"] + ", " + dot["g"] + ", " + dot["b"] + ")";
                            if (animationDirection === 1) {
                                drawPoint(dot["nextX"], dot["nextY"], color, dot["userLabel"]);
                            } else if (animationDirection === -1) {
                                drawPoint(dot["lastX"], dot["lastY"], color, dot["userLabel"]);
                            } else {
                                drawPoint(dot["curX"], dot["curY"], color, dot["userLabel"]);
                            }
                            // ONLY ALLOWS NEXT DOT PRE DRAWING!!! FIX THIS!
                            // ONLY ALLOWS NEXT DOT PRE DRAWING!!! FIX THIS!
                            // ONLY ALLOWS NEXT DOT PRE DRAWING!!! FIX THIS!
                            // ONLY ALLOWS NEXT DOT PRE DRAWING!!! FIX THIS!

                            if (userOptions.highlightUser === dot["userLabel"] && userOptions.showMovementBrackets) {
                                drawMovementBrackets(dot["curX"], dot["curY"], dot);
                            }

                            // drawPoint(dot["lastX"], dot["lastY"], color, dot["userLabel"]);
                            // drawPoint(dot["nextX"], dot["nextY"], FUTURE_DOT_COLOR, "");
                            setDots(dots => [...dots, dot])
                        }
                    }
                }
                
                if (hoverDot["curX"] !== undefined) {
                    drawUserDialogue(hoverDot["curX"], hoverDot["curY"], hoverDot);
                }
            }
            else {
                if (drawInfo[0] && sets) {
                    let curTime =  (frameCount / 4);
                    if (animationFrame !== 0)   { curTime = ((animationFrame + frameCount) / 4); }

                    let counts = 16;  // Random Default

                    let direction = 0;

                    for (let x = 0; x < drawInfo.length; x++) {
                        if (drawInfo[x]["curDot"]) {
                            const dot = drawInfo[x];
                            const color = "rgb(" + dot["r"] + ", " + dot["g"] + ", " + dot["b"] + ")";
                            
                            try {
                                if (sets[curSet]["setNumb"] === dot["nextDot"]["set"]["setNumb"]) {
                                    drawPoint(dot["nextX"], dot["nextY"], FUTURE_DOT_COLOR, "");
                                    drawPoint(dot["curX"], dot["curY"], color, dot["userLabel"]);

                                    counts = drawInfo[x]["nextDot"]["set"]["counts"]
                                    drawPointAnimation(dot["curX"], dot["curY"], dot["nextX"], dot["nextY"], counts, curTime);

                                    direction = 1;
                                    
                                } else {
                                    drawPoint(dot["lastX"], dot["lastY"], FUTURE_DOT_COLOR, "");
                                    drawPoint(dot["curX"], dot["curY"], color, dot["userLabel"]);

                                    counts = drawInfo[x]["curDot"]["set"]["counts"]
                                    drawPointAnimation(dot["curX"], dot["curY"], dot["lastX"], dot["lastY"], counts, curTime);

                                    direction = -1;
                                }
                            } catch (e) {
                                
                            } 

                        }
                        if (animationDirection !== direction) { setAnimationDirection(direction); }
                    }

                    if (curTime + 1 > counts)   { setIsAnimation(false); setAnimationFrame(0);  }
                    else                        { setAnimationFrame(frameCount);                }
                    
                    // console.log(curTime);
                } else { setIsAnimation(false); setAnimationFrame(0); }
                // console.log(frameCount)
                // setIsAnimation(false);
            }
            
            ctx.restore()
            frameCount++
            animationFrameId = requestAnimationFrame(() => render(ctx))
        }
        render(context)

        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [draw, hoverDot, cameraOffset, cameraZoom, isAnimation])

    useEffect(() => {
        setIsAnimation(true);
    }, [curSet]);

    const dotHover = (event) => {

        let x = (event.pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft) - translation.x) / translation.s,
            y = (event.pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop) - translation.y) / translation.s;

        // console.log(x / translation.s, y / translation.s, translation);

        const margin = canvasRef.current.height * 0.006;

        let wasOnDot = false;

        // Collision detection between clicked offset and element.
        dots.forEach(function(dot) {
            if (y > dot["curY"] - margin && y < dot["curY"] + margin  && x > dot["curX"] - margin && x < dot["curX"] + margin) {
                // alert('This is: ' + dot["userLabel"]);
                wasOnDot = true;
                setHoverDot(dot);
            }
        });

        if (!wasOnDot && hoverDot["curX"]) {
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
        // console.log("TOUCH!")
        if ( e.touches.length === 1 ) {
            singleTouchHandler(e)
        } else if (e.type === "touchmove" && e.touches.length === 2) {
            setIsDragging(false);
            handlePinch(e)
        }
        dotHover(e);
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

            // console.log(Math.max(tempCameraZoom, MIN_ZOOM))
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