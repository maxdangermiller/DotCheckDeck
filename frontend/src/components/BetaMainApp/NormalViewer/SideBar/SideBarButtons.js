import React, { useState, useEffect } from 'react'

// Settings
import {ReactComponent as SettingsIcon} from '../../../../icons/circle-gear.svg';
// Sets/counts display modes
import {ReactComponent as DisplayModeIconSets} from '../../../../icons/display-mode-icon-s.svg';
import {ReactComponent as DisplayModeIconCounts} from '../../../../icons/display-mode-icon-c.svg';
// Rehearsal Mode
import {ReactComponent as RehearsalModeIcon} from '../../../../icons/hourglass-half.svg';
// Edit
import {ReactComponent as EditSetIcon} from '../../../../icons/pencil.svg';
// Notes
import {ReactComponent as NotesIcon} from '../../../../icons/book.svg';
// Dot Cords (?)
import {ReactComponent as ShowDotCordsIcon} from '../../../../icons/question.svg';


// Enum for Display Mode Button
import { DisplayMode } from '../normal_viewer_utils'


// Color Constants
const NORMAL_BTN_COLOR = "#474747";
const NOT_FOLLOWING_USER_COLOR = "#474747";
const FOLLOWING_USER_COLOR = "#ECA72C";
const NOTES_AVAILABLE_COLOR = "#047d5d";
const REHEARSAL_MODE_COLOR = "#824C71";
const NOT_REHEARSAL_MODE_COLOR = "#4A2545";
const OFFLINE_BTN_COLOR = "#732626";


/**
 * Settings Button
 */
const SettingsButton = (props) => {

    const { setShowSettings } = props;

    return <button 
        type="button" 
        className='customViewerSideBarBtn normalBtn'
        style={{color: NORMAL_BTN_COLOR}}
        onClick={() => {setShowSettings(true);}}
    >
        <SettingsIcon height="100%" fill="currentColor"/>
    </button>;
}


/**
 * Display Mode Button to switch between Sets/Counts modes
 */
const DisplayModeButton = (props) => {
	const { getDisplayMode, setDisplayMode } = props;

	const getIcon = () => {
		if (getDisplayMode() === DisplayMode.SETS_MODE) {
			return <DisplayModeIconSets height="100%"/>;
		}
		return <DisplayModeIconCounts height="100%"/>;
	}

	const cycle = (event) => {
		event.preventDefault()

		if (getDisplayMode() === DisplayMode.SETS_MODE) {
			setDisplayMode(DisplayMode.COUNTS_MODE);
			return;
		}
		setDisplayMode(DisplayMode.SETS_MODE);
		
	}

	return <button 
		type="button" 
		className='customViewerSideBarBtn'
		style={{color: NORMAL_BTN_COLOR}}
		onClick={cycle}
	>
		{ getIcon() }
	</button>;
}


/**
 * Enable Rehearsal Mode Button
 */
const RehearsalModeButton = (props) => {
	
	// TODO: Make functional
	const getRehearsalBtnColor = () => {
        if (true) {
            return NOT_REHEARSAL_MODE_COLOR;
        }
        return REHEARSAL_MODE_COLOR;
    }

	return <button 
		type="button" 
		className='customViewerSideBarBtn normalBtn'
		style={{color: getRehearsalBtnColor()}}
		onClick={() => {}}
		disabled
	>
		<RehearsalModeIcon height="100%" fill="currentColor"/>
	</button>;
}


/**
 * Edit Set Button
 */
const EditSetButton = (props) => {
	const { isOffline, openEditSetName, localDataHandler } = props;

	let userData = true;

	if (isOffline) {
		return <button 
			type="button" 
			className='customViewerSideBarBtn normalBtn'
			style={{color: NORMAL_BTN_COLOR}}
			onClick={() => {openEditSetName()}}
			disabled={!userData.is_section_leader}
		>
			<EditSetIcon height="100%" fill="currentColor"/>
		</button>;
	}

	return <button 
		type="button" 
		className='customViewerSideBarBtn normalBtn'
		style={{color: OFFLINE_BTN_COLOR}}
		onClick={() => {alert("You must be ONLINE to name sets")}}
	>
		<EditSetIcon height="100%" fill={OFFLINE_BTN_COLOR}/>
	</button>;
}



const NotesButton = (props) => {
	const { curSetInfo, setShowNotes } = props;

	const getNotesBtnColor = () => {
		if (curSetInfo === null || curSetInfo === undefined || curSetInfo.notes === null || curSetInfo.notes === "") {
			return NORMAL_BTN_COLOR; 
		}
		return NOTES_AVAILABLE_COLOR;
	}

	return <button 
		type="button" 
		className='customViewerSideBarBtn normalBtn'
		style={{color: getNotesBtnColor()}}
		onClick={() => {setShowNotes(true)}}
	>
		<NotesIcon height="100%" fill="currentColor"/>
	</button>
}


const DotCordsButton = (props) => {
	const { userOptions, setFollowingUser } = props;


	const getSetFollowingUserBtnColor = () => {
		

		if (userOptions.followingUser) {
			return FOLLOWING_USER_COLOR;
		}
		return NOT_FOLLOWING_USER_COLOR; 
	}


	return <button 
		type="button" 
		className='customViewerSideBarBtn normalBtn'
		style={{color: getSetFollowingUserBtnColor()}}
		onClick={() => {setFollowingUser(!userOptions.followingUser)}}
	>
		<ShowDotCordsIcon height="100%" fill="currentColor"/>
	</button>;
}


export { SettingsButton, DisplayModeButton, RehearsalModeButton, EditSetButton, NotesButton, DotCordsButton }