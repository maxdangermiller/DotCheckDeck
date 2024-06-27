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


const NORMAL_BTN_COLOR = "#474747";
const NOT_FOLLOWING_USER_COLOR = "#474747";
const FOLLOWING_USER_COLOR = "#ECA72C";
const NOTES_AVAILABLE_COLOR = "#047d5d";
const REHEARSAL_MODE_COLOR = "#824C71";
const NOT_REHEARSAL_MODE_COLOR = "#4A2545";


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

    /**
     * Open Edit Set Name Model
     */
    const openEditSetName = () => {
        setShowEditSetName(true);
        setTempCurSetInfo(JSON.parse(JSON.stringify(curSetInfo)));
    }

    /**
     * Set Following User Var
     * @param {boolean} value 
     */
    const setFollowingUser = (value) => {
		console.log("Setting Following User To: " + value);
		setUserOptions({...userOptions, "followingUser": value});
	}

    /**
     * Set display mode
     * @param {int} cur_value 0 or 1
     */
    const setDisplayMode = (cur_value) => {
        if (cur_value === 0) {
            setUserOptions({...userOptions, "displayMode": 1});
        }
        else {
            setUserOptions({...userOptions, "displayMode": 0});
        }
    }


	const getSetFollowingUserBtnColor = () => {
		if (userOptions.followingUser) {
			return FOLLOWING_USER_COLOR;
		}
		return NOT_FOLLOWING_USER_COLOR; 
	}

	const getNotesBtnDisabled = () => {
		if (curSetInfo === null || curSetInfo === undefined || curSetInfo.notes === null || curSetInfo.notes === "") {
			return true;
		}
		return false; 
	}

	const getNotesBtnColor = () => {
		if (!getNotesBtnDisabled()) {
			return NOTES_AVAILABLE_COLOR;
		}
		return NORMAL_BTN_COLOR; 
	}

    const getRehearsalBtnColor = () => {
        if (true) {
            return NOT_REHEARSAL_MODE_COLOR;
        }
        return REHEARSAL_MODE_COLOR;
    }

    /**
     * Get Display Mode
     * @returns {boolean} 0 if were in sets display mode, 1 if we're in counts display mode
     */
    const getDisplayMode = () => {
        if (userOptions["displayMode"] === 0) {
            return 0;
        }
        if (userOptions["displayMode"] === 1) {
            return 1;
        }
        // If it gets to here it must be either undefined or invalid
        return 0;
    }

    /**
     * Get Set Name
     * @returns {string} set name
     */
    const getSetName = () => {
        if (data.length > curSet && curSetInfo !== undefined && curSetInfo !== null && curSetInfo["set_name"] !== null) {
            return curSetInfo["set_name"];
        }

        return "";
    }
    
    // Change Set Numb
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
                    <h1 className='viewerSideBarNameField'>{getSetName()}</h1>
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
                    userOptions={userOptions}
                />

                <div className='optionsDiv'>
                    <div className='optionsDivRow'>
                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            style={{color: NORMAL_BTN_COLOR}}
                            onClick={() => {setShowSettings(true);}}
                        >
                            <SettingsIcon height="100%" fill="currentColor"/>
                        </button>

                        <button 
                            type="button" 
                            className='customViewerSideBarBtn'
                            style={{color: NORMAL_BTN_COLOR}}
                            onClick={() => setDisplayMode(getDisplayMode())}
                        >
                            {
                                getDisplayMode() === 0 ?
                                <DisplayModeIconSets height="100%"/>
                                : <DisplayModeIconCounts height="100%"/>
                            }
                        </button>

                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            style={{color: getRehearsalBtnColor()}}
                            onClick={() => {}}
                        >
                            <RehearsalModeIcon height="100%" fill="currentColor"/>
                        </button>
                    </div>

                    <div className='optionsDivRow'>
                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            style={{color: NORMAL_BTN_COLOR}}
                            onClick={() => {setShowEditSetName(true)}}
                            disabled={!userData.is_section_leader}
                        >
                            <EditSetIcon height="100%" fill="currentColor"/>
                        </button>

                        <button 
                            type="button" 
                            className='customViewerSideBarBtn normalBtn'
                            style={{color: getNotesBtnColor()}}
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
