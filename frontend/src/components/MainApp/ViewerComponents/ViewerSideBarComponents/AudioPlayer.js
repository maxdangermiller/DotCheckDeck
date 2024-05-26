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
        handelSetBtnControls, sets, curSet
    } = props;


    return (
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
                        updateSetBasedOnAudioTime={updateSetBasedOnAudioTime}
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