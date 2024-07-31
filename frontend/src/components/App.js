import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css';
// import Viewer from './Viewer';
import Activate from './Activate';
import useToken from './utils/useToken';
import Login from './Login';
import NavBar from './NavBar';
import Admin from './Admin';
import AdminTimeline from './AdminComponents/TimelinePage/AdminTimeline';
import PWAInstructions from './utils/PWAInstructions';
import getApi from './utils/getApi';
import AdminJoinCodeDisplay from './AdminComponents/AdminJoinCodeDisplay';
import AdminCreateShow from './AdminComponents/AdminCreateShow';
import AdminAddProp from './AdminComponents/AdminAddProp';
import AdminConvertToProp from './AdminComponents/AdminConvertToProp';
// import BasicViewer from './BasicViewer';
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

// import BetaViewer from './BetaMainApp/Viewer';

import logo from '../icons/logo.svg';

import axios from "axios";

import 'bootstrap/dist/css/bootstrap.css';


const WINDOW_LOCATION = getApi();

function App() {

	const { token, refToken, setRefToken, removeToken, setToken } = useToken();
	const [ userData, setUserData ] = useState({});
	const [ showCode, setShowCode ] = useState("");
	const [ showID, setShowID ] = useState(-1);
	const [ isOffline, setIsOffline ] = useState(false);

	const attemptOffline = () => {
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
						// console.log(response.data)
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

		if (userData !== undefined && userData["is_admin"] !== undefined) {
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
	

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const isPWAAdded = window.matchMedia('(display-mode: standalone)').matches;

	if (isMobile && isPWAAdded && isOnHomePage()) {
		window.location.href = "/app"
	}


	// Loading
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
	
	// App Router
	else {
		return (
			<Router>
				{/* Navbar only when not in the app. The main app will overwrite this navbar*/}
				<NavBar 
					token={token} 
					loggedIn={token !== "" && token !== undefined} 
					logout={logout}
					isAdminAuthorized={isAdminAuthorized}
				/>

				{/* Show PWA Instructions if is mobile & the PWA hasn't been added & we're not on the activate page */}
				{
					isMobile && !isPWAAdded && !isOnActivatePage() && !isOnHomePage() ?
					<PWAInstructions />
					: null
				}

				{/* Routes */}
				<Routes>
					{/* WEBSITE PAGES */}

					{/* Home Page */}
					<Route path="/" exact errorElement={<ErrorPage />} element={
						<HomePage />
					} />

					{/* About Page */}
					<Route path="/about" exact errorElement={<ErrorPage />} element={
						<AboutPage/>
					} />


					{/* MAIN APP */}

					{/* Main App > Normal Viewer */}
					<Route path="/app" exact errorElement={<ErrorPage />} element={
						(token === "" && !isOffline) || showCode === ""
						? <Navigate to="/login" />
						: <Viewer token={token} showCode={showCode} userData={userData} showID={showID} isOffline={isOffline} logout={logout}/>
					} />

					{/* Main App > BETA Viewer 
					<Route path="/beta/app" exact errorElement={<ErrorPage />} element={
						(token === "" && !isOffline) || showCode === ""
						? <Navigate to="/login" />
						: <BetaViewer token={token} showCode={showCode} userData={userData} showID={showID} isOffline={isOffline} logout={logout}/>
					} />
					*/}
					{/* Main App > Normal Viewer - Quick Display */}
					<Route path="/viewer-quick-display/:set_numb_param" exact errorElement={<ErrorPage />} element={
						(token === "" && !isOffline) || showCode === ""
						? <Navigate to="/login" />
						: <Viewer token={token} showCode={showCode} userData={userData} showID={showID} isOffline={isOffline} logout={logout}/>
					} />
					
					{/* Main App > Basic Viewer */}
					<Route path="/app/basic" exact errorElement={<ErrorPage />} element={
						(token === "" && !isOffline) || showCode === ""
						? <Navigate to="/login" />
						: <BasicViewer token={token} showCode={showCode} userData={userData} showID={showID} isOffline={isOffline} logout={logout}/>
					} />


					{/* ADMIN PAGE */}

					{/* Admin Page */}
					<Route path="/admin" exact errorElement={<ErrorPage />} element={
						token === "" || token === undefined || !isAdminAuthorized()
						? <Navigate to="/app" />
						: <Admin token={token} schoolCode={showCode}/>
					} />

					{/* Admin > Timeline */}
					<Route path="/admin-timeline" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminTimeline token={token} schoolCode={showCode}/>
					} />

					{/* Admin > show join code */}
					<Route path="/admin-join-code" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminJoinCodeDisplay token={token} schoolCode={showCode}/>
					} />

					{/* Admin > show join code - WITH SPECIFIC SHOW ID */}
					<Route path="/admin-join-code/:show_id" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminJoinCodeDisplay token={token} schoolCode={showCode}/>
					} />

					{/* Admin > create show */}
					<Route path="/admin-create-show" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminCreateShow token={token} schoolCode={showCode}/>
					} />

					{/* Admin >  add prop */}
					<Route path="/admin-add-prop" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminAddProp token={token} schoolCode={showCode}/>
					} />

					{/* Admin > convert to prop */}
					<Route path="/admin-convert-to-prop" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminConvertToProp token={token} schoolCode={showCode}/>
					} />


					{/* AUTH */}

					{/* Auth > Activate Page */}
					<Route path="/activate" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && showCode !== ""
						? <Navigate to="/app" />
						: <Activate setToken={setToken} setRefToken={setRefToken}/>
					} />

					{/* Activate Page with given join code */}
					<Route path="/activate/:join_code" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && showCode !== ""
						? <Navigate to="/app" />
						: <Activate setToken={setToken} setRefToken={setRefToken}/>
					} />

					{/* Auth > Login Page */}
					<Route path="/login" exact errorElement={<ErrorPage />} element={
						token !== "" && token !== undefined && showCode !== ""
						? <Navigate to="/app" />
						: <Login 
							setToken={setToken} 
							setRefToken={setRefToken} 
							setSchoolCode={setShowCode} 
							setUserData={setUserData}
							setShowID={setShowID}
						/>
					} />

					{/* Auth > activate account */}
					<Route path="/activate-account/:enc_id" exact errorElement={<ErrorPage />} element={
						<VerifyAccount/>
					} />

					{/* Auth > forgot password */}
					<Route path="/forgot-password" exact errorElement={<ErrorPage />} element={
						<ForgotPassword/>
					} />
					
					{/* Auth > Resend verify */}
					<Route path="/resent-verify-email" exact errorElement={<ErrorPage />} element={
						<ResendVerifyEmail/>
					} />

					{/* Auth > Forgot Password > Reset Page */}
					<Route path="/forgot-password/:enc_id" exact errorElement={<ErrorPage />} element={
						<ResetPassword/>
					} />

					{/* Auth > Accept Admin Invitation */}
					<Route path="/accept-invitation/:enc_key" exact errorElement={<ErrorPage />} element={
						<AcceptInvitation/>
					} />
					

					{/* ERRORS */}

					{/* Error Page */}
					<Route path="/error" exact element={
						<ErrorPage/>
					} />

					{/* 404 Error Page */}
					<Route path="*" element={<Page404 />} />
				</Routes>
			</Router>
		);
	}
}

export default App;
