import React, { useEffect, useRef } from 'react'

const ShowProgressBar = (props) => {
    const {
        curShowTimestamp, setShowTimestamp, audio, 
        isPlaying, setIsPlaying, updateSetBasedOnAudioTime, 
        isCountsMode, curSetInfo, lastEndTimeCode
    } = props;

    /**
     * Units:
     * 
     * curShowTimestamp: seconds
     * audio.duration: seconds
     * curSetInfo.start_time_code: milliseconds
     * curSetInfo.end_time_code: milliseconds
     * updateSetBasedOnAudioTime(): milliseconds
     */

    const intervalRef = useRef();

    let currentPercentage = "0%";
    let minValue = 0;
    let maxValue = 0;

    // Check if the reference exists
    if (!isCountsMode && audio.duration) {
        currentPercentage = `${(curShowTimestamp / audio.duration) * 100}%`;
        maxValue = audio.duration;
    }
    else if (isCountsMode && audio.duration) {
        const progress = curShowTimestamp * 1000 - curSetInfo.start_time_code
        const length = curSetInfo.end_time_code - curSetInfo.start_time_code;

        // minValue = curSetInfo.start_time_code / 1000;
        // maxValue = curSetInfo.end_time_code / 1000;
        minValue = 0;
        maxValue = curSetInfo.counts;

        currentPercentage = `${(progress / length) * 100}%`;
        
        // console.log(minValue, maxValue, progress, length, currentPercentage);
    }

    
    const trackStyling = `
        -webkit-gradient(linear, 0% 0%, 100% 0%, color-stop(${currentPercentage}, #777), color-stop(${currentPercentage}, #777))
    `;

    useEffect(() => {
        if (isPlaying) {
            audio.play();
            if (isCountsMode) {
                startCountsTimer();
            }
            else {
                startNormalTimer();
            }
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

    const startNormalTimer = () => {
        // Clear any timers already running
        clearInterval(intervalRef.current);
    
        intervalRef.current = setInterval(() => {
            if (audio.ended || !isPlaying) {
                // Do nothing
            } else if (isPlaying) {
                // console.log(audio.currentTime)
                setShowTimestamp(audio.currentTime);
                updateSetBasedOnAudioTime(audio.currentTime * 1000);
            }
        }, [100]);
    };

    const startCountsTimer = () => {
        // Clear any timers already running
        clearInterval(intervalRef.current);
        
        intervalRef.current = setInterval(() => {
            setShowTimestamp(audio.currentTime);
            updateSetBasedOnAudioTime(audio.currentTime * 1000);
        }, [100]);
    };

    const onScrub = (value) => {
        // Clear any timers already running
        clearInterval(intervalRef.current);

        if (isCountsMode) {
            // "value" var is in counts

            const length = curSetInfo.end_time_code - curSetInfo.start_time_code;
            const msInCount = length / curSetInfo.counts;
            const curValue = (value * msInCount + curSetInfo.start_time_code) / 1000;

            audio.currentTime = curValue;
            setShowTimestamp(audio.currentTime);
        } 
        else {
            audio.currentTime = value;
            setShowTimestamp(audio.currentTime);
        }
    };
    
    const onScrubEnd = () => {
        // If not already playing, start
        if (!isPlaying && !isCountsMode) {
          setIsPlaying(true);
        }
        if (isCountsMode) {
            startCountsTimer();
        }
        else {
            startNormalTimer();
        }
    };

    const getShowTimestamp = () => {
        if (!isCountsMode) {
            return curShowTimestamp;
        }
        // IS counts mode
        if (!curSetInfo || curSetInfo.counts <= 0) {
            return 0;
        }

        const curTime = curShowTimestamp * 1000 - curSetInfo.start_time_code;
        const length = curSetInfo.end_time_code - curSetInfo.start_time_code;
        const msInCount = length / curSetInfo.counts;
        const curCount = (curTime / msInCount);

        return parseInt(curCount);
    }

    return (
        <input
            type="range"
            value={getShowTimestamp()}
            step="1"
            min={minValue}
            max={maxValue}
            className="timelineProgress"
            onChange={(e) => onScrub(e.target.value)}
            onMouseUp={onScrubEnd}
            onKeyUp={onScrubEnd}
            style={{ background: trackStyling, width: isCountsMode ? "50%" : "80%" }}
        />
    );
};

export default ShowProgressBar;