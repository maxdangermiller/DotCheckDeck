import { Stack } from "expo-router";
import { Text, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import React, { useState, useEffect } from 'react'

// Scripts
import getApi from './scripts/getApi';
import useToken from './scripts/useToken';
import localStorage from './scripts/localStorage';

// Packages
import axios from "axios";
import NavBar from "./components/NavBar";


/*
import Activate from './Activate';
import useToken from './utils/useToken';
import Login from './Login';
import NavBar from './NavBar';
import Admin from './Admin';
import AdminTimeline from './AdminComponents/TimelinePage/AdminTimeline';
import PWAInstructions from './utils/PWAInstructions';
import AdminJoinCodeDisplay from './AdminComponents/AdminJoinCodeDisplay';
import AdminCreateShow from './AdminComponents/AdminCreateShow';
import AdminAddProp from './AdminComponents/AdminAddProp';
import AdminConvertToProp from './AdminComponents/AdminConvertToProp';
import VerifyAccount from './utils/VerifyAccount';
import ResetPassword from './utils/ResetPassword';
import ForgotPassword from './utils/ForgotPassword';
import AcceptInvitation from './utils/AcceptInvitation';
import AboutPage from './AboutPage';
import Page404 from './utils/Page404';
import ErrorPage from './utils/ErrorPage';
import ResendVerifyEmail from './utils/ResendVerifyEmail'

import HomePage from './HomePage';

// Main App
import Viewer from './MainApp/Viewer';
import BasicViewer from './MainApp/BasicViewer';

import BetaViewer from './BetaMainApp/BetaViewer';

import logo from '../icons/logo.svg';

import axios from "axios";

import 'bootstrap/dist/css/bootstrap.css';
*/


const WINDOW_LOCATION = getApi();

function App() {

	const { token, refToken, setRefToken, removeToken, setToken } = useToken();
	const [ userData, setUserData ] = useState({});
	const [ showCode, setShowCode ] = useState("");
	const [ showID, setShowID ] = useState(-1);
	const [ isOffline, setIsOffline ] = useState(false);
	
	
	const attemptOffline = () => {
		/*
		TODO: MAKE ASYNC STORAGE WORK
		try {
			const localUserData = JSON.parse(localStorage.getItem("app-user-data"));
			const localShowCode = localStorage.getItem("app-show-code");
			const localShowID = localStorage.getItem("app-show-id");

			if (localUserData === null || localShowCode === null || localShowID === null) {
				return false;
			}
			
			setUserData(localUserData);
			setShowCode(localShowCode);
			setShowID(localShowID);
			return true;

		} catch (error) {
			return false
		}
		*/
		return false; // For now, we just return false to not allow offline mode
	}

	const refreshToken = () => {
		if (token == null) {
			// console.log("Token: " + token);
			// console.log("Ref Token: " + refToken);
			if (refToken != null) {
				try {

					axios({
						method: "POST",
						url: WINDOW_LOCATION + "/get-token",
						headers: {
							Authorization: `Bearer ${refToken}`,
						},
						timeout: 5000
					}).then((response) => {
						console.log(response.data)
						if (response.status === 202) {
							setToken(response.data.access_token);
							setUserData(response.data.user);
							setShowCode(response.data.school_code);
							setShowID(response.data.show_id)

							localStorage.setItem("app-user-data", JSON.stringify(response.data.user))
							localStorage.setItem("app-show-code", response.data.school_code)
							localStorage.setItem("app-show-id", response.data.show_id)
						}
	
					}).catch((error) => {
						console.log(error)
						if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
							console.log('Request timed out');
							if (attemptOffline()) {
								setIsOffline(true);
							} else {
								if (window.location.pathname !== "/login") {
									setIsOffline(false);
									window.location.href = "/error?message=No internet connection detected. \r\nYou must connect to the internet at least temporally&return=/login";
								}
								else {
									window.location.href = "/error?message=No internet connection detected. \r\nYou can't login without internet access!&return=/login";
								}
							}
						}
						else if (error.response) {
							// console.log(error.response)
							// console.log(error.response.status)
							// console.log(error.response.headers)
							window.location.href = "/error?message=Something Went Wrong. \r\nIt's probably your fault somehow though... Talk To Max Miller if problems persist&return=/login";
							removeToken();
						}
					})
				} catch (error) {
					alert("We encountered an error! Please try again!")
				}
			} else { setToken(""); }
		}
	}

	useEffect(() => {
		if (window.location.pathname !== "/error") {
			refreshToken();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, refToken]);
	
	const logout = () => {
		axios({
			method: "POST",
			url: WINDOW_LOCATION + "/logout",
		}).then((response) => {
			removeToken();
			window.localStorage.clear();
			window.location.href = "/login"
		}).catch((error) => {
			if (error.response) {
				console.log(error.response);
				console.log(error.response.status);
				console.log(error.response.headers);
			}
		});
	}

	const isAdminAuthorized = () => {
		if (token === "" || token === undefined || isOffline) {
			return false;
		}

		if (userData !== undefined && "is_admin" in userData) {
			return userData["is_admin"];
		}
		return false;
	}

	const isOnActivatePage = () => {
		let path = window.location.pathname;
		if (path.length < 9) { return false; }

		if (path.substring(0, 9) === "/activate") { return true; }
		if (path.substring(0, 18) === "/accept-invitation") { return true; }

		return false;
	}
	
	const isOnHomePage = () => {
		let path = window.location.pathname;

		if (path.length === 1 || path.length === 0) { return true; }

		return false;
	}
	

	// const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	// const isPWAAdded = window.matchMedia('(display-mode: standalone)').matches;

	// if (isMobile && isPWAAdded && isOnHomePage()) {
	//	window.location.href = "/app"
	// }


	// Loading
	/*
	TODO: Implement Loading Screen in Viewer instead of here
	if (token == null && !isOffline && window.location.pathname !== "/error" && !isOnHomePage()) {
		return (
			<div className="d-flex align-items-center justify-content-center flex-column fullScreen" style={{backgroundColor: "#212429"}}>
				<div className="d-flex align-items-center justify-content-center flex-column" style={{width: "100%"}}>
					<img src={logo} alt="" width="200px" height="200px" />
					<div className="loader"></div>
				</div>
			</div>
		);
	} 
		*/
	
	// New App Router
	return (
    <Stack screenOptions={{ animation: "none" }}>
			{/* WEBSITE PAGES */}
			
			{/* Home Page */}
			<Stack.Screen 
				name="index" 
				options={defaultScreenOptions} 
			/>

			{/* About Page */}
			<Stack.Screen 
				name="components/about" 
				options={defaultScreenOptions} 
			/>


			{/* MAIN APP */}
			{/* Main App > Viewer */}
      <Stack.Screen 
				name="components/viewer" 
				options={defaultScreenOptions} 
			/>



			{/* ADMIN PAGE */}


			{/* Admin Page */}


			{/* Admin > Timeline */}


			{/* Admin > show join code */}

			{/* Admin > show join code - WITH SPECIFIC SHOW ID */}

			{/* Admin > create show */}

			{/* Admin >  add prop */}

			{/* Admin > convert to prop */}


			{/* AUTH */}

			{/* Auth > Activate Page */}
			<Stack.Screen 
				name="components/auth/activate" 
				options={defaultScreenOptions} 
			/>

			{/* Activate Page with given join code */}

			{/* Auth > Login Page */}
			<Stack.Screen 
				name="components/auth/login" 
				options={defaultScreenOptions} 
			/>

			{/* Auth > activate account */}

			{/* Auth > forgot password */}
			
			{/* Auth > Resend verify */}

			{/* Auth > Forgot Password > Reset Page */}

			{/* Auth > Accept Admin Invitation */}
			

			{/* ERRORS */}

			{/* Error Page */}

			{/* 404 Error Page */}
    </Stack>
  );
}

const defaultScreenOptions = {
	title: 'Home', 
	headerShown:false,
	headerBackButtonMenuEnabled: false,
	headerBackVisible: false
}

export default App;
