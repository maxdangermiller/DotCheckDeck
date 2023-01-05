import React, { useState, useEffect, useRef } from 'react';

const PausePlayBtn = (props) => {
    const {isPlaying, setIsPlaying, ...rest} = props;

    if (isPlaying) {
        return (

            <button className='material-icons playPauseBtn' onClick={(e) => setIsPlaying(!isPlaying)}>&#xe035;</button>
        );
    }
    return (
        <button className='material-icons playPauseBtn' onClick={(e) => setIsPlaying(!isPlaying)}>&#xe038;</button>
    );
}

export default PausePlayBtn;