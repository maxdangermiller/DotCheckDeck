import React, {useRef, useEffect, useState} from 'react'
import convertDotToCords from './utils/ConvertDotToCords';
import './font.css'

const FUTURE_DOT_COLOR = "rgba(0, 100, 0, 0.8)";
const PREVIOUS_DOT_COLOR = "rgba(100, 0, 0, 0.8)";
const CURRENT_DOT_COLOR = "rgb(0, 0, 255)";
const CURRENT_DOT_HIGHLIGHT_COLOR = "rgba(0, 0, 255, 0.4)";  // This is the value given if another thing is highlighted
const HIGHLIGHT_USER_COLOR = "rgb(255, 0, 0)";

const MAX_ZOOM = 5;
const MIN_ZOOM = 0.9;
const FOLLOWING_USER_ZOOM = 5;
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

const GRID_MAJOR_DIVISION_COLOR = "rgba(100, 100, 255, 0.6)";
const GRID_MINOR_DIVISION_COLOR = "rgba(200, 200, 255, 0.4)";
const COLLAGE_HASH_COLOR = "rgb(100, 0, 0)";

const Canvas = props => {

    const { 
        draw, setDimensions, curDimensions, 
        curSet, sets, loading, curPlayTime, 
        audioPlaying, userOptions, setUserOptions, userData, ...rest 
    } = props;

    const canvasRef = useRef(null)

    const [dots, setDots] = useState([]);
    const [hoverDot, setHoverDot] = useState({});
    const [followDot, setFollowDot] = useState(undefined);
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
        let followDotCords = {x: 0, y: 0};

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
        const hashRatioConvert = (hash, useCollegeHash) => {
            if (hash == "Front side") { return 1; }
            if (hash == "Front Hash") { 
                if (useCollegeHash) {
                    return FRONT_COLLAGE_HASH_RATIO;
                }
                return FRONT_HASH_RATIO; 
            }
            if (hash == "Back Hash") {
                if (useCollegeHash) {
                    return BACK_COLLAGE_HASH_RATIO;
                }
                return BACK_HASH_RATIO;
            }

            return 0;
        }

        const hashStepsCorrect = (steps, hash, hashY, altHashY, y) => {
            if (!userOptions.useCollegeHash) { return steps; }

            // console.log(hashY, altHashY, y)

            if (hash == "Front Hash") { 
                // Past College Hash
                if (altHashY - y >= 0) {
                    return Math.abs(steps - 4);
                }
                // Between College Hash and HS Hash
                if (hashY - y >= 0) {
                    return 4 - steps;
                }
                // Before HS Hash
                return steps + 4;
            }
            if (hash == "Back Hash") {
                // Past HS Hash
                if (hashY - y >= 0) {
                    return steps + 4;
                }
                // Between College Hash and HS Hash
                if (altHashY - y >= 0) {
                    return 4 - steps;
                }
                // Before College Hash
                return steps - 4;
            }

            return steps;
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
                context.font = x + 'px ArialBlack';

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

                context.font = 24 + 'px ArialBlack';

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

                context.font = 24 + 'px ArialBlack';

                let useX = x0 + (MIN_CLEAR * yDirection);
                let centerY = (y0 - y1) / 2 + y1;

                context.fillText(text, useX, centerY);
            }
        }

        const drawMovementBrackets = (x, y, dot) => {
            if (dot === null) { return; }
            // Find the cords of the closest line and hash
            const lineRatio = sideLineRatioConvert( dot["side"], dot["line"] );
            const hashRatio = hashRatioConvert(dot["use_hash"], userOptions.useCollegeHash);
            const hashRatioHS = hashRatioConvert(dot["use_hash"], false);
            const lineX = lineRatio * canvas.width;
            const hashY = hashRatio * canvas.height;
            const hashY_HS = hashRatioHS * canvas.height;

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
                drawMovementBracketText(lineX, useY, x, useY, xDirection, 0, dot.steps, HIGHLIGHT_USER_COLOR);
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

                let steps = hashStepsCorrect(dot.fb_steps, dot.use_hash, hashY_HS, hashY, y);

                // Draw text
                drawMovementBracketText(useX, hashY, useX, y, 0, yDirection, steps, HIGHLIGHT_USER_COLOR);
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
            context.font = canvas.height * 0.02 + 'px ArialBlack';
            context.fillStyle = "black";
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(dot["userLabel"], x + w * 0.2, y + h * 0.25);

            if (dot["userName"] !== "None None" && dot["userName"] !== "") {
                context.font = canvas.height * 0.015 + 'px ArialBlack';

                const MAX_LENGTH = 12;
                if (dot["userName"].length > MAX_LENGTH) {
                    let split = dot["userName"].split(" ");
                    
                    if (split.length < 2) {
                        console.log("PROBLEM WITH NAME!", dot);
                    }

                    let shortenedName = split[0] + " " + split[1][0] + "."

                    if (shortenedName.length > MAX_LENGTH) {
                        shortenedName = shortenedName.substring(0, MAX_LENGTH - 1) + ".";
                    }

                    context.fillText(shortenedName, x + w * 0.65, y + h * 0.25);
                    
                } else {
                    context.fillText(dot["userName"], x + w * 0.65, y + h * 0.25);
                }

                context.closePath();
            } else {
                context.font = canvas.height * 0.0125 + 'px ArialBlack';
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

            if (dotI["fb_steps"] !== 0) {
                const fbDirection = dotI["fb_direction"] === "Front" ? "in front of" : dotI["fb_direction"];
                const textStr = dotI["fb_steps"] + " steps " + fbDirection + " " + dotI["use_hash"];

                context.fillText(textStr, x + w * 0.5, y + h * 0.65, w * 0.9);
            } else {
                context.fillText("On " + dotI["use_hash"], x + w * 0.5, y + h * 0.65, w * 0.9);
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
            context.font = canvas.height * 0.015 + 'px ArialBlack';
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(userLabel, x, y + canvas.height * 0.015);
            context.closePath();
        };

        const getMatchingUserDot = (data, index, curDot) => {
            if (data[index] === undefined || data[index].dots === undefined) { return undefined; }
            if (curDot === undefined || curDot.userID === undefined) { return undefined; }

            for (let i = 0; i < data[index].dots.length; i++) {
                if (data[index].dots[i].userID === curDot.userID) {
                    return data[index].dots[i];
                }
            }
            return undefined;
        }

        const drawHighlightedPoint = (data, curSetIndex, curUserIndex, userOptions, color, userLabel) => {
            // This will draw the previous, current, and next points
            // As well as draw paths if selected

            let size = canvas.height * 0.012;

            // let preDef = data[curSetIndex - 1]  != undefined && data[curSetIndex - 1].dots[curUserIndex]    != undefined;
            let curDef = data[curSetIndex]      != undefined && data[curSetIndex].dots[curUserIndex]        != undefined;
            // let nextDef = data[curSetIndex + 1] != undefined && data[curSetIndex + 1].dots[curUserIndex]    != undefined;

            let preDot = getMatchingUserDot(data, curSetIndex - 1, data[curSetIndex].dots[curUserIndex]);
            let preDef = preDot !== undefined;
            let nextDot = getMatchingUserDot(data, curSetIndex + 1, data[curSetIndex].dots[curUserIndex]);
            let nextDef = nextDot !== undefined;

            // Draw Path between previous and current
            if (preDef && curDef && userOptions.drawPath && userOptions.showLastSet) {
                let cords0 = convertDotToCords(
                    preDot, 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x0 = cords0.x
                let y0 = cords0.y
                
                let cords1 = convertDotToCords(
                    data[curSetIndex].dots[curUserIndex], 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x1 = cords1.x
                let y1 = cords1.y

                context.beginPath();
                context.moveTo(x0, y0);
                context.lineTo(x1, y1);
                context.strokeStyle = PREVIOUS_DOT_COLOR;
                context.lineWidth = 1;
                context.stroke();
                context.closePath();
            }

            // Draw Path between next and current
            if (nextDef && curDef && userOptions.drawPath && userOptions.showNextSet) {
                let cords0 = convertDotToCords(
                    nextDot, 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x0 = cords0.x
                let y0 = cords0.y
                
                let cords1 = convertDotToCords(
                    data[curSetIndex].dots[curUserIndex], 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x1 = cords1.x;
                let y1 = cords1.y;

                context.beginPath();
                context.moveTo(x0, y0);
                context.lineTo(x1, y1);
                context.strokeStyle = FUTURE_DOT_COLOR;
                context.lineWidth = 1;
                context.stroke();
                context.closePath();
            }

            // Previous point
            if (preDef && userOptions.showLastSet) {
                let cords0 = convertDotToCords(
                    preDot, 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x = cords0.x
                let y = cords0.y

                context.beginPath();
                context.fillStyle = PREVIOUS_DOT_COLOR;
                context.arc(x, y, size / 2, 0, 2 * Math.PI);
                context.fill();
                context.closePath();
            }

            // Center point
            if (curDef) {
                let cords0 = convertDotToCords(
                    data[curSetIndex].dots[curUserIndex], 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x = cords0.x
                let y = cords0.y

                context.beginPath();
                context.fillStyle = color;
                context.arc(x, y, size / 2, 0, 2 * Math.PI);
                context.fill();
                context.closePath();
    
                context.beginPath();
                context.font = canvas.height * 0.015 + 'px ArialBlack';
                context.textBaseline = "middle";
                context.textAlign = "center";
                context.fillText(userLabel, x, y + canvas.height * 0.015);
                context.closePath();

                if (followDot !== undefined) {
                    if (userOptions.highlightUser.label === data[curSetIndex].dots[curUserIndex].userLabel) {
                        followDotCords = {x: x, y: y};
                        drawUserDialogue(x, y, data[curSetIndex].dots[curUserIndex]);
                    }
                }
            }

            // Next point
            if (nextDef && userOptions.showNextSet) {
                let cords0 = convertDotToCords(
                    nextDot, 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x = cords0.x
                let y = cords0.y

                context.beginPath();
                context.fillStyle = FUTURE_DOT_COLOR;
                context.rect(x - size / 2, y - size / 2, size, size);
                context.fill();
                context.closePath();
            }
        }

        const drawPointAnimation = (x0, y0, x1, y1, counts, count, color, userLabel, isHighlighted, dot) => {
            // y = mx + b
            if (x1 - x0 !== 0) {
                const m = (y1 - y0) / (x1 - x0)
                const b = y0 - (m * x0) 
    
                const x = ((x1 - x0) / counts * count) + x0;
                const y = m * x + b;


                drawPoint(x, y, color, userLabel)

                if (isHighlighted) {
                    // console.log(followDot, dot)
                    if (followDot !== undefined && followDot.userID === dot.userID) {
                        followDotCords = {x: x, y: y};
                        drawUserDialogue(x, y, dot);
                    }
                }

            } else {
                const x = x0
                const y = ((y1 - y0) / counts * count) + y0;

                drawPoint(x, y, color, userLabel)

                if (isHighlighted) {
                    if (followDot !== undefined && followDot.userID === dot.userID) {
                        followDotCords = {x: x, y: y};
                        drawUserDialogue(x, y, dot);
                    }
                }
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
                    if (userOptions.showCollegeHash) {
                        drawHash(val, nextVal, canvas.height * FRONT_COLLAGE_HASH_RATIO, COLLAGE_HASH_COLOR);
                        drawHash(val, nextVal, canvas.height * BACK_COLLAGE_HASH_RATIO, COLLAGE_HASH_COLOR);
                    }
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
                
                if (userOptions.showCollegeHash) {
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
                }
                
                context.beginPath();
                context.fillStyle = "black";
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
                if (followDot !== undefined) {
                    ctx.translate( canvas.width / 2, canvas.height / 2 )        // Translate to center for zoom
                    ctx.scale(FOLLOWING_USER_ZOOM, FOLLOWING_USER_ZOOM)                               // Zoom
                    ctx.translate( -canvas.width / 2, -canvas.height / 2 )      // Go back

                    let newCords = {
                        x: (canvasRef.current.width / 2) - followDotCords.x, 
                        y: (canvasRef.current.height / 2) - followDotCords.y
                    };

                    ctx.translate(newCords.x, newCords.y);
                    return;
                }

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

        const getDotColor = (_dotData, highlighted, useSectionColors) => {
            let color = "rgb(" + _dotData.r + ", " + _dotData.g + ", " + _dotData.b + ")";
            if (!useSectionColors && highlighted) {
                color = CURRENT_DOT_COLOR;
            }
            else if (!useSectionColors) {
                color = CURRENT_DOT_HIGHLIGHT_COLOR;
            }
            else if (!highlighted) {
                color = "rgba(" + _dotData.r + ", " + _dotData.g + ", " + _dotData.b + ", 0.4)"
            }

            return color
        }

        const getHighlightedUserData = (data, userOptions) => {
            if (userOptions.highlightUser !== null) {
                for (let x = 0; x < data.length; x++) {
                    const dot = data[x];

                    if (userOptions.highlightUser.label === dot.userLabel) {
                        return dot;
                    }
                }
            }

            return null;
        }

        // Takes data from API and draws them, used to condense the render method
        const drawDots = (_draw, data, index) => {
            let newDots = [];
            let drawBracket = {useX:null, useY:null, dot:null};
            let curSetData = data[index].dots;
            let userOptions = _draw.userOptions;

            let highlightedUserData = getHighlightedUserData(curSetData, userOptions);


            for (let x = 0; x < curSetData.length; x++) {
                const dot = curSetData[x];
                newDots.push(dot);

                // NEW IMPLEMENTATION 5/28/23
                let cords = convertDotToCords(dot, curDimensions["w"], curDimensions["h"]);
                
                let useX = cords.x;
                let useY = cords.y;
                
                // Check if there is a user highlighted
                if (highlightedUserData !== null) {
                    // Check if the current dot being read is that label
                    if (highlightedUserData.userLabel === dot.userLabel) {
                        if (userOptions.showMovementBrackets) {
                            drawBracket = {useX:useX, useY:useY, dot:dot.dot};
                        }

                        let color = getDotColor(dot, true, userOptions.useSectionColors)
                        drawHighlightedPoint(data, index, x, userOptions, color, dot.userLabel)
                    }

                    // Check if we're highlighting the section
                    else if (userOptions.highlightSection) {
                        // Check if this dot is part of the highlighted section
                        if (highlightedUserData.section_id === dot.section_id) {
                            let color = getDotColor(dot, true, userOptions.useSectionColors)
                            drawHighlightedPoint(data, index, x, userOptions, color, dot.userLabel)
                        }
                        // Else dim others 
                        else {
                            let color = getDotColor(dot, false, userOptions.useSectionColors)
                            drawPoint(useX, useY, color, dot.userLabel);
                        }
                    }

                    // If not, handel all of the not selected dots
                    else {
                        let color = getDotColor(dot, !userOptions.dimOtherUsers, userOptions.useSectionColors)
                        drawPoint(useX, useY, color, dot.userLabel);
                    }
                }

                // Since nothing is selected, just highlight all
                else {
                    let color = getDotColor(dot, true, userOptions.useSectionColors)
                    drawPoint(useX, useY, color, dot.userLabel);
                }
            }

            if (drawBracket.useX !== null && followDot === undefined) {
                drawMovementBrackets(drawBracket.useX, drawBracket.useY, drawBracket.dot);
            }

            return newDots;
        }

        const getMatchingLabel = (data, id) => {
            for (let i = 0; i < data.length; i++) {
                if (data[i]["userID"] === id) {
                    return data[i];
                }
            }
            return undefined;
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

                let highlightedUserData = getHighlightedUserData(curSetData, userOptions);
                
                for (let x = 0; x < Math.min(curSetData.length, lastSetData.length); x++) {
                    const dot = curSetData[x];
                    let lastDot = lastSetData[x];
                    
                    if (dot["userID"] !== lastDot["userID"]) { 
                        // console.log("FAIL! Labels don't match between sets in animation. Attempting to fix."); 
                        lastDot = getMatchingLabel(lastSetData, dot["userID"]);

                        // If we didn't find the last dot
                        if (lastDot === undefined) {
                            continue;
                        }

                    }
                    

                    // Check if there is a highlighted user
                    if (highlightedUserData !== null) {
                        // Check if this dot is the highlighted User
                        if (highlightedUserData.userLabel === dot.userLabel) {
                            let color = getDotColor(dot, true, userOptions.useSectionColors)
                            let cords0 = convertDotToCords(lastDot, curDimensions["w"], curDimensions["h"]);
                            let cords1 = convertDotToCords(dot, curDimensions["w"], curDimensions["h"]);
                            
                        
                            drawPointAnimation(
                                cords0.x, cords0.y, 
                                cords1.x, cords1.y, 
                                counts, curTime, 
                                color, dot["userLabel"], true, dot
                            );
                        }

                        // Check if we're highlighting the section
                        else if (_draw.userOptions.highlightSection) {
                            let cords0 = convertDotToCords(lastDot, curDimensions["w"], curDimensions["h"]);
                            let cords1 = convertDotToCords(dot, curDimensions["w"], curDimensions["h"]);

                            // Check if this dot is part of the highlighted section
                            if (highlightedUserData.section_id === dot.section_id) {
                                let color = getDotColor(dot, true, userOptions.useSectionColors)
                            
                                drawPointAnimation(
                                    cords0.x, cords0.y, 
                                    cords1.x, cords1.y, 
                                    counts, curTime, 
                                    color, dot["userLabel"], true, dot
                                );
                            }
                            // Else dim others 
                            else {
                                let color = getDotColor(dot, false, userOptions.useSectionColors)

                                drawPointAnimation(
                                    cords0.x, cords0.y, 
                                    cords1.x, cords1.y, 
                                    counts, curTime, 
                                    color, dot["userLabel"], true, dot
                                );
                            }
                        }

                        // No change needed
                        else {
                            let color = getDotColor(dot, !userOptions.dimOtherUsers, userOptions.useSectionColors);
                            let cords0 = convertDotToCords(lastDot, curDimensions["w"], curDimensions["h"]);
                            let cords1 = convertDotToCords(dot, curDimensions["w"], curDimensions["h"]);

                            drawPointAnimation(
                                cords0.x, cords0.y, 
                                cords1.x, cords1.y, 
                                counts, curTime, 
                                color, dot["userLabel"], false, dot
                            );
                        }
                    }

                    // No change needed
                    else {
                        let color = getDotColor(dot, true, userOptions.useSectionColors);
                        let cords0 = convertDotToCords(lastDot, curDimensions["w"], curDimensions["h"]);
                        let cords1 = convertDotToCords(dot, curDimensions["w"], curDimensions["h"]);

                        drawPointAnimation(
                            cords0.x, cords0.y, 
                            cords1.x, cords1.y, 
                            counts, curTime, 
                            color, dot["userLabel"], false, dot
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
                    console.log(error)
                }
            }
            
            // Check to see if we have a new frame (right after an animation)
            else if ((isNewFrame || isRerender) && data[curSet].dots !== undefined) {
                setDrawInfo(data);
                setLastSetID(curSet);
                setAnimationDirection(0);

                if (hadResize) { setHadResize(false); }

                let newDots = drawDots(_draw, data, curSet);
                setDots(newDots)

                if (hoverDot.x !== undefined) {
                    drawUserDialogue(hoverDot.x, hoverDot.y, hoverDot);
                }
            }

            // If it isn't a new frame, used a buffered frame. This is so we don't set vars and overwrite things.
            else if (drawInfo.length > curSet && drawInfo[curSet] !== undefined)  {
                let newDots = drawDots(_draw, drawInfo, curSet);
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
    }, [draw, hoverDot, cameraOffset, cameraZoom, isAnimation, isDragging, animationDirection, followDot])

    useEffect(() => {
        setAnimationStartTime(Date.now());
        setIsAnimation(true);
    }, [curSet]);

    const dotHover = (event) => {
        if (followDot !== undefined)  { return; }

        let x = (event.pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft) - translation.x) / translation.s,
            y = (event.pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop) - translation.y) / translation.s;

        // console.log(x / translation.s, y / translation.s, translation);

        const margin = Math.max(canvasRef.current.height, canvasRef.current.width) * 0.006;

        let wasOnDot = false;

        // Collision detection between clicked offset and element.
        dots.forEach(function(dot) {
            let cords = convertDotToCords(dot, canvasRef.current.width, canvasRef.current.height);
            if (y > cords.y - margin && y < cords.y + margin  && x > cords.x - margin && x < cords.x + margin) {
                wasOnDot = true;
                if (userOptions.showMovementBrackets) {
                    setUserOptions({...userOptions, "highlightUser": {"id": dot.userID, "label": dot.userLabel}})
                }
                else {
                    setHoverDot({...dot, "x": cords.x, "y": cords.y});
                }
            }
        });

        if (!wasOnDot && !userOptions.showMovementBrackets && hoverDot["x"]) {
            setHoverDot({});
        }

        else if (
            !wasOnDot && 
            userOptions.showMovementBrackets && 
            userOptions.highlightUser !== null &&
            userOptions.highlightUser.id !== userData.id
        ) {
            setUserOptions({...userOptions, "highlightUser": {"id": userData.id, "label": userData.label}})
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

    useEffect(() => {
        if (userOptions.followingUser && userOptions.highlightUser !== null) {
            let userLabel = userData.label;
            // let userLabel = userOptions.highlightUser.label;
            
            for (let i = 0; i < dots.length; i++) {
                if (dots[i].userLabel === userLabel) {
                    setFollowDot(dots[i]);
                }
            }
        } else if (!userOptions.followingUser && followDot !== undefined) {
            setFollowDot(undefined);
        }
    }, [userOptions, dots])

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