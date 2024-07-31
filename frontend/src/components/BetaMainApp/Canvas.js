import React, {useRef, useEffect, useState} from 'react'
import {convertDotToCords, cordsToDot, dotFromBits} from './CanvasComponents/ConvertDotToCords';
import canvasConversions from './CanvasComponents/canvasConversions';
import drawHashes from './CanvasComponents/drawHashes';
import drawInfoDisplays from './CanvasComponents/drawInfoDisplays';
import '../font.css'
import getApi from '../utils/getApi';
import 'bootstrap/dist/css/bootstrap.css';

const FUTURE_DOT_COLOR = "rgba(0, 100, 0, 0.8)";
const PREVIOUS_DOT_COLOR = "rgba(100, 0, 0, 0.8)";
const CURRENT_DOT_COLOR = "rgb(0, 0, 255)";
const CURRENT_DOT_HIGHLIGHT_COLOR = "rgba(0, 0, 255, 0.4)";  // This is the value given if another thing is highlighted

const MAX_ZOOM = 5;
const MIN_ZOOM = 0.9;
const FOLLOWING_USER_ZOOM = 5;
const SCROLL_SENSITIVITY = 0.0005;

const WINDOW_LOCATION = getApi();


const Canvas = (props) => {
	const { 
        data, curSet, curPlayTime, 
        audioPlaying, userOptions, setUserOptions, 
        userData, token, hoverUserInfo, 
        setHoverUserInfo, isOffline, loading
    } = props;
    

    const canvasRef = useRef(null)

    const [dots, setDots] = useState([]);
    const [hoverDot, setHoverDot] = useState({});
    const [followDot, setFollowDot] = useState(undefined);
    const [cameraOffset, setCameraOffset] = useState({x: 0, y: 0});
    const [curDimensions, setDimensions]  = useState({"w": 0, "h": 0});

    const [cameraZoom, setCameraZoom] = useState(1);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPinchDistance, setInitialPinchDistance] = useState(null);
    const [lastZoom, setLastZoom] = useState(1);

    const [translation, setTranslation] = useState({x: 0, y: 0})
    const [isAnimation, setIsAnimation] = useState(false);
    const [drawInfo, setDrawInfo] = useState({});
    const [animationStartTime, setAnimationStartTime] = useState(0);
    // This will be 0 until there's an animation and then it will be set to 1 for forward or -1 for backward
    const [animationDirection, setAnimationDirection] = useState(-1);  
    const [lastSetID, setLastSetID] = useState(-1);

    const [loadedIcons, setLoadedIcons] = useState([])

    const [hadResize, setHadResize] = useState(false);

    const {
        steps_to_px,
        sideLineRatioConvert,
        hashRatioConvert,
        hashStepsCorrect
    } = canvasConversions(userOptions);

    /**
     * Get if the user has selected counts display mode
     * @returns {boolean} If the display mode is counts
     */
    const isCountsMode = () => {
        return userOptions["displayMode"] === 1;
    }

    const getLoadedIcon = (icon_id) => {
        for (let i = 0; i < loadedIcons.length; i++) {
            if (loadedIcons[i]["id"] == icon_id) {
                return loadedIcons[i]["icon"];
            }
        }

        let img = new Image();

        img.onerror = function() { 
            window.location.href = "/error?message=Your login token is expired. Press 'Go Back' to return to login&return=/login";
        };
        img.onabort = function() { 
            window.location.href = "/error?message=Your login token is expired. Press 'Go Back' to return to login&return=/login";
        };

        img.src = WINDOW_LOCATION + '/get-icon/' + icon_id + "?token=" + token;

        img.onload = () => {
            setLoadedIcons([...loadedIcons, {"id": icon_id, "icon": img}]);
        }

        return img;
    }

    /**
     * Main Rendering Function
     */
    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let animationFrameId
        let followDotCords = {x: 0, y: 0};
        
        const {
            drawMovementBrackets,
            drawUserDialogue,
            drawUserName
        } = drawInfoDisplays(canvasRef.current, context, userOptions, userData, hoverUserInfo, setHoverUserInfo)

        /**
         * Draw a User Point
         * @param {Float} x 
         * @param {Float} y 
         * @param {Color} color 
         * @param {String} userLabel 
         */
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

        /**
         * Get Matching User Dot Given the current Dot and the data for the next set
         * @param {Dot Data} data all the sets with all the dots 
         * @param {Integer} index index of the current set
         * @param {Dot} curDot current user dot for current set
         * @returns 
         */
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

        /**
         * Draw Highlighted User Dot
         * @param {Dot Data} data all the sets with all the dots
         * @param {Integer} curSetIndex index of the current set
         * @param {Integer} curUserIndex index of the user
         * @param {Object} userOptions
         * @param {Color} color
         * @param {String} userLabel 
         */
        const drawHighlightedPoint = (data, curSetIndex, curUserIndex, userOptions, color, userLabel) => {
            // This will draw the previous, current, and next points
            // As well as draw paths if selected

            let size = canvas.height * 0.012;

            
            let curDot = data[curUserIndex]["dot_links"][curSetIndex];
            let curDef = curDot !== undefined;
            
            let preDot = data[curUserIndex]["dot_links"][curSetIndex - 1];
            let preDef = preDot !== undefined;

            let nextDot = data[curUserIndex]["dot_links"][curSetIndex + 1]
            let nextDef = nextDot !== undefined;


            // Draw Path between previous and current (forwards)
            if (preDef && curDef && userOptions.drawPath && userOptions.showLastSet) {
                let cords0 = convertDotToCords(
                    preDot, 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x0 = cords0.x
                let y0 = cords0.y
                
                let cords1 = convertDotToCords(
                    curDot, 
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

            // Draw Path between next and current (backwards)
            if (nextDef && curDef && userOptions.drawPath && userOptions.showNextSet) {
                let cords0 = convertDotToCords(
                    nextDot, 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x0 = cords0.x
                let y0 = cords0.y
                
                let cords1 = convertDotToCords(
                    curDot, 
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
                    curDot, 
                    curDimensions["w"], 
                    curDimensions["h"]
                );
                let x = cords0.x
                let y = cords0.y
                let dot = curDot;

                if (dot.dot.dot_icon_id !== null && !isOffline) {
                    let width = steps_to_px(dot.dot.dot_icon.width_in_steps, canvas.height);
                    let height = steps_to_px(dot.dot.dot_icon.hight_in_steps, canvas.height);

                    context.drawImage(getLoadedIcon(dot.dot.dot_icon_id), x - width / 2, y - height / 2, width, height);
                }
                // Make sure we're not going to draw a null dot, because the icon can't be loaded
                else if (dot.dot.dot_icon_id === null) {
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
                }
    

                if (followDot !== undefined) {
                    if (userOptions.highlightUser.id === data[curUserIndex]["show_user"]["show_user_id"]) {
                        followDotCords = {x: x, y: y};
                        drawUserDialogue(x, y, curDot);
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

        /**
         * Draw Point Animation
         * FIXED
         * @param {Float} x0 start x
         * @param {Float} y0 start y
         * @param {Float} x1 end x
         * @param {Float} y1 end y
         * @param {Integer} counts 
         * @param {Integer} count 
         * @param {Color} color 
         * @param {String} userLabel 
         * @param {Boolean} isHighlighted 
         * @param {DotInfo} dotInfo {dot_link, show_user, user}
         */
        const drawPointAnimation = (x0, y0, x1, y1, counts, count, color, userLabel, isHighlighted, dotInfo) => {
            const dot_icon_id = dotInfo["dot_link"]["cur_dot"]["dot_icon_id"];
            const show_user_id = dotInfo["show_user"]["id"];
            const user_id = dotInfo["user"]["id"];
            
            // y = mx + b
            if (x1 - x0 !== 0) {
                const m = (y1 - y0) / (x1 - x0)
                const b = y0 - (m * x0) 
    
                const x = ((x1 - x0) / counts * count) + x0;
                const y = m * x + b;


                // If it's an icon, draw the icon
                if (dot_icon_id !== null && !isOffline) {
                    // TODO: Reimplement
                    // let width = steps_to_px(dot.dot.dot_icon.width_in_steps, canvas.height);
                    // let height = steps_to_px(dot.dot.dot_icon.hight_in_steps, canvas.height);
                    let width = 10;
                    let height = 10;

                    context.drawImage(getLoadedIcon(dotInfo["dot_link"]["dot_icon_id"]), x - width / 2, y - height / 2, width, height);
                }

                // Otherwise draw the normal point
                // Make sure we're not going to draw a null dot, because the icon can't be loaded
                else if (dot_icon_id === null) {
                    drawPoint(x, y, color, userLabel)
                    
                    let highlightedUserData = getHighlightedUserData(data, curSet, userOptions);

                    if (
                        highlightedUserData !== null && 
                        highlightedUserData.show_user.show_user_id === dotInfo["show_user"]["show_user_id"] && 
                        followDot === undefined
                    ) {
                        if (userOptions.showMovementBrackets) {
                            // TODO: ADD BACK
                            // drawUserName(dot);

                            // Find actual dot when it's between 2
                            // TODO: FIX cordsToDot
                            // let actDot = cordsToDot(x, y, curDimensions["w"], curDimensions["h"], dot.dot);
                            // drawMovementBrackets(x, y, actDot);
                        }

                    }
                }


                if (isHighlighted) {
                    // console.log(followDot, dot)
                    if (followDot !== undefined && followDot["user"]["id"] === dotInfo["user"]["id"]) {
                        followDotCords = {x: x, y: y};
                        if (!userOptions.showMovementBrackets) {
                            // TODO: ADD BACK
                            // drawUserDialogue(x, y, dotInfo["show_user"]);
                        }
                    }
                }

            } 

            // Single Axis movement in the y-axis direction
            else {
                const x = x0
                const y = ((y1 - y0) / counts * count) + y0;

                if (dot_icon_id !== null && !isOffline) {
                    // TODO: Reimplement
                    // let width = steps_to_px(dot.dot.dot_icon.width_in_steps, canvas.height);
                    // let height = steps_to_px(dot.dot.dot_icon.hight_in_steps, canvas.height);
                    let width = 10;
                    let height = 10;

                    context.drawImage(getLoadedIcon(dot_icon_id), x - width / 2, y - height / 2, width, height);
                }
                // Make sure we're not going to draw a null dot, because the icon can't be loaded
                else if (dot_icon_id === null) {
                    drawPoint(x, y, color, userLabel);

                    let highlightedUserData = getHighlightedUserData(data, curSet, userOptions); 

                    if (
                        highlightedUserData !== null && 
                        highlightedUserData.show_user.show_user_id === show_user_id && 
                        followDot === undefined
                    ) {
                        if (userOptions.showMovementBrackets) {
                            drawUserName(dotInfo["show_user"]);

                            // Find actual dot when it's between 2
                            let actDot = cordsToDot(x,y, curDimensions["w"], curDimensions["h"], dotInfo["dot_link"]);
                            drawMovementBrackets(x, y, actDot);
                        }

                    }
                }

                if (isHighlighted) {
                    if (followDot !== undefined && followDot["user"]["id"] === user_id) {
                        followDotCords = {x: x, y: y};
                        if (!userOptions.showMovementBrackets) {
                            drawUserDialogue(x, y, dotInfo["show_user"]);
                        }
                    }
                }
            }
            
        };

        /**
         * Clears the screen
         */
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
            
            drawHashes(canvas, context, userOptions);
        };

        /**
         * Check if a given Translation X and Translation Y is within the given context
         * @param {CanvasRenderingContext2D} ctx Context
         * @param {Float} transX Translation X
         * @param {Float} transY Translation Y
         * @returns {Boolean|Boolean|Boolean|Boolean}  xInBound, yInBound, xOutBounds, yOutBounds
         */
        const checkIfInBounds = (ctx, transX, transY) => {
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

        /**
         * Resize Canvas when there is a change
         */
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

        /**
         * Handle Pan and Zoom
         * @param {CanvasRenderingContext2D} ctx Context
         */
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

                const boundCalc = checkIfInBounds(ctx, cameraOffset.x, cameraOffset.y);
                
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

        /**
         * Get Color of Dot
         * Fixed
         * @param {DotInfo} dotInfo {dot_link, show_user, user}
         * @param {Boolean} highlighted 
         * @param {Boolean} useSectionColors 
         * @returns {Color} color of user
         */
        const getDotColor = (dotInfo, highlighted, useSectionColors) => {
            // Get Band Section
            let show_user_section_id = dotInfo["r"]["band_section_id"];

            if (dotInfo.r === undefined || dotInfo.g === undefined || dotInfo.b === undefined) {
                return CURRENT_DOT_COLOR;
            }
            

            let color = "rgb(" + dotInfo.r + ", " + dotInfo.g + ", " + dotInfo.b + ")";
            if (!useSectionColors && highlighted) {
                color = CURRENT_DOT_COLOR;
            }
            else if (!useSectionColors) {
                color = CURRENT_DOT_HIGHLIGHT_COLOR;
            }
            else if (!highlighted) {
                color = "rgba(" + dotInfo.r + ", " + dotInfo.g + ", " + dotInfo.b + ", 0.4)"
            }

            return color
        }

        /**
         * Get Highlighted User Data
         * FIXED!
         * @param {Object} data root data object
         * @param {Integer} curSet 
         * @param {Object} userOptions 
         * @returns {DotInfo} {dot_link, show_user, user}
         */
        const getHighlightedUserData = (data, curSet, userOptions) => {
            if (userOptions.highlightUser !== null) {
                for (let x = 0; x < data.length; x++) {
                    if (userOptions.highlightUser.id === data[x]["show_user"]["id"]) {
                        return constructDotInfo(data[x]["dot_links"][curSet], data[x]["show_user"], data[x]["user"]);
                    }
                }
            }

            return null;
        }

        /**
         * Construct Dot Info
         * @param {Object} show_user 
         * @param {Object} user 
         * @param {Object} dot_link 
         * @returns {DotInfo} dot info
         */
        const constructDotInfo = (show_user, user, dot_link) => {
            return {
                "dot_link": dot_link,
                "show_user": show_user,
                "user": user,
            };
        }

        /**
         * Get User Name
         * @param {Object} show_user_data 
         * @returns {String} user name
         */
        const getUserName = (show_user_data) => {
            const first_name = show_user_data["user"]["first_name"];
            const last_name = show_user_data["user"]["last_name"];

            if (first_name === null || first_name === undefined || last_name === null || last_name === undefined) {
                return "Inactivated";
            }
            return first_name + " " + last_name;
        }

        /**
         * Takes data from API and draws them, used to condense the render method
         * FIXED
         * @param {Object} data
         * @param {Integer} curSetIndex
         * @returns {Object} new dots
         */
        const drawDots = (data, curSetIndex) => {
            let newDots = [];
            let drawBracket = {useX:null, useY:null, dot:null};
            let highlightedUserData = getHighlightedUserData(data, curSetIndex, userOptions);

            // Loop Through Show Users
            for (let i = 0; i < data.length; i++) {
                const show_user = data[i];
                const dot_link = show_user["dot_links"][curSetIndex]["dot_link"];
                const dot_info = constructDotInfo(show_user["show_user"], show_user["user"], dot_link);
                
                newDots.push(dot_info);

                // NEW IMPLEMENTATION 5/28/23
                let cords = convertDotToCords(dot_info, curDimensions["w"], curDimensions["h"]);
                
                let useX = cords.x;
                let useY = cords.y;
                
                // Check if there is a user highlighted
                if (highlightedUserData !== null) {
                    // Check if the current dot being read is that label
                    if (highlightedUserData["show_user"]["id"] === show_user["show_user"]["id"]) {
                        if (userOptions.showMovementBrackets) {
                            drawBracket = {useX:useX, useY:useY, dot:dot_info};
                        }

                        let color = getDotColor(dot_info, true, userOptions.useSectionColors)
                        drawHighlightedPoint(data, curSetIndex, i, userOptions, color, getUserName(show_user["show_user"]))
                    }

                    // Check if we're highlighting the section
                    else if (userOptions.highlightSection) {
                        // Check if this dot is part of the highlighted section
                        if (highlightedUserData["show_user"]["band_section_id"] === show_user["show_user"]["band_section_id"]) {
                            let color = getDotColor(dot_info, true, userOptions.useSectionColors)
                            drawHighlightedPoint(data, curSetIndex, i, userOptions, color, getUserName(show_user["show_user"]))
                        }

                        // If it's an icon dot
                        else if (dot_link["dot_icon_id"] !== null && !isOffline) {
                            // TODO: Add Back
                            // let width = steps_to_px(dot.dot.dot_icon.width_in_steps, canvas.height);
                            // let height = steps_to_px(dot.dot.dot_icon.hight_in_steps, canvas.height);

                            // context.drawImage(getLoadedIcon(dot.dot.dot_icon_id), useX - width / 2, useY - height / 2, width, height);
                        }

                        // Else dim others 
                        // Make sure we're not going to draw a null dot, because the icon can't be loaded
                        else if (dot_link["dot_icon_id"] === null)  {
                            let color = getDotColor(dot_info, false, userOptions.useSectionColors)
                            drawPoint(useX, useY, color, dot_info["show_user"]["label"]);
                        }
                    }

                    // If it's an icon dot
                    else if (dot_link["dot_icon_id"] !== null && !isOffline) {
                        // TODO
                        // let width = steps_to_px(dot.dot.dot_icon.width_in_steps, canvas.height);
                        // let height = steps_to_px(dot.dot.dot_icon.hight_in_steps, canvas.height);

                        // context.drawImage(getLoadedIcon(dot.dot.dot_icon_id), useX - width / 2, useY - height / 2, width, height);
                    }

                    // If not, handel all of the not selected dots
                    // Make sure we're not going to draw a null dot, because the icon can't be loaded
                    else if (dot_link["dot_icon_id"] === null)  {
                        let color = getDotColor(dot_info, !userOptions.dimOtherUsers, userOptions.useSectionColors)
                        drawPoint(useX, useY, color, dot_info["show_user"]["label"]);
                    }
                }
                
                else if (dot_link["dot_icon_id"] !== null && !isOffline) {
                    // TODO: ADD BACK
                    // let width = steps_to_px(dot.dot.dot_icon.width_in_steps, canvas.height);
                    // let height = steps_to_px(dot.dot.dot_icon.hight_in_steps, canvas.height);


                    // context.drawImage(getLoadedIcon(dot.dot.dot_icon_id), useX - width / 2, useY - height / 2, width, height);
                }

                // Since nothing is selected, just highlight all
                // Make sure we're not going to draw a null dot, because the icon can't be loaded
                else if (dot_link["dot_icon_id"] === null)  {
                    let color = getDotColor(dot_info, true, userOptions.useSectionColors)
                    drawPoint(useX, useY, color, dot_info["show_user"]["label"]);
                }
            }


            if (drawBracket.useX !== null && followDot === undefined) {
                drawUserName(drawBracket.dot)
                drawMovementBrackets(drawBracket.useX, drawBracket.useY, dotFromBits(drawBracket.dot["dot_pos"]));
            }

            return newDots;
        }

        // STOPPED REFACTORING HERE

        /**
         * Takes data from API, and draws the animation
         */
        const drawAnimation = () => {
            // This is so if we're playing the show, the sets don't overlap
            const MARGIN = 100;

            const set_info = drawInfo["sets"][curSet];

            // If there is nothing to animate, or it shouldn't be animating.... don't animate
            if (drawInfo.length === 0 && (curSet !== lastSetID || isCountsMode()) && set_info !== undefined) {
                setIsAnimation(false); 
                setAnimationStartTime(0);
            }

            let startTime = animationStartTime;
            let curActualTime = (audioPlaying || isCountsMode()) ? curPlayTime * 1000 : Date.now();
            let durationInSecs = 2000; // Default Value
            
            // If audio is playing or is in counts mode
            if (audioPlaying || isCountsMode()) {
                startTime = set_info["start_time_code"];
                curActualTime = curPlayTime * 1000;
            } 
            // Otherwise if this is the start, set the start time to the current time
            else if (animationStartTime === 0) {
                startTime = Date.now();
                curActualTime = Date.now();
                setAnimationStartTime(startTime); 
            }

            // Find what the data says the duration is if it's supposed to
            if (audioPlaying || isCountsMode() || userOptions.useActualSetLength) {
                let setStartTime = set_info["start_time_code"];
                let setEndTime = set_info["end_time_code"];
                if (setStartTime !== null && setEndTime !== null) {
                    durationInSecs = setEndTime - setStartTime - MARGIN;
                }
            }

            // If the duration is 0, then just end the animation here. 
            // This is because below when it finds curTime it divides and you cannot divide by zero
            if (durationInSecs === 0) { setIsAnimation(false); setAnimationStartTime(0); return; }

            let counts = set_info.counts;

            // 2000 / 2000
            let curTime = (curActualTime - startTime) / ((durationInSecs / counts))

            // -1: Backward
            //  0: No Move
            //  1: Forward
            let direction = 0;

            let curSetData = drawInfo[curSet].dots;
            let lastSetData = drawInfo[lastSetID].dots;

            if (isCountsMode() && curSet > 0) {
                lastSetData = drawInfo[curSet - 1].dots;
            }

            if (curSet > lastSetID) { direction = 1;  }
            else                    { direction = -1; }

            if (animationDirection !== direction) { setAnimationDirection(direction); }

            // console.log(curSet, lastSetID, curTime + 1 > counts);

            let highlightedUserData = getHighlightedUserData(data, curSet, userOptions);
            
            for (let x = 0; x < Math.min(curSetData.length, lastSetData.length); x++) {
                const dot = curSetData[x];
                let lastDot = lastSetData[x];
                

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
                    else if (userOptions.highlightSection) {
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
        }

        /**
         * Main Rendering Method
         * @param {CanvasRenderingContext2D} ctx Context
         */
        const render = ctx => {
            ctx.save();

            // Dynamic resizing!
            try {
                dynamicResize();   
            } catch (error) {
                console.log("Failed to Resize")
            }

            // console.log(curDimensions);

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

            clear();
            // console.log(lastSetID !== curSet, animationDirection !== 0, !loading, data.length !== 0, isAnimation);

            let isNewFrame = lastSetID !== curSet && animationDirection !== 0 && !loading  && data.length !== 0;
            let isRerender = hadResize && !loading && data.length !== 0 && data !== drawInfo;
            
            drawDots(drawInfo, curSet);

            // If it is an animation, draw the animation
            if (isAnimation || (isCountsMode() && lastSetID !== -1 && curSet > 0)) {
                // console.log("DRAWING ANIMATION between "+ lastSetID + " and " + curSet);
                // Sometimes there's problems
                try {
                    // drawAnimation();
                } catch (error) {
                    console.log("CAUGHT ERROR")
                    console.log(error)
                }
            }
            
            // Check to see if we have a new frame (right after an animation)
            else if ((isNewFrame || isRerender) && data[curSet].dots !== undefined) {
                console.log("NEW FRAME!")
                setDrawInfo(data);
                setLastSetID(curSet);
                setAnimationDirection(0);

                if (hadResize) { setHadResize(false); }
                
                let newDots = drawDots(data, curSet);
                setDots(newDots)

                if (hoverDot.x !== undefined && !userOptions.showMovementBrackets) {
                    drawUserDialogue(hoverDot.x, hoverDot.y, hoverDot);
                }
            }

            // If it isn't a new frame, used a buffered frame. This is so we don't set vars and overwrite things.
            else if (drawInfo.length > curSet && drawInfo[curSet] !== undefined)  {
                // console.log(curSet, lastSetID)
                let newDots = drawDots(drawInfo, curSet);
                setDots(newDots)

                if (hoverDot.x !== undefined && !userOptions.showMovementBrackets) {
                    drawUserDialogue(hoverDot.x, hoverDot.y, hoverDot);
                }
            }

            ctx.restore()
            animationFrameId = requestAnimationFrame(() => render(ctx))
        }
        try {
            render(context)
        } catch (error) {
            console.log(error)
        }

        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, hoverDot, cameraOffset, cameraZoom, isAnimation, isDragging, animationDirection, followDot, audioPlaying, curPlayTime, userOptions])

    useEffect(() => {
        console.log("Canvas Updating for " + curSet)
        setAnimationStartTime(Date.now());
        setIsAnimation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                // console.log("ON DOT")
                if (userOptions.showMovementBrackets && userOptions.highlightUser.id !== dot.dot.show_user_id) {
                    setUserOptions({...userOptions, "highlightUser": {"id": dot.dot.show_user_id, "label": dot.userLabel}})
                }
                else {
                    setHoverDot({...dot, "x": cords.x, "y": cords.y});
                }
            }
        });
        

        if (!wasOnDot && !userOptions.showMovementBrackets && hoverDot["x"]  !== undefined) {
            setHoverDot({});
        }

        else if (
            !wasOnDot && 
            userOptions.showMovementBrackets && 
            userOptions.highlightUser !== null &&
            userOptions.highlightUser.id !== userData.id
        ) {
            if (hoverDot["x"] !== undefined) {
                setHoverDot({});
            }
            if (userOptions.highlightUser.id !== userData.show_user_id) {
                setUserOptions({...userOptions, "highlightUser": {"id": userData.show_user_id, "label": userData.label}})
            }
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
        dotHover(e);
    }

    const onPointerUp = (e) => {
        // console.log("POINTER UP!")
        setIsDragging(false);
        setInitialPinchDistance(null);
        setLastZoom(cameraZoom);
    }

    const onPointerMove = (e) => {
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
            let tempCameraZoom = cameraZoom;
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
            let showUserID = userData.show_user_id;
            // let userLabel = userOptions.highlightUser.label;
            
            for (let i = 0; i < dots.length; i++) {
                if (dots[i].dot.show_user_id === showUserID) {
                    setFollowDot(dots[i]);
                }
            }
        } else if (!userOptions.followingUser && followDot !== undefined) {
            setFollowDot(undefined);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default Canvas;
