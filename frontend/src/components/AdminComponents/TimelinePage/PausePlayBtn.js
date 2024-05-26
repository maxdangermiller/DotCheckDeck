import React, { useState, useEffect, useRef } from 'react';
import {ReactComponent as PauseIcon} from '../../../icons/circle-pause.svg';
import {ReactComponent as PlayIcon} from '../../../icons/circle-play.svg';

const PausePlayBtn = (props) => {
    const {isPlaying, setIsPlaying, className, ...rest} = props;

    if (isPlaying) {
        return (
            <button 
                className={"playPauseBtn " + className}
                onClick={(e) => setIsPlaying(!isPlaying)}
            ><PauseIcon height="100%" fill="currentColor"/></button>
        );
    }
    return (
        <button 
            className={"playPauseBtn " + className}
            onClick={(e) => setIsPlaying(!isPlaying)}
        >
            <PlayIcon height="100%" fill="currentColor"/>
        </button>
    );
}

export default PausePlayBtn;
