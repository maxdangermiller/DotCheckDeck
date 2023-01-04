import React, { useState, useEffect, useRef } from 'react';
import AdminTimelineObj from './AdminTimelineObj';
import './AdminTimeline.css';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";
const PIXELS_PER_SECOND = 10;
const DEFAULT_LENGTH = 10;
const MIN_SIZE = 1;

const DRAG_STATE_NONE = 0;
const DRAG_STATE_LEFT = 1;
const DRAG_STATE_RIGHT = 2;

let audio = new Audio("https://arrangerspublishingcompany.com/count_s45/shows/steampunk.mp3");

const AdminTimeline = (props) => {
    const { schoolCode, token, ...rest } = props

    const [curPlayTime, setCurPlayTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [dragInTimeline, setDragInTimeline] = useState(false);

    const [timelineResizeInfo, setTimelineResizeInfo] = useState({ 
        state: DRAG_STATE_NONE,
        index: -1,
        currentlyResizing: false,
        startX: -1,
        startY: -1
    });

    const [data, setData] = useState([]);
    const intervalRef = useRef();
    const dragItem = useRef();
    const dragOverItem = useRef();
    
    
    const currentPercentage = audio.duration
    ? `${(curPlayTime / audio.duration) * 100}%`
    : "0%";
    const trackStyling = `
        -webkit-gradient(linear, 0% 0%, 100% 0%, color-stop(${currentPercentage}, #777), color-stop(${currentPercentage}, #777))
    `;

    const startTimer = () => {
        // Clear any timers already running
        clearInterval(intervalRef.current);
    
        intervalRef.current = setInterval(() => {
            if (audio.ended) {
                // Do nothing
            } else {
                setCurPlayTime(audio.currentTime);
            }
        }, [1000]);
    };

    const secsToMS = (seconds) => {
        return new Date(seconds * 1000).toISOString().slice(14, 19)
    }


    const onScrub = (value) => {
        // Clear any timers already running
        clearInterval(intervalRef.current);
        audio.currentTime = value;
        setCurPlayTime(audio.currentTime);
    };
    
    const onScrubEnd = () => {
        // If not already playing, start
        if (!isPlaying) {
          // setIsPlaying(true);
        }
        startTimer();
    };

    useEffect(() => {
		fetch(WINDOW_LOCATION + "/sets?school_code=" + schoolCode + "&token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
                    setData(result);
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
	}, [])

    useEffect(() => {
        if (isPlaying) {
            audio.play();
            startTimer();
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        // Pause and clean up on unmount
        return () => {
            audio.pause();
            clearInterval(intervalRef.current);
        };
    }, []);

    const dragStart = (e, index) => {
        dragItem.current = index;
    };

    const dragEnterTimeline = (e) => {
        setDragInTimeline(true);
    };

    const dragEnterBank = (e) => {
        setDragInTimeline(false);
    };

    const changeTimeCodes = (index, start, end) => {
        if (Math.abs(start - end) <= MIN_SIZE) { return; }

        const newData = data.map((_value, i) => {
            if (i === index) {
                _value["start_time_code"] = start
                _value["end_time_code"] = end

            }

            return _value;
        });

        setData(newData);
    };

    const dragEnd = (e) => {
        const newData = data.map((_value, i) => {
            if (i === dragItem.current) {
                if (dragInTimeline && _value["start_time_code"] == null || _value["end_time_code"] == null) {
                    let lastSetEnd = data[i - 1]["end_time_code"];
                    _value["start_time_code"] = lastSetEnd;
                    _value["end_time_code"] = lastSetEnd + DEFAULT_LENGTH;
                } else if (!dragInTimeline) {
                    _value["start_time_code"] = null;
                    _value["end_time_code"] = null;
                }

            }

            return _value;
        });

        setData(newData);
        dragItem.current = null;
        setDragInTimeline(false);
    };
    
    
    const calcTimelineWidth = (setData) => {
        let length = setData.end_time_code - setData.start_time_code;

        return PIXELS_PER_SECOND * length;
    }

    const isInTimeline = (setData) => {
        return setData.start_time_code !== null && setData.end_time_code !== null
    }

    const checkStartTimelineResize = (e) => {
        if (timelineResizeInfo.state !== DRAG_STATE_NONE) {
            setTimelineResizeInfo({ 
                state: timelineResizeInfo.state,
                index: timelineResizeInfo.index,
                currentlyResizing: true,
                startX: e.clientX,
                startY: e.clientY
            });
        }
    }

    const resizeTimelineObj = (e) => {
        if (timelineResizeInfo.state === DRAG_STATE_NONE || !timelineResizeInfo.currentlyResizing) { return; }

        let xDistance = e.clientX - timelineResizeInfo.startX;
        let seconds = Math.floor(xDistance / PIXELS_PER_SECOND);
        let index = timelineResizeInfo.index;

        console.log({x: e.clientX, y: e.clientY}, timelineResizeInfo.state)
        console.log(xDistance, seconds);

        if (timelineResizeInfo.state === DRAG_STATE_LEFT) {
            changeTimeCodes(index, data[index]["start_time_code"] + seconds, data[index]["end_time_code"]);
        }
        else if (timelineResizeInfo.state === DRAG_STATE_RIGHT) {
            changeTimeCodes(index, data[index]["start_time_code"], data[index]["end_time_code"] + seconds);
        }

        setTimelineResizeInfo({ 
            state: timelineResizeInfo.state,
            index: timelineResizeInfo.index,
            currentlyResizing: true,
            startX: e.clientX,
            startY: e.clientY
        });
    }

    const checkEndTimelineResize = (e) => {
        resizeTimelineObj(e);

        setTimelineResizeInfo({ 
            state: timelineResizeInfo.state,
            index: timelineResizeInfo.index,
            currentlyResizing: false,
            startX: -1,
            startY: -1
        });
    }

    return(
        <div className="flex-column justify-content-center d-flex align-items-center adminTimelineFullScreen">
            <h1 className="customHeader">Admin</h1>
            <div 
                className="timelineOverflow" 
                onDragEnter={(e) => dragEnterTimeline(e)}
                onMouseDown={(e) => checkStartTimelineResize(e)}
                onMouseMove={(e) => resizeTimelineObj(e)}
                onMouseUp={(e) => checkEndTimelineResize(e)}
            >
                {
                    data.map((setData, index) => 
                        isInTimeline(setData) ?
                        <AdminTimelineObj 
                            width={calcTimelineWidth(setData)} 
                            height="100%" 
                            value={setData.setNumb} 
                            key={setData.id}
                            index={index}
                            setData={setData}

                            dragStart={dragStart}
                            dragEnd={dragEnd}
                            changeTimeCodes={changeTimeCodes}
                            timelineResizeInfo={timelineResizeInfo}
                            setTimelineResizeInfo={setTimelineResizeInfo}

                            PIXELS_PER_SECOND={PIXELS_PER_SECOND}
                        />
                        : dragInTimeline && index === dragItem.current ?
                        <AdminTimelineObj 
                            width="6vw"
                            height="100%" 
                            value={setData.setNumb} 
                            key={setData.id}
                            index={index}
                            setData={setData}

                            dragStart={dragStart}
                            dragEnd={dragEnd}
                            changeTimeCodes={changeTimeCodes}
                            timelineResizeInfo={timelineResizeInfo}
                            setTimelineResizeInfo={setTimelineResizeInfo}

                            PIXELS_PER_SECOND={PIXELS_PER_SECOND}
                        />
                        : null
                    )
                }
            </div>

            <div className="timelineOverflow" onDragEnter={(e) => dragEnterBank(e)}>
                {
                    data.map((setData, index) => 
                        !isInTimeline(setData) || (!dragInTimeline && index === dragItem.current) ?
                        <AdminTimelineObj 
                            width="6vw"
                            height="100%" 
                            value={setData.setNumb} 
                            key={setData.id}
                            index={index}
                            setData={setData}

                            dragStart={dragStart}
                            dragEnd={dragEnd}
                            changeTimeCodes={changeTimeCodes}
                            timelineResizeInfo={timelineResizeInfo}
                            setTimelineResizeInfo={setTimelineResizeInfo}

                            PIXELS_PER_SECOND={PIXELS_PER_SECOND}
                        />
                        : null
                    )
                }    
            </div>
        </div>
    );
}

/*

<input
    type="range"
    value={curPlayTime}
    step="1"
    min="0"
    max={audio.duration ? audio.duration : 0}
    className="timelineProgress"
    onChange={(e) => onScrub(e.target.value)}
    onMouseUp={onScrubEnd}
    onKeyUp={onScrubEnd}
    style={{ background: trackStyling }}
/>
*/

export default AdminTimeline;
