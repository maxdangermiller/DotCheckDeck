import React, { useState, useEffect } from 'react'
import AudioProgressBar from './AudioProgressBar';

import {ReactComponent as LeftArrow} from '../../../../icons/circle-arrow-left.svg';
import {ReactComponent as RightArrow} from '../../../../icons/circle-arrow-right.svg';
import {ReactComponent as PauseIcon} from '../../../../icons/circle-pause.svg';
import {ReactComponent as PlayIcon} from '../../../../icons/circle-play.svg';

const AudioPlayer = (props) => {
    const {
        curPlayTime, setCurPlayTime, audio, 
        audioPlaying, setAudioPlaying, updateSetBasedOnAudioTime, 
        handelSetBtnControls, sets, curSet, userOptions
    } = props;

    /**
     * Get if the user has selected counts display mode
     * @returns {boolean} If the display mode is counts
     */
    const isCountsMode = () => {
        return userOptions["displayMode"] === 1;
    }

    /**
     * Get Current Set Display
     * @returns {ReactComponent} Cur Set Number in span
     */
    const getCurSetDisplay = () => {
        if (isCountsMode() && curSet < sets.length) {
            return (
                <span 
                    style={{
                        width: "25%", 
                        textAlign: "center", 
                        fontSize: "1rem", 
                        fontFamily: "var(--bs-body-font-family)"
                    }}
                >
                    {sets[curSet].set_numb}
                </span>
            );
        }
        return null;
    }
    /**
     * Get Next Set Display
     * @returns {ReactComponent} Next Set Number in span
     */
    const getNextSetDisplay = () => {
        if (isCountsMode()) {
            if (curSet + 1 < sets.length) {
                return (
                    <span 
                        style={{
                            width: "25%", 
                            textAlign: "center", 
                            fontSize: "1rem", 
                            fontFamily: "var(--bs-body-font-family)"
                        }}
                    >
                        {sets[curSet + 1].set_numb}
                    </span>
                );
            }
            return <span>END</span>
        }
        return null;
    }

    const getCurCountDisplay = () => {
        if (!isCountsMode() || sets.length < curSet || sets[curSet] === undefined) {
            return null;
        }

        const start_time_code = sets[curSet].start_time_code;
        const end_time_code = sets[curSet].end_time_code;
        const counts = sets[curSet].counts;

        const curTime = curPlayTime * 1000 - start_time_code;
        const length = end_time_code - start_time_code;
        const msInCount = length / counts;
        const curCount = parseInt(curTime / msInCount) + 1;

        return <div className='flex-row justify-content-center d-flex align-items-center' style={{height: '10%', width: '100%'}}>
            {`${curCount}/${counts}`}
        </div>;
    }

    /**
     * Finds the last set's end_time_code
     */
    const getLastEndTimeCode = () => {
        let lastSet = sets[sets.length - 1];
        console.log(lastSet)
        return 10;
    }


    return (
        <div className='mb-2 flex-column justify-content-center d-flex align-items-center mediaControlRow'>
            {getCurCountDisplay()}
            <div className='flex-row justify-content-center d-flex align-items-center mb-2' style={{height: '30%', width: '100%'}}>
                {
                    getCurSetDisplay()
                }
                {
                    audio !== null                   
                    ? <AudioProgressBar 
                        curPlayTime={curPlayTime} 
                        setCurPlayTime={setCurPlayTime} 
                        audio={audio} 
                        isPlaying={audioPlaying} 
                        setIsPlaying={setAudioPlaying}
                        updateSetBasedOnAudioTime={updateSetBasedOnAudioTime}
                        isCountsMode={isCountsMode()}
                        curSetInfo={sets[curSet]}
                        lastEndTimeCode={() => getLastEndTimeCode()}
                    />
                    : <span style={{textAlign: "center"}}>OFFLINE</span>
                }
                {
                    getNextSetDisplay()
                }
            </div>
            <div className='flex-row justify-content-between d-flex align-items-center mb-2' style={{width: "90%"}}>

                
                <button 
                    type="button" 
                    className='customViewerSideBarBtn backwardBtn'
                    onClick={() => handelSetBtnControls(-1)}
                    disabled={curSet > 0 ? false : true}
                ><LeftArrow height="100%" fill="currentColor"/></button>

                <PausePlayBtn isPlaying={audioPlaying} setIsPlaying={setAudioPlaying} className="customViewerPlayPauseBtn"/>
                
                <button 
                    type="button" 
                    className='customViewerSideBarBtn forwardBtn'
                    onClick={() => handelSetBtnControls(1)}
                    disabled={sets !== null && curSet < sets.length - 1 ? false : true}
                ><RightArrow height="100%" fill="currentColor"/></button>
            </div>
            
        </div>
    );
};

const PausePlayBtn = (props) => {
    const {isPlaying, setIsPlaying} = props;

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

export default AudioPlayer;