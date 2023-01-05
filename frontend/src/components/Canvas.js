import React, {useRef, useEffect, useState} from 'react'

const FUTURE_DOT_COLOR = "rgb(0, 100, 0)";
const CURRENT_DOT_COLOR = "rgb(0, 0, 255)";
const HIGHLIGHT_USER_COLOR = "rgb(255, 0, 0)";

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

const ANIMATION_FPS = 20; // 20fps

const Canvas = props => {

    const { draw, setDimensions, curDimensions, curSet, sets, loading, curPlayTime, audioPlaying, userOptions, ...rest } = props

    const canvasRef = useRef(null)

    const [dots, setDots] = useState([]);
    const [hoverDot, setHoverDot] = useState({});
    const [cameraOffset, setCameraOffset] = useState({x: 0, y: 0});

    const [cameraZoom, setCameraZoom] = useState(1);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPinchDistance, setInitialPinchDistance] = useState(null);
    const [lastZoom, setLastZoom] = useState(1);

    const [translation, setTranslation] = useState({x: 0, y: 0})
    const [isAnimation, setIsAnimation] = useState(false);
    const [drawInfo, setDrawInfo] = useState({});
    const [animationStartTime, setAnimationStartTime] = useState(0);
    const [animationDirection, setAnimationDirection] = useState(-1);  
    const [lastSetID, setLastSetID] = useState(-1);

    const [hadResize, setHadResize] = useState(false);
    // This will be 0 until there's an animation and then it will be set to 1 for forward or 0 for backward

    useEffect(() => {

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let frameCount = 0
        let animationFrameId

        // Takes the side and line and give the percentage out of 100
        const sideLineRatioConvert = (side, line) => {
            if (side == 1) { return parseInt(line) / 100; }

            switch (line) {
                case "50":
                    return 0.5;
                case "45":
                    return 0.55;
                case "40":
                    return 0.6;
                case "35":
                    return 0.65;
                case "30":
                    return 0.7;
                case "25":
                    return 0.75;
                case "20":
                    return 0.8;
                case "15":
                    return 0.85;
                case "10":
                    return 0.9;
                case "5":
                    return 0.95;
                case "0":
                    return 1;
            
                default:
                    return -1;
            }
        };

        // Takes the string of the hash and converts it to a percentage
        const hashRatioConvert = (hash) => {
            if (hash == "Front side") { return 1; }
            if (hash == "Front Hash") { return FRONT_HASH_RATIO; }
            if (hash == "Back Hash") { return BACK_HASH_RATIO; }

            return 0;
        }

        const drawTextBetween = (x, y, maxWidth, maxHeight, text, color) => {
            
            const MAX_SIZE = 24;
            const MIN_SIZE = 4;
            const DECREASE_INTERVAL = 2; 

            context.fillStyle = color;
            context.textBaseline = "middle";
            context.textAlign = "center";

            let startIndex = maxHeight === -1 ? MAX_SIZE : (maxHeight > MAX_SIZE ? MAX_SIZE : maxHeight);
            let width = 0;

            for (let x = startIndex; x >= MIN_SIZE; x -= DECREASE_INTERVAL) {
                context.font = x + 'px Arial Black';

                width = context.measureText(text).width;
                
                if ((width <= maxWidth || maxWidth == -1) && (x <= maxHeight || maxHeight == -1) && !(maxWidth == -1 && maxHeight == -1)) {
                    break;
                }
                
            }


            context.fillText(text, x, y);
        }

        const drawMovementBracketText = (x0, y0, x1, y1, xDirection, yDirection, text, color) => {
            const MIN_CLEAR = 5;

            if (x0 !== x1 && y0 === y1 && xDirection !== 0 && yDirection === 0) {  
                context.fillStyle = color;
                context.textAlign = "center";

                if (xDirection === 1) {
                    context.textBaseline = "top";
                } else if (xDirection === -1) {
                    context.textBaseline = "bottom";
                }

                context.font = 24 + 'px Arial Black';

                let centerX = (x0 - x1) / 2 + x1;
                let useY = y0 + (MIN_CLEAR * xDirection);

                context.fillText(text, centerX, useY);
            }
            else if (x0 === x1 && y0 !== y1 && xDirection === 0 && yDirection !== 0) {
                context.fillStyle = color;
                context.textBaseline = "middle";

                if (yDirection === 1) {
                    context.textAlign = "left";
                } else if (yDirection === -1) {
                    context.textAlign = "right";
                }

                context.font = 24 + 'px Arial Black';

                let useX = x0 + (MIN_CLEAR * yDirection);
                let centerY = (y0 - y1) / 2 + y1;

                context.fillText(text, useX, centerY);
            }
        }

        const drawMovementBrackets = (x, y, dot) => {
            if (dot === null) { return; }
            // Find the cords of the closest line and hash
            const lineRatio = sideLineRatioConvert( dot["side"], dot["line"] );
            const hashRatio = hashRatioConvert(dot["useHash"]);
            const lineX = lineRatio * canvas.width;
            const hashY = hashRatio * canvas.height;

            // console.log("Drawing Brackets: " + lineRatio + " : " + lineX)

            const DASH_LENGTH = 5;
            const BRACKET_SEPARATION = 10;
            const TEXT_OFFSET = Math.min(canvas.width, canvas.height) * 0.04;         // Equivalent to max width/height
        

            context.beginPath();
            context.strokeStyle=HIGHLIGHT_USER_COLOR;
            context.lineWidth="2";
            
            if (x !== lineX) {
                const distanceFromHash = Math.abs(y - hashY) + BRACKET_SEPARATION;
                let useY = 0;
                let textY = 0;
                let xDirection = 0;

                if (y - hashY <= 0) {
                    useY = hashY - distanceFromHash
                    textY = useY - TEXT_OFFSET;
                    xDirection = -1;
                } else {
                    useY = hashY + distanceFromHash
                    textY = useY + TEXT_OFFSET;
                    xDirection = 1;
                }

                // Draw the actual line to the line
                context.moveTo(lineX, useY); 
                context.lineTo(x, useY);

                // Draw Little dashes on the ends
                context.moveTo(lineX, useY - DASH_LENGTH);
                context.lineTo(lineX, useY + DASH_LENGTH);

                context.moveTo(x, useY - DASH_LENGTH);
                context.lineTo(x, useY + DASH_LENGTH);

                // Draw text
                const maxWidth = Math.max(Math.abs(lineX - x), canvas.width * 0.04);
                const centerX = (lineX - x) / 2 + x;
                // drawTextBetween(centerX, textY, maxWidth, TEXT_OFFSET, dot["steps"], HIGHLIGHT_USER_COLOR);

                drawMovementBracketText(lineX, useY, x, useY, xDirection, 0, dot["steps"], HIGHLIGHT_USER_COLOR);
            }

            if (y !== hashY) {
                const distanceFromHash = Math.abs(x - lineX) + BRACKET_SEPARATION;
                let useX = 0;
                let textX = 0;
                let yDirection = 0;

                if (x - lineX <= 0) {
                    useX = lineX - distanceFromHash;
                    textX = useX - TEXT_OFFSET * 2;
                    yDirection = -1;
                } else {
                    useX = lineX + distanceFromHash;
                    textX = useX + TEXT_OFFSET * 2;
                    yDirection = 1;
                }

                // Draw the actual line to the hash
                context.moveTo(useX, hashY);
                context.lineTo(useX, y);

                // Draw Little dashes on the ends
                context.moveTo(useX + DASH_LENGTH, hashY);
                context.lineTo(useX - DASH_LENGTH, hashY);

                context.moveTo(useX + DASH_LENGTH, y);
                context.lineTo(useX - DASH_LENGTH, y);

                // Draw text
                // drawTextBetween(textXStart, textXEnd, (y - hashY) + hashY, dot["fbSteps"], HIGHLIGHT_USER_COLOR, 4);
                const maxHeight = Math.max(Math.abs(hashY - y), canvas.width * 0.04);
                const textY = (hashY - y) / 2 + y;

                // drawTextBetween(textX, textY, TEXT_OFFSET * 3, maxHeight, dot["fbSteps"], HIGHLIGHT_USER_COLOR);

                drawMovementBracketText(useX, hashY, useX, y, 0, yDirection, dot["fbSteps"], HIGHLIGHT_USER_COLOR);
            }

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
            context.font = canvas.height * 0.03 + 'px Arial Black';
            context.fillStyle = "black";
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(dot["userLabel"], x + w * 0.2, y + h * 0.25);

            if (dot["userName"] !== "None None") {
                context.font = canvas.height * 0.015 + 'px Arial Black';

                context.fillText(dot["userName"], x + w * 0.65, y + h * 0.25);
                context.closePath();
            } else {
                context.font = canvas.height * 0.0125 + 'px Arial Black';
                context.fillStyle = "red";

                context.fillText("Inactivated", x + w * 0.65, y + h * 0.25);
                context.closePath();
            }
            
            // {self.steps} {self.direction} {self.line} on {self.side}; {self.fbSteps} {self.fbDirection} {self.useHash}, for {self.counts} counts"
            context.beginPath();
            context.font = canvas.height * 0.0125 + 'px Arial Black';
            context.fillStyle = "black";

            const dotI = dot["dot"]
            // const dotStr = dotI["direction"] + " " + dotI["line"] + " on "+ dotI["side"] + "; " + 
            //         dotI["fbSteps"] + " " + dotI["dbDirection"] + " " + dotI["useHash"] + ", for " + dot["counts"] + " counts"

            if (dotI["steps"] !== 0) {
                const textStr = dotI["steps"] + " steps " + dotI["direction"] + " " + dotI["line"] + " side " + dotI["side"] + "; ";
                context.fillText(textStr, x + w * 0.5, y + h * 0.5, w * 0.9);
            } else {
                const textStr = "On " + dotI["line"] + ", on side " + dotI["side"] + "; "
                context.fillText(textStr, x + w * 0.5, y + h * 0.5, w * 0.9);
            }

            if (dotI["fbSteps"] !== 0) {
                const fbDirection = dotI["fbDirection"] === "Front" ? "in front of" : dotI["fbDirection"];
                const textStr = dotI["fbSteps"] + " steps " + fbDirection + " " + dotI["useHash"];

                context.fillText(textStr, x + w * 0.5, y + h * 0.65, w * 0.9);
            } else {
                context.fillText("On " + dotI["useHash"], x + w * 0.5, y + h * 0.65, w * 0.9);
            }
            context.fillText("for " + dot["counts"] + " counts", x + w * 0.5, y + h * 0.8, w * 0.9);
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
            context.font = canvas.height * 0.015 + 'px Arial Black';
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(userLabel, x, y + canvas.height * 0.015);
            context.closePath();
        };

        const drawPointAnimation = (x0, y0, x1, y1, counts, count, color, userLabel) => {
            // y = mx + b
            if (x1 - x0 !== 0) {
                const m = (y1 - y0) / (x1 - x0)
                const b = y0 - (m * x0) 
    
                const x = ((x1 - x0) / counts * count) + x0;
                const y = m * x + b;

                drawPoint(x, y, color, userLabel)
            } else {
                const x = x0
                const y = ((y1 - y0) / counts * count) + y0;

                drawPoint(x, y, color, userLabel)
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
                
                if (major && y > 0 && y < canvas.height) {
                    drawHorizontalGirdLine(y, GRID_MAJOR_DIVISION_COLOR, 1);
                }
                // Draw all the minor division grid lines between the major divisions
                else if (nextY <= endY) {
                    for (var ii = 1; ii < (STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR); ii++) {
                        const y2 = ((nextY - y) /  (STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR)) * ii + y;
    
                        if (y2 !== y && y2 !== nextY && y2 > 0 && y2 < canvas.height) {
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

                if (x > 10 && x != 20) {
                    context.fillText((20 - x) * 5, val, canvas.height * 0.75);
                } else if (x != 0 && x != 20) {
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

        const findBounds = (ctx, transX, transY) => {
            ctx.translate(transX, transY);
            const m = ctx.getTransform();
            const translationX = m.e;
            const translationY = m.f;
            const scale = Math.hypot(m.a, m.b);

            ctx.translate(-transX, -transY);

            const xMin = -canvas.width * (1 - MIN_ZOOM);
            const yMin = -canvas.height * (1 - MIN_ZOOM);
            const xMax = canvas.width * (1 - MIN_ZOOM + 1);
            const yMax = canvas.height * (1 - MIN_ZOOM + 1);

            // const xInBound = -translationX / scale >= xMin && (-translationX + canvas.width) / scale <= xMax;
            // const yInBound = -translationY / scale >= yMin && (-translationY + canvas.height) / scale <= yMax;

            let xInBound = true;
            let yInBound = true;
            let xOutBounds = 0;
            let yOutBounds = 0;

            if (-translationX / scale < xMin) {
                xInBound = false;
                xOutBounds = -translationX / scale - xMin;
            }
            else if ((-translationX + canvas.width) / scale > xMax) {
                xInBound = false; 
                xOutBounds = (-translationX + canvas.width) / scale - xMax;
            }

            if (-translationY / scale < yMin) {
                yInBound = false;
                yOutBounds = -translationY / scale - yMin;
            }
            else if ((-translationY + canvas.height) / scale > yMax) {
                yInBound = false; 
                yOutBounds = (-translationY + canvas.height) / scale - yMax;
            }

            return {xInBound: xInBound, yInBound: yInBound, xOutBounds: xOutBounds, yOutBounds: yOutBounds};
        }

        const dynamicResize = () => {
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
        }

        const doPanAndZoom = (ctx) => {
            if (cameraOffset !== null) {
                ctx.translate( canvas.width / 2, canvas.height / 2 )        // Translate to center for zoom
                ctx.scale(cameraZoom, cameraZoom)                           // Zoom
                ctx.translate( -canvas.width / 2, -canvas.height / 2 )      // Go back

                const boundCalc = findBounds(ctx, cameraOffset.x, cameraOffset.y);
                
                const xInBound = boundCalc.xInBound;
                const yInBound = boundCalc.yInBound;

                if (!xInBound || !yInBound) {
                    const correctedX = cameraOffset.x + boundCalc.xOutBounds;
                    const correctedY = cameraOffset.y + boundCalc.yOutBounds;
                    
                    if (!isDragging) {
                        // console.log("SETTING CAMERA OFFSET! (" + correctedX + ", " + correctedY + ")")
                        setCameraOffset({x: correctedX, y: correctedY});
                    } else {
                        // console.log("CORRECTING CAMERA OFFSET! (" + correctedX + ", " + correctedY + ") " + isDragging)
                        ctx.translate(correctedX, correctedY);
                    }
                } else {
                    // console.log("USING NORMAL CAMERA OFFSET! (" + cameraOffset.x + ", " + cameraOffset.y + ")")
                    ctx.translate(cameraOffset.x, cameraOffset.y);
                }

                const m = ctx.getTransform();
                const xTranslation = m.e;
                const yTranslation = m.f;
                const scale = Math.hypot(m.a, m.b);

                if (translation.x !== xTranslation || translation.y !== yTranslation || translation.s !== scale) {
                    setTranslation({x: xTranslation, y: yTranslation, s: scale});
                }
            }
        }

        // Takes data from API and draws them, used to condense the render method
        const drawDots = (_draw, curSetData) => {
            let newDots = [];
            let drawBracket = {useX:null, useY:null, dot:null};

            for (let x = 0; x < curSetData.length; x++) {
                const dot = curSetData[x];
                let color = "rgb(" + dot.r + ", " + dot.g + ", " + dot.b + ")";

                newDots.push(dot);

                if (!_draw.userOptions.useSectionColors) {
                    color = CURRENT_DOT_COLOR;
                }

                
                let useX = dot.x;
                let useY = dot.y;

                if (_draw.userOptions.highlightUser !== null && _draw.userOptions.highlightUser.label === dot.userLabel) {
                    if (_draw.userOptions.showMovementBrackets) {
                        drawBracket = {useX:useX, useY:useY, dot:dot.dot};
                    }
                    drawPoint(useX, useY, HIGHLIGHT_USER_COLOR, dot.userLabel);
                } else {
                    drawPoint(useX, useY, color, dot.userLabel);
                }
            }

            if (drawBracket.useX !== null) {
                drawMovementBrackets(drawBracket.useX, drawBracket.useY, drawBracket.dot);
            }

            return newDots;
        }

        // Takes data from API, and draws the animation
        const drawAnimation = (_draw) => {
            // This is so if we're playing the show, the sets don't overlap
            const MARGIN = 100;

            if (drawInfo.length !== 0 && curSet !== lastSetID && drawInfo[curSet] !== undefined) {
                let startTime = animationStartTime;
                
                if (audioPlaying) {
                    startTime = drawInfo[curSet]["start_time_code"];
                }

                if (startTime === 0) {
                    if (audioPlaying)   { startTime = curPlayTime * 1000; } 
                    else                { startTime = Date.now();  }

                    setAnimationStartTime(startTime); 
                }

                let curActualTime = audioPlaying ? curPlayTime * 1000 : Date.now();
                let durationInSecs = 2000; // Default Value

                // Find what the API says the duration is
                if (audioPlaying || userOptions.useActualSetLength) {
                    let setStartTime = drawInfo[curSet]["start_time_code"];
                    let setEndTime = drawInfo[curSet]["end_time_code"];
                    if (setStartTime !== null && setEndTime !== null) {
                        durationInSecs = setEndTime - setStartTime - MARGIN;
                    }
                }

                // If the duration is 0, then just end the animation here. 
                // This is because below when it finds curTime it divides and you cannot divide by zero
                if (durationInSecs == 0) { setIsAnimation(false); setAnimationStartTime(0); return; }

                let counts = drawInfo[curSet].counts;

                // 2000 / 2000
                let curTime = (curActualTime - startTime) / ((durationInSecs / counts))

                let direction = 0;

                let curSetData = drawInfo[curSet].dots;
                let lastSetData = drawInfo[lastSetID].dots;

                if (curSet > lastSetID) { direction = 1;  }
                else                    { direction = -1; }

                if (animationDirection !== direction) { setAnimationDirection(direction); }

                // console.log(curSet, lastSetID, curTime + 1 > counts);
                
                for (let x = 0; x < Math.min(curSetData.length, lastSetData.length); x++) {
                    const dot = curSetData[x];
                    const lastDot = lastSetData[x];

                    let color = "rgb(" + dot["r"] + ", " + dot["g"] + ", " + dot["b"] + ")";
                    if (!_draw.userOptions.useSectionColors) { color = CURRENT_DOT_COLOR; }
                    // drawPoint(dot["curX"], dot["curY"], color, dot["userLabel"]);
                    // drawPoint(dot["nextX"], dot["nextY"], FUTURE_DOT_COLOR, "");
                    
                    if (dot["userLabel"] !== lastDot["userLabel"]) { 
                        console.log("FAIL! Labels don't match between sets in animation"); 
                    }
                    

                    if (_draw.userOptions.highlightUser !== null) {
                        if (_draw.userOptions.highlightUser.label === dot["userLabel"]) {
                            drawPointAnimation(
                                lastDot["x"], lastDot["y"], 
                                dot["x"], dot["y"], 
                                counts, curTime, 
                                HIGHLIGHT_USER_COLOR, dot["userLabel"]
                            );
                        } else {
                            drawPointAnimation(
                                lastDot["x"], lastDot["y"], 
                                dot["x"], dot["y"], 
                                counts, curTime, 
                                color, dot["userLabel"]
                            );
                        }
                    } else {
                        drawPointAnimation(
                            lastDot["x"], lastDot["y"], 
                            dot["x"], dot["y"], 
                            counts, curTime, 
                            color, dot["userLabel"]
                        );
                    }
                }

                if (curTime + 0.1 >= counts)   { setIsAnimation(false); setAnimationStartTime(0);  }
                
                // console.log(curTime);
            } else { setIsAnimation(false); setAnimationStartTime(0); }
        }

        const render = ctx => {
            ctx.save();

            // Dynamic resizing!
            dynamicResize();

            if (curDimensions["w"] !== canvas.width || curDimensions["h" !== canvas.height]) {
                setDimensions({"w": canvas.width, "h": canvas.height});
                setHadResize(true);
            }
            if (cameraOffset === null) {
                // setCameraOffset({x: canvas.width / 2, y: canvas.height / 2});
                setCameraOffset({x: 0, y: 0})
            }

            // Pan and zoom
            doPanAndZoom(ctx);
            
            // clear();
            
            // Calls a function provided in props that returns a dict of values
            let _draw = draw();
            // let data = _draw.dots;
            let data = _draw.data;
            let userOptions = _draw.userOptions;

            if (data.length !== 0 || isAnimation)  { clear(); }

            let isNewFrame = lastSetID !== curSet && animationDirection !== 0 && !loading  && data.length !== 0;
            let isRerender = hadResize && !loading && data.length !== 0 && data !== drawInfo;

            // If it is an animation, draw the animation
            if (isAnimation) {
                // Sometimes there's problems
                try {
                    drawAnimation(_draw);
                } catch (error) {
                    console.log("CAUGHT ERROR")
                }
            }

            // Check to see if we have a new frame (right after an animation)
            else if ((isNewFrame || isRerender) && data[curSet].dots !== undefined) {
                setDrawInfo(data);
                setLastSetID(curSet);
                setAnimationDirection(0);

                if (hadResize) { setHadResize(false); }

                let curSetData = data[curSet].dots;

                let newDots = drawDots(_draw, curSetData);
                setDots(newDots)

                if (hoverDot.x !== undefined) {
                    drawUserDialogue(hoverDot.x, hoverDot.y, hoverDot);
                }
            }

            // If it isn't a new frame, used a buffered frame. This is so we don't set vars and overwrite things.
            else if (drawInfo.length > curSet && drawInfo[curSet] !== undefined)  {
                let curSetData = drawInfo[curSet].dots;

                let newDots = drawDots(_draw, curSetData);
                setDots(newDots)

                if (hoverDot.x !== undefined) {
                    drawUserDialogue(hoverDot.x, hoverDot.y, hoverDot);
                }
            }

            ctx.restore()
            frameCount++
            animationFrameId = requestAnimationFrame(() => render(ctx))
        }
        render(context)

        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [draw, hoverDot, cameraOffset, cameraZoom, isAnimation, isDragging, animationDirection])

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
            if (y > dot["y"] - margin && y < dot["y"] + margin  && x > dot["x"] - margin && x < dot["x"] + margin) {
                // alert('This is: ' + dot["userLabel"]);
                wasOnDot = true;
                setHoverDot(dot);
            }
        });

        if (!wasOnDot && hoverDot["x"]) {
            setHoverDot({});
        }
    }

    // PAN TILT SECTION
    const getEventLocation = (e) => {
        if (e.touches && e.touches.length === 1) {
            const x = e.touches[0].pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft);
            const y = e.touches[0].pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop);

            return { x: x, y: y }
        }
        else if (e.clientX && e.clientY) {
            const x = e.pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft);
            const y = e.pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop);

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
        // console.log("POINTER UP!")
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