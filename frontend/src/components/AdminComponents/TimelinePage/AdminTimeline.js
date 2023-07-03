import React, { useState, useEffect, useRef } from 'react';
import AdminTimelineObj from './AdminTimelineObj';
import AdminTimelineTimestamp from './AdminTimelineTimestamp';
import PausePlayBtn from './PausePlayBtn';
import AudioProgressBar from './AudioProgressBar';
import './AdminTimeline.css';
import { fontSize } from '@mui/system';
import getApi from '../../getApi';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const WINDOW_LOCATION = getApi();
const PIXELS_PER_SECOND = 10;
const PIXELS_PER_MS = PIXELS_PER_SECOND / 1000;
const DEFAULT_LENGTH = 10000;
const MIN_SIZE = 1;
const TIMESTAMP_INTERVAL = 10;

const DRAG_STATE_NONE = 0;
const DRAG_STATE_LEFT = 1;
const DRAG_STATE_RIGHT = 2;

const AdminTimeline = (props) => {
    const { schoolCode, token, ...rest } = props

    const [curPlayTime, setCurPlayTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [dragInTimeline, setDragInTimeline] = useState(false);
    const [audio, setAudio] = useState(new Audio());

    const [timelineResizeInfo, setTimelineResizeInfo] = useState({ 
        state: DRAG_STATE_NONE,
        index: -1,
        currentlyResizing: false,
        startX: -1,
        startY: -1,
        initialStart: -1,
        initialEnd: -1,
    });

    const [data, setData] = useState([]);
    const dragItem = useRef();
    const dialDivRef = useRef();
    


    const formatMS = (val) => {
        let mins = Math.floor(val / 60000);
        let secs = Math.floor((val % 60000) / 1000);
        let ms = Math.floor((val % 60000) % 1000);

        if (secs < 10) { secs = "0" + secs; }

        if (ms < 10) { ms = "00" + ms; }
        else if (ms < 100) { ms = "0" + ms; }

        console.log()

        return mins + ":" + secs + ":" + ms;
    }

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
		setAudio(new Audio(WINDOW_LOCATION + "/get-audio?school_code=" + schoolCode + "&token=" + token));
	}, [])

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
        if (end - start <= MIN_SIZE) { return; }

        // TODO: MUST CHANGE SETS AROUND IT, OTHERWISE THERE WILL BE BLANKS

        let shift = 0;

        const newData = data.map((_value, i) => {
            if (i === index) {
                _value["start_time_code"] = start;
                _value["end_time_code"] = end;
                
            }
            
            else if (i > index && _value["start_time_code"] !== null && _value["end_time_code"] !== null) {
                let diff = _value["end_time_code"] - _value["start_time_code"];
                _value["start_time_code"] = end + shift;
                _value["end_time_code"] = end + diff + shift;
                
                shift = _value["end_time_code"] - end;
                 
            }

            return _value;
        });

        setData(newData);
    };

    const dragEnd = (e) => {
        const newData = data.map((_value, i) => {
            if (i === dragItem.current) {
                if (dragInTimeline && _value["start_time_code"] == null || _value["end_time_code"] == null) {
                    let lastSetEnd = 0;
                    if (i > 0) {
                        lastSetEnd = data[i - 1]["end_time_code"];
                    } 
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

        return PIXELS_PER_MS * length;
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
                startY: e.clientY,
                initialStart: timelineResizeInfo.initialStart,
                initialEnd: timelineResizeInfo.initialEnd
            });
        }
    }

    const resizeTimelineObj = (e) => {
        if (timelineResizeInfo.state === DRAG_STATE_NONE || !timelineResizeInfo.currentlyResizing) { return; }

        let xDistance = e.clientX - timelineResizeInfo.startX;
        let seconds = Math.floor(xDistance / PIXELS_PER_MS);
        let index = timelineResizeInfo.index;
        
        if (timelineResizeInfo.state === DRAG_STATE_RIGHT) {
            let alreadyMovedSecs = data[index]["end_time_code"] - timelineResizeInfo.initialEnd;

            changeTimeCodes(index, data[index]["start_time_code"], data[index]["end_time_code"] + seconds - alreadyMovedSecs);
        }
    }

    const checkEndTimelineResize = (e) => {
        resizeTimelineObj(e);

        setTimelineResizeInfo({ 
            state: timelineResizeInfo.state,
            index: timelineResizeInfo.index,
            currentlyResizing: false,
            startX: -1,
            startY: -1,
            initialStart: timelineResizeInfo.initialStart,
            initialEnd: timelineResizeInfo.initialEnd
        });
    }

    const getTimestamps = () => {
        let content = [];

        let timestamps = Math.floor(audio.duration / TIMESTAMP_INTERVAL);
        let timestampWidth = TIMESTAMP_INTERVAL * PIXELS_PER_SECOND;

        content.push(<AdminTimelineTimestamp width={Math.floor(timestampWidth / 2) + "px"} text="0:00" align="left" key="0"/>);

        for (let i = 1; i < timestamps; i++) {
            let val = formatMS(i * TIMESTAMP_INTERVAL * 1000)
            content.push(<AdminTimelineTimestamp width={timestampWidth + "px"} text={val} align="center" key={i}/>);
        }

        return content;
    }

    const drawDial = () => {
        if (dialDivRef.current === undefined) { return; }

        const FONT_SIZE = 24;

        let rect = dialDivRef.current.getBoundingClientRect();
        let x = rect.x + (curPlayTime * 1000 * PIXELS_PER_MS);
        let y = rect.y;

        let textStyle = {
            textAlign: "center", 
            position: "absolute", left: x - 50, top: y - FONT_SIZE,
            width: "100px",
            fontSize: FONT_SIZE
        };

        let dialStyle = {
            textAlign: "center", 
            position: "absolute", left: x - (FONT_SIZE / 2), top: y,
            fontSize: FONT_SIZE
        };

        return (
            <div>
                <div style={textStyle}>{formatMS(curPlayTime * 1000)}</div>
                <i style={dialStyle}>
                    <KeyboardArrowDownIcon height="100%"/>
                </i>
            </div>
        );
        
    }

    const saveData = () => {
        fetch(WINDOW_LOCATION + '/update-sets', {
            method: 'POST',
            body: JSON.stringify({data}),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + token
            }
            })
            .then(res => res.json())
            .then(
                (result) => {
                    console.log(result);
                    window.location.reload();
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.log(error);
                    alert(error)
                }
            );
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
                <div className='flex-row d-flex' style={{height: "20%"}} ref={dialDivRef}>
                    {drawDial()}
                </div>
                <div className='flex-row d-flex' style={{height: "20%"}}>
                    {getTimestamps()}
                </div>
                <div className='flex-row d-flex' style={{height: "60%"}}>
                {
                    data.map((setData, index) => 
                        isInTimeline(setData) ?
                        <AdminTimelineObj 
                            width={calcTimelineWidth(setData)} 
                            height="100%" 
                            value={setData.set_numb} 
                            key={setData.id}
                            index={index}
                            setData={setData}

                            dragStart={dragStart}
                            dragEnd={dragEnd}
                            changeTimeCodes={changeTimeCodes}
                            timelineResizeInfo={timelineResizeInfo}
                            setTimelineResizeInfo={setTimelineResizeInfo}
                        />
                        : dragInTimeline && index === dragItem.current ?
                        <AdminTimelineObj 
                            width="6vw"
                            height="100%" 
                            value={setData.set_numb} 
                            key={setData.id}
                            index={index}
                            setData={setData}

                            dragStart={dragStart}
                            dragEnd={dragEnd}
                            changeTimeCodes={changeTimeCodes}
                            timelineResizeInfo={timelineResizeInfo}
                            setTimelineResizeInfo={setTimelineResizeInfo}
                        />
                        : null
                    )
                }
                </div>
            </div>

            <div className="timelineOverflow" onDragEnter={(e) => dragEnterBank(e)}>
                <div className='flex-row d-flex' style={{height: "100%"}}>
                {
                    data.map((setData, index) => 
                        !isInTimeline(setData) || (!dragInTimeline && index === dragItem.current) ?
                        <AdminTimelineObj 
                            width="6vw"
                            height="100%" 
                            value={setData.set_numb} 
                            key={setData.id}
                            index={index}
                            setData={setData}

                            dragStart={dragStart}
                            dragEnd={dragEnd}
                            changeTimeCodes={changeTimeCodes}
                            timelineResizeInfo={timelineResizeInfo}
                            setTimelineResizeInfo={setTimelineResizeInfo}
                        />
                        : null
                    )
                }  
                </div>  
            </div>
            
            <div className='flex-row d-flex justify-content-center align-items-center' style={{width: "80%"}}>
                <AudioProgressBar 
                    curPlayTime={curPlayTime} 
                    setCurPlayTime={setCurPlayTime} 
                    audio={audio} 
                    isPlaying={isPlaying} 
                    setIsPlaying={setIsPlaying}
                />
                <PausePlayBtn isPlaying={isPlaying} setIsPlaying={setIsPlaying}/>
            </div>
            <button className="btn btn-outline-success btn-lg px-5" type="submit" onClick={e => saveData(e)}>Save</button>
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
