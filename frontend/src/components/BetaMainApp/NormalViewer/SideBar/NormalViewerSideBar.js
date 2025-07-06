import React, { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap';

import './NormalViewerSideBar.css';
/*
import OptionsModal from './ViewerSideBarComponents/OptionsModal';
import SetNameModel from './ViewerSideBarComponents/SetNameModel';
import NotesModel from './ViewerSideBarComponents/NotesModel';
import AdminNotesModel from './ViewerSideBarComponents/AdminNotesModel';
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
*/

import 'bootstrap/dist/css/bootstrap.css';


const NORMAL_BTN_COLOR = "#474747";
const NOT_FOLLOWING_USER_COLOR = "#474747";
const FOLLOWING_USER_COLOR = "#ECA72C";
const NOTES_AVAILABLE_COLOR = "#047d5d";
const REHEARSAL_MODE_COLOR = "#824C71";
const NOT_REHEARSAL_MODE_COLOR = "#4A2545";


const NormalViewerSideBar = (props) => {
    const { 
        curSet, setInputRef, setCurSetNumb, changeCurSetNumb, getSetName
    } = props;

   

    return (
        <>
            <div className="sideBarClass">
                <div className='setInfoDisplay'>
                    <input 
                        ref={setInputRef} 
                        value={curSet} 
                        className="setNumberInput" 
                        onChange={(e) => setCurSetNumb(e.target.value)} 
                        onKeyDown={(e) => changeCurSetNumb(e)}>
                    </input>
                    <h1 className='viewerSideBarNameField'>{getSetName()}</h1>
                </div>
                {/*
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
                */}

                <button onClick={() => changeCurSetNumb(curSet+1)}> Next</button>

                <div className='optionsDiv'>
                    <div className='optionsDivRow'>

                    </div>

                    <div className='optionsDivRow'>

                    </div>
                </div>
            </div>

            {/*
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
                updateSpecificSetName={updateSpecificSetName}
            />

            {
                isAdminAuthorized ?
                <AdminNotesModel 
                    show = {showNotes}
                    setShow = {setShowNotes}
                    curSetInfo = {curSetInfo}
                    isAdminAuthorized = {isAdminAuthorized}
                    token = {token}
                />
                :
                <NotesModel 
                    show = {showNotes}
                    setShow = {setShowNotes}
                    curSetInfo = {curSetInfo}
                />
            }
            */}
        </>
    );
};

export default NormalViewerSideBar;