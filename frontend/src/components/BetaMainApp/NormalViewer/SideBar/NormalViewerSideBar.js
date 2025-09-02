import React, { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap';
import SetInput from './setInput';

import './NormalViewerSideBar.css';

import ShowController from './ShowController';
/*
import OptionsModal from './ViewerSideBarComponents/OptionsModal';
import SetNameModel from './ViewerSideBarComponents/SetNameModel';
import NotesModel from './ViewerSideBarComponents/NotesModel';
import AdminNotesModel from './ViewerSideBarComponents/AdminNotesModel';
import AudioPlayer from './ViewerSideBarComponents/AudioPlayer';

*/

import { SettingsButton, DisplayModeButton, RehearsalModeButton, EditSetButton, NotesButton, DotCordsButton } from './SideBarButtons';
import { DisplayMode } from '../normal_viewer_utils'

import 'bootstrap/dist/css/bootstrap.css';


const NormalViewerSideBar = (props) => {
    const { 
        curSetState, 
        setInputRef,

        getCurSet, 
        getCurSetNumb,
        setCurSet,
        setCurSetNumb, 
        defaultAnimateSet,

        getSetName,

        audio,
        audioPlaying,
        setAudioPlaying,

        curShowTimestamp,
        audioTimestampUpdate,
        isAnimating,


        localDataHandler,
        userOptionsHandler,
        
        sets
    } = props;

    const [animateTarget, setAnimateTarget] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [showEditSetName, setShowEditSetName] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [tempCurSetInfo, setTempCurSetInfo] = useState({});
    
    // Expose user options for various child components
    const { setUserOptions, userOptions } = userOptionsHandler;


    const handelSetBtnControls = (modifier) => {
        let target = 0;
        if (!isAnimating()) {
            target = getCurSet() + modifier;
        } else {
            target = animateTarget + modifier;
        }
        setAnimateTarget(target);

        console.log("handelSetBtnControls called with modifier:", modifier, ". Targeting: ", animateTarget);
        defaultAnimateSet(target);
    }

    const getDisplayMode = () => {
        return userOptions.displayMode;
    }

    const setDisplayMode = (mode) => {
        setUserOptions({...userOptions,  "displayMode": mode});
    }


    return (
        <>
            <div className="sideBarClass">
                <div className='setInfoDisplay'>
                    <SetInput 
                        setInputRef={setInputRef} 
                        setCurSetNumb={setCurSetNumb} 
                        curSetState={curSetState} 
                        getCurSetNumb={getCurSetNumb}
                    />

                    <h1 className='viewerSideBarNameField'>{getSetName()}</h1>
                </div>

                <ShowController 
                    curShowTimestamp={curShowTimestamp}
                    audioTimestampUpdate={audioTimestampUpdate}
                    audio={audio}
                    audioPlaying={audioPlaying}
                    setAudioPlaying={setAudioPlaying}
                    handelSetBtnControls={handelSetBtnControls}
                    sets={sets}
                    curSetState={curSetState}
                    userOptionsHandler={userOptionsHandler}
                />

                <div className='optionsDiv'>
                    <div className='optionsDivRow'>
                        <SettingsButton setShowSettings={setShowSettings}/>
                        <DisplayModeButton getDisplayMode={getDisplayMode} setDisplayMode={setDisplayMode} />
                        <RehearsalModeButton />
                    </div>

                    <div className='optionsDivRow'>
                        <EditSetButton isOffline={false} openEditSetName={() => {}} localDataHandler={localDataHandler} />
                        <NotesButton curSetInfo={{}} setShowNotes={() => {}} />
                        <DotCordsButton userOptions={userOptions} setFollowingUser={() => {}} />
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
                curSetState={curSetState}
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