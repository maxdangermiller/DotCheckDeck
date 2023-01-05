import React, { useState, useEffect, useRef } from 'react';

const DRAG_STATE_NONE = 0;
const DRAG_STATE_LEFT = 1;
const DRAG_STATE_RIGHT = 2;

const AdminTimelineObj = (props) => {
    const {
        width, height, value, 
        index, setData, dragStart, 
        dragEnd, changeTimeCodes, 
        timelineResizeInfo, setTimelineResizeInfo, 
        PIXELS_PER_SECOND, ...rest
    } = props;

    const [dragState, setDragState] = useState(0); // 0: none, 1: left, 2: right
    const [dragStartCords, setDragStartCords] = useState({x: 0, y: 0});
    const containerRef = useRef();

    const checkForEdgeHover = (event) => {
        const HOVER_MARGIN = 5;

        // Don't do anything if we're currently resizing
        if (timelineResizeInfo.currentlyResizing) { return; }

        // Prevent the text being picked up, so that the cords are only the rectangle
        if (event.target.nodeName !== "rect") { return; }

        let rect = event.target.getBoundingClientRect();
        let x = event.clientX - rect.left; // x position within the element.
        let y = event.clientY - rect.top;  // y position within the element.

        // Hovering on right side
        if (Math.abs(rect.width - x) <= HOVER_MARGIN) {
            containerRef.current.style.cursor = "col-resize";
            setTimelineResizeInfo({ 
                state: DRAG_STATE_RIGHT,
                index: index,
                currentlyResizing: false,
                startX: -1,
                startY: -1,
                initialStart: setData.start_time_code,
                initialEnd: setData.end_time_code
            })
        }
        // Not hovering on anything
        else {
            containerRef.current.style.cursor = "default";
            setTimelineResizeInfo({ 
                state: DRAG_STATE_NONE,
                index: index,
                currentlyResizing: false,
                startX: -1,
                startY: -1,
                initialStart: -1,
                initialEnd: -1
            })
        }
    }

    const secsToMS = (seconds) => {
        return new Date(seconds * 1000).toISOString().slice(14, 19)
    }

    return(
        <div 
            className='col adminTimelineObj' 
            onDragStart={(e) => dragStart(e, index)} 
            onDragEnd={(e) => dragEnd(e)} 
            onMouseMove={(e) => checkForEdgeHover(e)}
            
            draggable={timelineResizeInfo.state === DRAG_STATE_NONE}
            ref={containerRef}

            title={secsToMS(setData["start_time_code"]) + "-" + secsToMS(setData["end_time_code"])}
        > 
            <svg height={height} width={width}>
                <rect x="0" y="0" width={width} height={height} fill="silver" stroke="grey" strokeWidth="1" ry="5" rx="5"/>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className='prevent-select'>{value}</text>
            </svg>
        </div>
    );
};

export default AdminTimelineObj;