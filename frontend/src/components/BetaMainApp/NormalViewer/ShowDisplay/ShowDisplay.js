import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

import {convertDotToCords, convertDotLinkToCords, steps_to_px} from './convertDotToCords';
import fieldDisplay from './fieldDisplay';
import showPropHandler from './showPropHandler';

const MAX_ZOOM = 5;
const MIN_ZOOM = 0.9;
const SCROLL_SENSITIVITY = 0.0005;

const FUTURE_DOT_COLOR = "rgba(0, 100, 0, 0.8)";
const PREVIOUS_DOT_COLOR = "rgba(100, 0, 0, 0.8)";
const CURRENT_DOT_COLOR = "rgb(0, 0, 255)";
const CURRENT_DOT_HIGHLIGHT_COLOR = "rgba(0, 0, 255, 0.4)";

const DOT_RELATIVE_SIZE = 0.006; // As a fraction of the screen height


/**
 * ShowDisplay Component
 * 
 * This component is responsible for displaying the show data in a canvas format.
 * It handles panning, zooming, and rendering the user points on the canvas.
 * @param {Object} props - The properties passed to the component.
 * @param {Object} ref - The ref to allow parent components to call methods on this component.
 * @returns {JSX.Element} The rendered canvas element.
 */
const ShowDisplay = forwardRef((props, ref) => {
    // Prop Handling
    const {
        data, sets, userOptionsHandler, userData, 
        token, isOffline, curSetState, getCurSet, 
        audioPlaying, curShowTimestamp, hoverUserInfo, 
        setHoverUserInfo
    } = props;


    /*  ------------------------------  STATE SECTION  ------------------------------- */

    // Display State
    const [curDimensions, setDimensions]  = useState({"w": 0, "h": 0});
    const [cameraZoom, setCameraZoom] = useState(1);
    const [translation, setTranslation] = useState({x: 0, y: 0});
    const [cameraOffset, setCameraOffset] = useState({x: 0, y: 0});
    const [followDot, setFollowDot] = useState(undefined);
    const [hoverDot, setHoverDot] = useState(undefined);


    // Pan and Zoom State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPinchDistance, setInitialPinchDistance] = useState(null);
    const [lastZoom, setLastZoom] = useState(1);

    const [loadedIcons, setLoadedIcons] = useState([])

    

    // Refs
    const canvasRef = useRef(null);

    // Update Canvas Callback
    const update_canvas = (new_dot_links) => {
        // Currently no need to do anything, 
        // as the render method uses the props directly
    }

    /**
     * Get Current Set's ID
     * @returns {Integer} set id
     */
    const getCurSetID = () => {
        for (let i = 0; i < sets.length; i++) {
            if (sets[i].show_index === getCurSet()) {
                return sets[i].id;
            }
        }
        return -1;
    }

    // Allow a parent ref to call the methods inside of this method
    useImperativeHandle(ref, () => ({
        
        /**
         * Update Method to be called by Viewer Parent
         * @param {Array<DotLink>} prev_dot_links array of previous set dot link
         * @param {Array<DotLink>} curr_dot_links array of current set dot link
         * @param {Array<DotLink>} next_dot_links array of next set dot link
         */
        update_show_display(new_dot_links) {
            update_canvas(new_dot_links);
        }

        // TODO:    Add update method to call from the NormalViewer when the set changes 
        //          instead of using state like it has been.
    
    }));

    /**
     * Get Color of Dot
     * @param {Object} show_user array item of the provided data from Viewer 
     * @param {Boolean} is_dimmed should the alpha of the color be 0.4?
     * @param {Boolean} use_section_colors comes from preferences, should the section colors be used?
     * @returns {Color} color of user
     */
    const getDotColor = (show_user, is_dimmed, use_section_colors) => {
        if (!use_section_colors && !is_dimmed) {
            return CURRENT_DOT_COLOR;
        }
        else if (!use_section_colors) {
            return CURRENT_DOT_HIGHLIGHT_COLOR;
        }
        else if (is_dimmed) {
            return "rgba(" + show_user.r + ", " + show_user.g + ", " + show_user.b + ", 0.4)"
        }

        // If the user is highlighted, use the current dot color as the default color
        return "rgb(" + show_user.r + ", " + show_user.g + ", " + show_user.b + ")";
    }


    // RENDER METHOD
    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let animationFrameId
        let followDotCords = {x: 0, y: 0};

        /**
         * Draw a User Point
         * @param {Float} x 
         * @param {Float} y 
         * @param {Color} color 
         * @param {String} label 
         */
        const drawPoint = (x, y, color, label) => {
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, canvas.height * DOT_RELATIVE_SIZE, 0, 2 * Math.PI);
            context.fill();
            context.closePath();

            context.beginPath();
            context.font = canvas.height * 0.015 + 'px ArialBlack';
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(label, x, y + canvas.height * 0.015);
            context.closePath();
        };

        /**
         * Draw a Prop Icon
         * @param {Float} x 
         * @param {Float} y 
         * @param {DotIcon} dot_icon 
         */
        const drawProp = (x, y, dot_icon) => {
            // let width = steps_to_px(dot.dot.dot_icon.width_in_steps, canvas.height);
            // let height = steps_to_px(dot.dot.dot_icon.hight_in_steps, canvas.height);
            let width = steps_to_px(dot_icon.width_in_steps, canvas.height);
            let height = steps_to_px(dot_icon.hight_in_steps, canvas.height);
            
            let x0 = x - width / 2;
            let y0 = y - height / 2;

            const icon = showPropHandler.getLoadedIcon(dot_icon.id, loadedIcons, setLoadedIcons, token);
            
            // console.log("DRAW PROP: ", icon, x0, y0, width, height);
            context.drawImage(icon, x0, y0, width, height);
        }

        /**
         * Clears the screen
         */
        const clear = () => {
            const outScale = MIN_ZOOM - 1; // Default will be 0
            // Clear everything
            context.clearRect(
                canvas.width * outScale, 
                canvas.height * outScale, 
                canvas.width + canvas.width * MIN_ZOOM, 
                canvas.height + canvas.height * MIN_ZOOM
            );
            
            fieldDisplay.drawField(canvas, context, userOptionsHandler.userOptions);
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
                /*
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
                */

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
         * Main Rendering Method
         * @param {CanvasRenderingContext2D} ctx Context
         */
        const render = ctx => {
            ctx.save();

            // Dynamic resizing!
            dynamicResize();

            // console.log(curDimensions);

            if (curDimensions["w"] !== canvas.width || curDimensions["h" !== canvas.height]) {
                setDimensions({"w": canvas.width, "h": canvas.height});
                // TODO: setHadResize(true);
            }
            if (cameraOffset === null) {
                setCameraOffset({x: canvas.width / 2, y: canvas.height / 2});
                // setCameraOffset({x: 0, y: 0})
            }

            // Pan and zoom
            doPanAndZoom(ctx);

            clear();

            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            const curSet = getCurSet();

            // Draw all the points
            // Loop through each show user in the data
            for (let i = 0; i < data.length; i++) {
                const show_user = data[i];

                const dot_link = show_user.dot_links[curSet];

                if (dot_link === undefined) {
                    console.log("[ShowDisplay.js -> render]: Show User ", show_user, " doesn't have a dot link for " + curSet);
                    continue;
                }

                const cords = convertDotLinkToCords(dot_link, width, height, curShowTimestamp,sets);
                const color = getDotColor(show_user, false, userOptionsHandler.userOptions.useSectionColors);

                // console

                // Draw the point if it isn't an icon
                if (dot_link.cur_dot.dot_icon_id === null) {
                    drawPoint(cords.x, cords.y, color, show_user.show_user.label);
                    continue;
                } 
                
                else {
                    drawProp(cords.x, cords.y, dot_link.cur_dot.dot_icon);
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
    }, [curShowTimestamp, cameraOffset, cameraZoom])


    /*  ----------------------------  USER HOVER SECTION  ---------------------------- */
    const check_user_hover = (event) => {

        let left = canvasRef.current.offsetLeft + canvasRef.current.clientLeft;
        let top = canvasRef.current.offsetTop + canvasRef.current.clientTop;

        let x = (event.pageX - left - translation.x) / translation.s;
        let y = (event.pageY - top - translation.y) / translation.s;

        // console.log(x, y);

        const dot_margin = Math.max(canvasRef.current.height, canvasRef.current.width) * DOT_RELATIVE_SIZE;

        let wasOnDot = false;

        const userOptions = userOptionsHandler.userOptions;
        const curSet = getCurSet();


        for (let i = 0; i < data.length; i++) {
            const show_user = data[i];

            const dot_link = show_user.dot_links[curSet];

            if (dot_link === undefined) {
                console.log("[ShowDisplay.js -> render]: Show User ", show_user, " doesn't have a dot link for " + curSet);
                continue;
            }

            const cords = convertDotLinkToCords(dot_link, canvasRef.current.width, canvasRef.current.height, curShowTimestamp,sets);

            // Draw the dot isn't an icon, use dot_margin
            if (dot_link.cur_dot.dot_icon_id === null) {
                if (cordsWithinMargin(x, y, cords, dot_margin, dot_margin)) {
                    // console.log("Hovering over user ", show_user.show_user.label);
                    userOptionsHandler.changeHighlightUser(show_user.show_user.id, show_user.show_user.label)
                    return;
                }
            }
            // If it is an icon, use half the width and height as margin
            else {
                const icon_width = steps_to_px(dot_link.cur_dot.dot_icon.width_in_steps, canvasRef.current.height);
                const icon_height = steps_to_px(dot_link.cur_dot.dot_icon.hight_in_steps, canvasRef.current.height);
                if (cordsWithinMargin(x, y, cords, icon_width / 2, icon_height / 2)) {
                    // console.log("Hovering over icon ", show_user.show_user.label);
                    userOptionsHandler.changeHighlightUser(show_user.show_user.id, show_user.show_user.label)
                    return;
                }
            }
        }

        // If we didn't find anything that we are hovering over, clear the highlight
        // TODO: Figure out why this causes problems
        // userOptionsHandler.selectUserForHighlighting();
        return;
    }


    /**
     * Cords within margin
     * @param {Float} x 
     * @param {Float} y 
     * @param {Object[Int, Int]} target_cords 
     * @param {Float} x_margin 
     * @param {Float} y_margin 
     * @returns {Boolean} is within margin
     */
    const cordsWithinMargin = (x, y, target_cords, x_margin, y_margin) => {
        if (Math.abs(x - target_cords.x) > x_margin) {
            return false;
        }
        if (Math.abs(y - target_cords.y) > y_margin) {
            return false;
        }
        return true;
    }


    /*  -----------------------------  PAN TILT SECTION  ----------------------------- */

    /**
     * Get the event location on the canvas in coordinates
     * 
     * The event gives the coords in the form of x,y cords on the page, 
     * so it needs to be converted to coords on the canvas
     * 
     * @param {Event} e canvas event
     * @returns {Integer, Integer} {x,y} coordinates
     */
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


    /**
     * Get Relative Event Location using canvas pan and zoom
     * 
     * @param {Event} e canvas event
     * @returns {Integer, Integer} {x,y} coordinates
     */
    const getRelEventLocation = (e) => {
        return {
            x: getEventLocation(e).x / cameraZoom - cameraOffset.x,
            y: getEventLocation(e).y / cameraZoom - cameraOffset.y
        }
    }

    /**
     * On Pointer Down
     * 
     * Assume when the pointer is down, that the user's intention is to drag and pan on the canvas
     * 
     * Start is dragging var
     * Set the drag start using getRelEventLocation
     * Do a dot hover check
     * 
     * @param {Event} e canvas event
     */
    const onPointerDown = (e) => {
        setIsDragging(true);
        setDragStart( getRelEventLocation(e) );
        check_user_hover(e);
    }


    /**
     * Pointer Up
     * 
     * @param {Event} e canvas event
     */
    const onPointerUp = (e) => {
        // console.log("POINTER UP!")
        setIsDragging(false);
        setInitialPinchDistance(null);
        setLastZoom(cameraZoom);
    }

    /**
     * On Pointer Move
     * 
     * @param {Event} e canvas event
     */
    const onPointerMove = (e) => {
        if (isDragging) {
            setCameraOffset({x: getEventLocation(e).x/cameraZoom - dragStart.x, y: getEventLocation(e).y/cameraZoom - dragStart.y});
        }
        check_user_hover(e);
    }

    /**
     * Handle Touch for mobile
     * 
     * @param {Event} e canvas event
     */
    const handleTouch = (e, singleTouchHandler) => {
        // console.log("TOUCH!")
        if ( e.touches.length === 1 ) {
            singleTouchHandler(e)
        } else if (e.type === "touchmove" && e.touches.length === 2) {
            setIsDragging(false);
            handlePinch(e)
        }
        check_user_hover(e);
    }

    /**
     * Handle Pinch for mobile
     * 
     * @param {Event} e canvas event
     */
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

    /**
     * Handle Zoom
     * 
     * @param {Event} e canvas event
     */
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


    // Pay attention to mouse and touch events that happen outside of the canvas as well
    // This prevents dragging from getting "stuck" if the user moves their mouse too fast
    useEffect(() => {

        // Attach event listeners
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown));
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', (e) => handleTouch(e, onPointerUp));
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove));
        document.addEventListener('mousemove', onPointerMove);

        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('touchstart', (e) => handleTouch(e, onPointerDown));
            document.removeEventListener('mouseup', onPointerUp);
            document.removeEventListener('touchend', (e) => handleTouch(e, onPointerUp));
            document.removeEventListener('mousemove', onPointerMove);
            document.removeEventListener('touchmove', (e) => handleTouch(e, onPointerMove));
            document.removeEventListener('mousemove', onPointerMove);
        };
    }, []);


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
});

export default ShowDisplay;