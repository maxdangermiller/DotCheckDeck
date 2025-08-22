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


    // State
    const [curDimensions, setDimensions]  = useState({"w": 0, "h": 0});
    const [cameraZoom, setCameraZoom] = useState(1);
    const [translation, setTranslation] = useState({x: 0, y: 0});
    const [cameraOffset, setCameraOffset] = useState({x: 0, y: 0});

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPinchDistance, setInitialPinchDistance] = useState(null);
    const [lastZoom, setLastZoom] = useState(1);

    const [loadedIcons, setLoadedIcons] = useState([])

    

    // Refs
    const canvasRef = useRef(null);

    const update_canvas = (new_dot_links) => {

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
            context.arc(x, y, canvas.height * 0.006, 0, 2 * Math.PI);
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
            for (let i = 0; i < data.length; i++) {
                const show_user = data[i];

                const dot_link = show_user.dot_links[curSet];

                // const cords = convertDotToCords(dot_link.cur_dot.dot_info, width, height);
                const cords = convertDotLinkToCords(dot_link, width, height, curShowTimestamp,sets);
                const color = getDotColor(show_user, false, userOptionsHandler.userOptions.useSectionColors);

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
        // TODO: DOT HOVER
        // dotHover(e);
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
        // TODO: DOT HOVER
        // dotHover(e);
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
        // TODO: DOT HOVER
        // dotHover(e);
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