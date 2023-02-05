import React, { useState, useEffect, useRef } from 'react'
import './ViewerSideBar.css';
import OptionsDropDown from './ViewerSideBarComponents/OptionsDropDown';
import OptionsModal from './ViewerSideBarComponents/OptionsModal';
import AudioProgressBar from './AdminComponents/TimelinePage/AudioProgressBar';
import Spinner from './utils/Spinner';

// STILL WORKING ON THIS! NOT TESTED YET!

const ViewerSideBar = (props) => {
    const { 
        curSetInfo, curSetNumb, setInput, 
        curSet, sets, changeCurSet, handelSetBtnControls, 
        loading, setCurSetNumb, changeCurSetNumb, 
        userOptions, setUserOptions, data, 
        audioPlaying, setAudioPlaying, audio, 
        curPlayTime, setCurPlayTime, ...rest 
    } = props;

    const [showSettings, setShowSettings] = useState(false);

    let setName = data.length > curSet && data[curSet] !== undefined ? data[curSet]["setName"] : "";

    return (
        <div className="flex-column justify-content-between d-flex align-items-center sideBarClass">
            <div className='mb-2 flex-column justify-content-center d-flex align-items-center' style={{height: "30vh"}}>
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
                
                {
                    // Add Other conditions here
                    !loading && curSetInfo !== null ?
                    <div>
                        <h1 className='centerText'><strong>Name:</strong> {setName}</h1>
                        <h1 className='centerText'><strong>Measure:</strong> {curSetInfo["measure"]}</h1>
                        <h1 className='centerText'><strong>Total Counts:</strong> 0</h1>
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

            <OptionsModal
                show = {showSettings}
                setShow = {setShowSettings}
                userOptions={userOptions}
                setUserOptions={setUserOptions} 
                data={data} 
                curSet={curSet}
            />

            <div className='mb-2 flex-column justify-content-center d-flex align-items-center mediaControlRow'>
                <div className='flex-row justify-content-center d-flex align-items-center' style={{height: '30%'}}>
                    <AudioProgressBar 
                        curPlayTime={curPlayTime} 
                        setCurPlayTime={setCurPlayTime} 
                        audio={audio} 
                        isPlaying={audioPlaying} 
                        setIsPlaying={setAudioPlaying}
                    />
                </div>
                <div className='flex-row justify-content-center d-flex align-items-center'>

                    <button 
                        type="button" 
                        className='fas customViewerSideBarBtn backwardBtn'
                        onClick={() => handelSetBtnControls(curSet - 1)}
                        disabled={curSet > 0 ? false : true}
                    >&#xf0a8;</button>

                    <PausePlayBtn isPlaying={audioPlaying} setIsPlaying={setAudioPlaying} className="customViewerPlayPauseBtn"/>

                    <button 
                        type="button" 
                        className='fas customViewerSideBarBtn forwardBtn'
                        onClick={() => handelSetBtnControls(curSet + 1)}
                        disabled={curSet < sets.length - 1 ? false : true}
                    >&#xf0a9;</button>
                </div>
            </div>

            <div className='btn btn-success' onClick={(e) => setShowSettings(!showSettings)}>Settings</div>
        </div>
    );
};

export default ViewerSideBar;

const PausePlayBtn = (props) => {
    const {isPlaying, setIsPlaying, ...rest} = props;

    if (isPlaying) {
        return (
            <button 
                className={'fas customViewerSideBarBtn'} 
                onClick={(e) => setIsPlaying(!isPlaying)}
            >&#xf28b;</button>
        );
    }
    return (
        <button className={'fas customViewerSideBarBtn'} onClick={(e) => setIsPlaying(!isPlaying)}>&#xf144;</button>
    );
}