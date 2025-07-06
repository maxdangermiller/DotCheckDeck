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
    const {localDataHandler, userOptionsHandler, token, showCode, userData, showID, isOffline, logout} = props;

    // State
    const [curSet, setCurSet]  = useState(0);                                                   // Store current index of the show
	const [audioPlaying, setAudioPlaying] = useState(false);                                    // Is the audio playing?
	const [curPlayTime, setCurPlayTime] = useState(0);                                          // Current Play Time in Show
	const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);     // Check if we're in landscape
	const [hoverUserInfo, setHoverUserInfo] = useState({show: false, dot: null});               // Store Data about the user that's being hovered over (ie Name & Label)

    // Refs
    const setInputRef = useRef(null);
	const canvasRef = useRef(null);
    const showDisplayRef = useRef(null);


    const setCurSetNumb = () => {

    }
    const changeCurSetNumb = (x) => {
        setCurSet(x);
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

                    curSet={curSet} 
                    audioPlaying={audioPlaying}
                    curPlayTime={curPlayTime}
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
				curSet={curSet}
                setInputRef={setInputRef}
                setCurSetNumb={setCurSetNumb}
                changeCurSetNumb={changeCurSetNumb}
                getSetName={getSetName}
			/>
        </>
    )
}

export default NormalViewer;