import React, { useState, useEffect, useRef } from 'react'

// Components
import ShowDisplay from './ShowDisplay/ShowDisplay';
import NormalViewerSideBar from './SideBar/NormalViewerSideBar';

// Utilities
import getApi from '../../utils/getApi';
import axios from "axios";


// Styling
// TODO: CHANGE OR REMOVE
// import './BetaViewer.css';
import 'bootstrap/dist/css/bootstrap.css';

const NormalViewer = (props) => {
    // Prop Handling
    const {
        localDataHandler, 
        userOptionsHandler, 
        token, 
        showCode, 
        userData, 
        showID, 
        isOffline, 
        logout
    } = props;

    // State
    const [curSetState, setCurSetState]  = useState(-1);                                        // Store current index of the show
	const [audioPlaying, setAudioPlaying] = useState(false);                                    // Is the audio playing?
	const [curShowTimestamp, setShowTimestamp] = useState(0);                                   // Current timestamp in the Show
	const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);     // Check if we're in landscape
	const [hoverUserInfo, setHoverUserInfo] = useState({show: false, dot: null});               // Store Data about the user that's being hovered over (ie Name & Label)

    // Refs
    const setInputRef = useRef(null);
	const canvasRef = useRef(null);
    const showDisplayRef = useRef(null);
    const { navbarRef } = props;

	let animationTimeoutID = null; // Store the timeout ID for the animation

	/**
	 * Update Navigation Bar
	 * @description This function updates the navigation bar with the current counts and measures.
	 * It checks if the navbarRef is defined and if it has a current property.
	 * If it does, it calls the setCounts and setMeasures methods on the navbarRef.
	 * @param {Integer} counts 
	 * @param {String} measures 
	 * @returns 
	 */
	const updateNavBar = (counts, measures) => {
		if (!navbarRef || !navbarRef.current) {
			return;
		}

		navbarRef.current.updateNavBar(counts, measures);
	}
	
    /**
     * Get Current Set Index
     * @returns The current set index, or 0 if the current set is not found
     * @description This function checks the current set against the current show timestamp.
     * If the current set is consistent with the current show timestamp, it returns the current set index.
     * If the current set is not consistent, it finds the correct set index by iterating through the sets.
     * If no set is found, it returns 0.
     */
    const getCurSet = () => {
        if (localDataHandler.sets.length === 0) {
			updateNavBar(0, "0");
            return -1;
        }

        const checkingSet = localDataHandler.sets[curSetState];
        // console.log(curSetState)

        if (checkingSet === undefined) {
            console.error("Current set is undefined, returning 0", localDataHandler.sets, curSetState);
			updateNavBar(0, "0");
            return 0;
        }
            

        // Check if the current set is consistent with the current show timestamp
        if (checkingSet.start_time_code >= curShowTimestamp && checkingSet.end_time_code < curShowTimestamp) {
            // console.log(curSetState, getCurSetNumb(curSetState))

			updateNavBar(checkingSet.counts, checkingSet.measure);
            return curSetState;
        }
        // If the current set is not consistent, find the correct set
		const set = localDataHandler.sets.find((set) => set.start_time_code <= curShowTimestamp && set.end_time_code > curShowTimestamp);
        
		if (set === undefined) {
			console.error("No set found for current show timestamp: " + curShowTimestamp);
			updateNavBar(0, "0");
			return curSetState;
		}

		// If a set is found, update the current set state and return the index
		setCurSetState(set.show_index);
		updateNavBar(set.counts, set.measure);
		return set.show_index;
    }

	/**
	 * Set the current set index
	 * @description This function sets the current set index to the given index.
	 * It also updates the current show timestamp to the start time code of the new set.
	 * If the index is out of bounds, it logs an error and does nothing.
	 * @param {Integer} index 
	 * @returns 
	 */
    const setCurSet = (index) => {
        if (index < 0 || index >= localDataHandler.sets.length) {
            console.error("Invalid set index: " + index);
            return;
        }
        // Set the current set state to the new index
        setCurSetState(index);

        // Update the current show timestamp to the start time code of the new set
        const newSet = localDataHandler.sets[index];
        setShowTimestamp(newSet.start_time_code);
        // If the new set is not found, return
        if (newSet === undefined) {
            console.error("New set is undefined, returning");
            return;
        }

        // Update the show display with the new set
        if (showDisplayRef.current) {
            showDisplayRef.current.update_show_display(localDataHandler.data);
        }
    }

	/**
	 * 
	 * @param {Integer} cur_set_index 
	 * @param {Integer} next_set_index 
	 * @param {Integer} steps 
	 * @param {Float} step_time 
	 */
	const animateSet = (cur_set_index, next_set_index, steps, step_time) => {
		const curSet = localDataHandler.sets[cur_set_index];
		const nextSet = localDataHandler.sets[next_set_index];
		
		if (curSet === undefined || nextSet === undefined) {
			console.error("Current or next set is undefined, cannot animate");
			return;
		}
		
		// let start_time_code = curSet.start_time_code;
		let start_time_code = curShowTimestamp;
		let end_time_code = nextSet.start_time_code;
		console.log("Starting animation from set " + cur_set_index + " to set " + next_set_index, start_time_code, end_time_code);

		if (cur_set_index > next_set_index) {
			// start_time_code = curSet.start_time_code;
			// end_time_code = nextSet.start_time_code;
		}

		const step_delta = (end_time_code - start_time_code) / steps;
		const animate = (currentStep) => {
			if (currentStep >= steps) {
				setShowTimestamp(end_time_code);
				animationTimeoutID = null; // Reset the timeout ID

				// Fire the callback to update the show display
				if (showDisplayRef.current) {
					showDisplayRef.current.update_show_display(localDataHandler.data);
				}
				return;
			}
			const newTime = start_time_code + (step_delta * currentStep);
			setShowTimestamp(newTime);
			animationTimeoutID = setTimeout(() => animate(currentStep + 1), step_time);
		}

		// Clear any previous animation timeout
		// This ensures that if the function is called multiple times, the previous animation is cancelled
		// This is important to prevent multiple animations from running at the same time
		// and causing unexpected behavior
		if (animationTimeoutID !== null) {
			console.log("Clearing previous animation timeout", animationTimeoutID);
			clearTimeout(animationTimeoutID);
		}
		// Start the animation
		animate(0);
	}

	/**
	 * Default Animate Set
	 * @description This function animates the set change from the current set to the next set.
	 * It uses the animateSet function to perform the animation.
	 * It takes the next set index as a parameter and animates the transition over 50 steps with a step time of 200ms.
	 * If the next set index is out of bounds, it does nothing.
	 * @param {Integer} next_set_index 
	 */
	const defaultAnimateSet = (next_set_index) => {
		animateSet(curSetState, next_set_index, 50, 50);
	}

	/**
	 * Get Current Set Number
	 * @returns {Integer} The current set number
	 * @description This function returns the current set number based on the current set state.
	 * If the current set is undefined, it returns 0.
	 */
    const getCurSetNumb = () => {
        const curSet = localDataHandler.sets[curSetState];
        if (curSet === undefined) {
            // console.error("Current set is undefined, returning 0");
            return 0;
        }
        // console.log(curSet)
        return curSet.set_numb;
    }

	/**
	 * Set Current Set Number
	 * @description This function sets the current set number to the given set number.
	 * It iterates through the sets and finds the set with the given set number.
	 * If the set is found, it sets the current set state to the index of the set and animates the transition.
	 * If the set is not found, it logs an error and returns the current set number.
	 * @param {Integer} set_numb 
	 * @returns 
	 */
    const setCurSetNumb = (set_numb) => {
		// Find the set with the given set number
		const set = localDataHandler.sets.find((set) => set.set_numb === set_numb);

        if (set === undefined) {
			// If the set is found, set the current set state to the index of the set
        	console.error("Set with number " + set_numb + " not found");

			// If the set is not found, return the current set number
        	return getCurSetNumb();
		}

		// animateSet(curSetState, set.show_index, 16 * Math.abs(set.show_index - curSetState), 60);
		defaultAnimateSet(set.show_index);
    	return set_numb;
    }
    const getSetName = () => {
        return "NO NAME"
    }

    // TODO: REMOVE - for testing only
    useEffect(() => {
        if (showDisplayRef !== null) {
            const data = localDataHandler.data;

            showDisplayRef.current.update_show_display(data)
        }
    }, [showDisplayRef]);

    useEffect(() => {
        console.log("Show Timestamp Update: ", curShowTimestamp);

		getCurSet();
    }, [curShowTimestamp]);

    useEffect(() => {
		// Once everything is loaded, set the current set state to the first set
		if (curSetState === -1 && localDataHandler.sets.length !== 0 && localDataHandler.data.length !== 0)	{
			setCurSetState(0);
		}
    }
    , [localDataHandler.sets, localDataHandler.data]);

    return (
        <>
            <div className="flex-row justify-content-center d-flex align-items-center canvasDivClass" ref={canvasRef}>
                <ShowDisplay 
                    data={localDataHandler.data}
                    sets={localDataHandler.sets}
                    userOptionsHandler={userOptionsHandler}
                    userData={userData}
                    token={token}
                    isOffline = {isOffline}

                    curSetState={curSetState}
                    getCurSet={getCurSet} 
                    audioPlaying={audioPlaying}
                    curShowTimestamp={curShowTimestamp}
                    hoverUserInfo={hoverUserInfo}
                    setHoverUserInfo={setHoverUserInfo}
                    ref={showDisplayRef}
                />
                {/*
                TODO: ADD BACK
                <UserInfoDialogue hoverUserInfo={hoverUserInfo} canvasRef={canvasRef}/>
                */}
            </div>

            <NormalViewerSideBar 
				curSetState={curSetState}
                getCurSet={getCurSet}
                setInputRef={setInputRef}
                setCurSetNumb={setCurSetNumb}
                setCurSet={setCurSet}
				defaultAnimateSet={defaultAnimateSet}
                getSetName={getSetName}
                getCurSetNumb={getCurSetNumb}

				audioPlaying={audioPlaying}
                curShowTimestamp={curShowTimestamp}
				setAudioPlaying={setAudioPlaying}
				setShowTimestamp={setShowTimestamp}
				localDataHandler={localDataHandler}
				userOptions={userOptionsHandler}

				sets={localDataHandler.sets}
			/>
        </>
    )
}

export default NormalViewer;