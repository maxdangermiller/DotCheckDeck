import React, { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap';

import './ViewerSideBar.css';
import OptionsModal from './ViewerSideBarComponents/OptionsModal';
import SetNameModel from './ViewerSideBarComponents/SetNameModel';
import NotesModel from './ViewerSideBarComponents/NotesModel';
import AudioProgressBar from './ViewerSideBarComponents/AudioProgressBar';
import AudioPlayer from './ViewerSideBarComponents/AudioPlayer';

// Settings
import {ReactComponent as SettingsIcon} from '../../../icons/circle-gear.svg';
// Sets/counts display modes
import {ReactComponent as DisplayModeIconSets} from '../../../icons/display-mode-icon-s.svg';
import {ReactComponent as DisplayModeIconCounts} from '../../../icons/display-mode-icon-c.svg';
// Rehearsal Mode
import {ReactComponent as RehearsalModeIcon} from '../../../icons/hourglass-half.svg';
// Edit
import {ReactComponent as EditSetIcon} from '../../../icons/pencil.svg';
// Notes
import {ReactComponent as NotesIcon} from '../../../icons/book.svg';
// Dot Cords (?)
import {ReactComponent as ShowDotCordsIcon} from '../../../icons/question.svg';


import 'bootstrap/dist/css/bootstrap.css';

const ViewerSideBar = (props) => {
    const { 
        curSetInfo, getCurSetNumb, setInput, 
        curSet, sets, setSets, handelSetBtnControls, changeCurSetNumb, 
        userOptions, setUserOptions, data,
        audioPlaying, setAudioPlaying, audio, 
        curPlayTime, setCurPlayTime, token, userData,
        updateSetBasedOnAudioTime
    } = props;

    const [showSettings, setShowSettings] = useState(false);
    const [showEditSetName, setShowEditSetName] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [tempCurSetInfo, setTempCurSetInfo] = useState({});
    const [curSetNumb, setCurSetNumb] = useState("");

    const openEditSetName = () => {
        setShowEditSetName(true);
        setTempCurSetInfo(JSON.parse(JSON.stringify(curSetInfo)));
    }

    const setFollowingUser = (value) => {
		console.log("Setting Following User To: " + value);
		setUserOptions({...userOptions, "followingUser": value});
	}

	const getSetFollowingUserBtnColor = () => {
		if (userOptions.followingUser) {
			return "#5130b8";
		}
		return "#311d6e"; 
	}

    const getDisplayMode = () => {
        if (userOptions["displayMode"] === "sets") {
            return "sets";
        }
        if (userOptions["displayMode"] === "counts") {
            return "counts";
        }
        // If it gets to here it must be either undefined or invalid
        return "sets";
    }

    let setName = "";
    if (data.length > curSet && curSetInfo !== undefined && curSetInfo !== null && curSetInfo["set_name"] !== null) {
        setName = curSetInfo["set_name"];
    }
    
    useEffect(() => {
		setCurSetNumb(getCurSetNumb);
	    // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [curSet, sets])

    return (
        <>
            <div className="sideBarClass">
                <div className='setInfoDisplay'>
                    <input 
                        ref={setInput} 
                        value={curSetNumb} 
                        className="setNumberInput" 
                        onChange={(e) => setCurSetNumb(e.target.value)} 
                        onKeyDown={(e) => changeCurSetNumb(e)}>
                    </input>
                    <h1 className='viewerSideBarNameField'>{setName}</h1>
                </div>
                <AudioPlayer 
                    curPlayTime={curPlayTime}
                    setCurPlayTime={setCurPlayTime}
                    audio={audio}
                    audioPlaying={audioPlaying}
                    setAudioPlaying={setAudioPlaying}
                    updateSetBasedOnAudioTime={updateSetBasedOnAudioTime}
                    handelSetBtnControls={handelSetBtnControls}
                    sets={sets}
                    curSet={curSet}
                />

                <div className='optionsDiv'>
                    <div className='optionsDivRow'>
                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            onClick={() => {setShowSettings(true);}}
                        >
                            <SettingsIcon height="100%" fill="currentColor"/>
                        </button>

                        <button 
                            type="button" 
                            className='customViewerSideBarBtn'
                            onClick={() => {}}
                        >
                            {
                                getDisplayMode() === "sets" ?
                                <DisplayModeIconSets height="100%"/>
                                : <DisplayModeIconCounts height="100%"/>
                            }
                        </button>

                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            onClick={() => {}}
                        >
                            <RehearsalModeIcon height="100%" fill="currentColor"/>
                        </button>
                    </div>

                    <div className='optionsDivRow'>
                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            onClick={() => {setShowEditSetName(true)}}
                            disabled={!userData.is_section_leader}
                        >
                            <EditSetIcon height="100%" fill="currentColor"/>
                        </button>

                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            onClick={() => {setShowNotes(true)}}
                        >
                            <NotesIcon height="100%" fill="currentColor"/>
                        </button>
                        
                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            style={{color: getSetFollowingUserBtnColor()}}
                            onClick={() => {setFollowingUser(!userOptions.followingUser)}}
                        >
                            <ShowDotCordsIcon height="100%" fill="currentColor"/>
                        </button>
                    </div>
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
        </>
    );
};

export default ViewerSideBar;
