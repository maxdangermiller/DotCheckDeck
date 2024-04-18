import React, { useEffect, useRef } from 'react'

const AudioProgressBar = (props) => {
    const {curPlayTime, setCurPlayTime, audio, isPlaying, setIsPlaying, updateSetBasedOnAudioTime} = props;

    const intervalRef = useRef();

    const currentPercentage = audio.duration
    ? `${(curPlayTime / audio.duration) * 100}%`
    : "0%";
    const trackStyling = `
        -webkit-gradient(linear, 0% 0%, 100% 0%, color-stop(${currentPercentage}, #777), color-stop(${currentPercentage}, #777))
    `;

    useEffect(() => {
        if (isPlaying) {
            audio.play();
            startTimer();
        } else {
            audio.pause();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying]);

    useEffect(() => {
        // Pause and clean up on unmount
        return () => {
            audio.pause();
            clearInterval(intervalRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startTimer = () => {
        // Clear any timers already running
        clearInterval(intervalRef.current);
    
        intervalRef.current = setInterval(() => {
            if (audio.ended || !isPlaying) {
                // Do nothing
            } else if (isPlaying) {
                // console.log(audio.currentTime)
                setCurPlayTime(audio.currentTime);
                updateSetBasedOnAudioTime(audio.currentTime * 1000);
            }
        }, [100]);
    };

    const onScrub = (value) => {
        // Clear any timers already running
        clearInterval(intervalRef.current);
        audio.currentTime = value;
        setCurPlayTime(audio.currentTime);
    };
    
    const onScrubEnd = () => {
        // If not already playing, start
        if (!isPlaying) {
          setIsPlaying(true);
        }
        startTimer();
    };

    return (
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
    );
};

export default AudioProgressBar;