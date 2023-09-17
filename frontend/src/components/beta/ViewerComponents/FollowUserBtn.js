import React from 'react';
import {ReactComponent as FindUserButton} from '../../../circle-question.svg';

const FollowUserBtn = (props) => {
    const {userOptions, setUserOptions} = props;

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

    return (
        <button 
            type="button" 
            className='followUserBtn'
            style={{color: getSetFollowingUserBtnColor()}}
            onClick={() => setFollowingUser(!userOptions.followingUser)}
        ><FindUserButton height="100%" fill="currentColor"/></button>
    );
}

export default FollowUserBtn;