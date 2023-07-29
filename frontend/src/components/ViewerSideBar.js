import React, { useState, useEffect, useRef } from 'react'
import IconButton from '@mui/material/IconButton';

import './ViewerSideBar.css';
import OptionsModal from './ViewerSideBarComponents/OptionsModal';
import SetNameModel from './ViewerSideBarComponents/SetNameModel';
import NotesModel from './ViewerSideBarComponents/NotesModel';
import AudioProgressBar from './AdminComponents/TimelinePage/AudioProgressBar';
import Spinner from './utils/Spinner';

import {ReactComponent as LeftArrow} from '../circle-arrow-left.svg';
import {ReactComponent as RightArrow} from '../circle-arrow-right.svg';
import {ReactComponent as PauseIcon} from '../circle-pause.svg';
import {ReactComponent as PlayIcon} from '../circle-play.svg';

const ViewerSideBar = (props) => {
    const { 
        curSetInfo, curSetNumb, setInput, 
        curSet, sets, setSets, changeCurSet, handelSetBtnControls, 
        loading, setCurSetNumb, changeCurSetNumb, 
        userOptions, setUserOptions, data,
        audioPlaying, setAudioPlaying, audio, 
        curPlayTime, setCurPlayTime, token, userData, ...rest 
    } = props;

    const [showSettings, setShowSettings] = useState(false);
    const [showEditSetName, setShowEditSetName] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [tempCurSetInfo, setTempCurSetInfo] = useState({});

    const openEditSetName = () => {
        setShowEditSetName(true);
        setTempCurSetInfo(JSON.parse(JSON.stringify(curSetInfo)));
    }

    let setName = "";
    if (data.length > curSet && curSetInfo !== undefined && curSetInfo !== null && curSetInfo["set_name"] !== null) {
        setName = curSetInfo["set_name"];
    }

    console.log(curSetInfo)

    return (
        <div className="flex-column justify-content-between d-flex align-items-center sideBarClass">
            <div className='mb-2 flex-column justify-content-center d-flex align-items-center' style={{height: "35vh", width: "100%"}}>
                <h1 className='viewerSideBarHeader'>Current Set:</h1>
                {
                    !loading ?
                    <input 
                        ref={setInput} 
                        value={curSetNumb} 
                        className="invisibleInput" 
                        onChange={(e) => setCurSetNumb(e.target.value)} 
                        onKeyDown={(e) => changeCurSetNumb(e)}>
                    </input> :
                    <div className='d-flex flex-column justify-content-center align-items-center spinnerSuspender'>
                        <Spinner />
                    </div>
                }
                <div onClick={(e) => setShowNotes(true)} style={{cursor: "pointer"}}>
                    {
                        // Add Other conditions here
                        !loading && curSetInfo !== null && curSetInfo !== undefined?
                        <div style={{width: "100%"}}>
                            <h1 className='centerText' style={{textOverflow: "ellipsis"}}><strong>Name:</strong> {setName}</h1>
                            <h1 className='centerText'><strong>Measure:</strong> {curSetInfo["measure"]}</h1>
                            <h1 className='centerText'><strong>Total Counts:</strong> {curSetInfo["total_counts"]}</h1>
                            <h1 className='centerText'><strong>Counts:</strong> {curSetInfo["counts"]}</h1>
                        </div> :
                        <div>
                            <h1 className='centerText'><strong>Name:</strong></h1>
                            <h1 className='centerText'><strong>Measure:</strong></h1>
                            <h1 className='centerText'><strong>Total Counts:</strong></h1>
                            <h1 className='centerText'><strong>Counts:</strong></h1>
                        </div>
                    }
                </div>
                
            </div>

            <OptionsModal
                show = {showSettings}
                setShow = {setShowSettings}
                userOptions={userOptions}
                setUserOptions={setUserOptions} 
                data={data} 
                curSet={curSet}
            />

            <SetNameModel 
                show = {showEditSetName}
                setShow = {setShowEditSetName}
                token = {token}
                curSetInfo={tempCurSetInfo}
                setCurSetInfo={setTempCurSetInfo}
                sets={sets}
                setSets={setSets}
            />

            <NotesModel 
                show = {showNotes}
                setShow = {setShowNotes}
                curSetInfo = {curSetInfo}
            />
            

            <div className='mb-2 flex-column justify-content-center d-flex align-items-center mediaControlRow'>
                <div className='flex-row justify-content-center d-flex align-items-center mb-2' style={{height: '30%', width: '100%'}}>
                    {
                        audio !== null                   
                        ? <AudioProgressBar 
                            curPlayTime={curPlayTime} 
                            setCurPlayTime={setCurPlayTime} 
                            audio={audio} 
                            isPlaying={audioPlaying} 
                            setIsPlaying={setAudioPlaying}
                        />
                        : null
                    }
                </div>
                <div className='flex-row justify-content-between d-flex align-items-center mb-2' style={{width: "90%"}}>

                    
                    <button 
                        type="button" 
                        className='customViewerSideBarBtn backwardBtn'
                        onClick={() => handelSetBtnControls(curSet - 1)}
                        disabled={curSet > 0 ? false : true}
                    ><LeftArrow height="100%" fill="currentColor"/></button>

                    <PausePlayBtn isPlaying={audioPlaying} setIsPlaying={setAudioPlaying} className="customViewerPlayPauseBtn"/>
                    
                    <button 
                        type="button" 
                        className='customViewerSideBarBtn forwardBtn'
                        onClick={() => handelSetBtnControls(curSet + 1)}
                        disabled={sets !== null && curSet < sets.length - 1 ? false : true}
                    ><RightArrow height="100%" fill="currentColor"/></button>
                </div>
                
            </div>
            
            <div className='mb-2 flex-column justify-content-center d-flex align-items-center' style={{width:"80%"}}>
                <div className='btn btn-sm btn-secondary mb-1 viewerButton' onClick={(e) => setShowSettings(true)}>Settings</div>
                {
                    userData.is_section_leader ?
                    <div className='btn btn-sm btn-secondary mb-1 viewerButton' onClick={(e) => openEditSetName()}>Edit</div>
                    : null
                }
            </div>
        </div>
    );
};

export default ViewerSideBar;

const PausePlayBtn = (props) => {
    const {isPlaying, setIsPlaying, ...rest} = props;

    if (isPlaying) {
        return (
            <button 
                className="customViewerSideBarBtn"
                onClick={(e) => setIsPlaying(!isPlaying)}
            ><PauseIcon height="100%" fill="currentColor"/></button>
        );
    }
    return (
        <button 
            className='customViewerSideBarBtn'
            onClick={(e) => setIsPlaying(!isPlaying)}
        >
            <PlayIcon height="100%" fill="currentColor"/>
        </button>
    );
}