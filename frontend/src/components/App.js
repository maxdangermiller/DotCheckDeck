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

// Main App
import Viewer from './MainApp/Viewer';
import BasicViewer from './MainApp/BasicViewer';
import AppNavBar from './MainApp/MainAppNavBar/AppNavBar';

import axios from "axios";

import 'bootstrap/dist/css/bootstrap.css';


const WINDOW_LOCATION = getApi();

function App() {

	const { token, refToken, setRefToken, removeToken, setToken } = useToken();
	const [ userData, setUserData ] = useState({});
	const [ schoolCode, setSchoolCode ] = useState("");
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
			setSchoolCode(localShowCode);
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
							setSchoolCode(response.data.school_code);
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
									window.location.href = "/login";
								}
							}
						}
						else if (error.response) {
							// console.log(error.response)
							// console.log(error.response.status)
							// console.log(error.response.headers)
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
		refreshToken();
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

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const isPWAAdded = window.matchMedia('(display-mode: standalone)').matches;


	if (token == null && !isOffline) {
		return (
			<div className="d-flex align-items-center justify-content-center flex-column fullScreen">
				<div className="spinner-border" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	} 
	
	else {
		return (
			<Router>
				<NavBar 
					token={token} 
					loggedIn={token !== "" && token !== undefined} 
					logout={logout}
					isAdminAuthorized={isAdminAuthorized}
				/>
				{
					isMobile && !isPWAAdded && !isOnActivatePage() ?
					<PWAInstructions />
					: null
				}
				<Routes>
					<Route path="/app" exact element={
						(token === "" && !isOffline) || schoolCode === ""
						? <Navigate to="/login" />
						: <Viewer token={token} showCode={schoolCode} userData={userData} showID={showID} isOffline={isOffline} logout={logout}/>
					} />
					
					<Route path="/app/basic" exact element={
						(token === "" && !isOffline) || schoolCode === ""
						? <Navigate to="/login" />
						: <BasicViewer token={token} showCode={schoolCode} userData={userData} showID={showID} isOffline={isOffline} logout={logout}/>
					} />

					<Route path="/" exact element={
						<Navigate to="/app" />
					} />

					<Route path="/viewer-quick-display/:set_numb_param" exact element={
						(token === "" && !isOffline) || schoolCode === ""
						? <Navigate to="/login" />
						: <Viewer token={token} showCode={schoolCode} userData={userData} showID={showID} isOffline={isOffline}/>
					} />

					<Route path="/activate/:join_code" exact element={
						token !== "" && token !== undefined && schoolCode !== ""
						? <Navigate to="/app" />
						: <Activate setToken={setToken} setRefToken={setRefToken}/>
					} />
					<Route path="/activate" exact element={
						token !== "" && token !== undefined && schoolCode !== ""
						? <Navigate to="/app" />
						: <Activate setToken={setToken} setRefToken={setRefToken}/>
					} />
					<Route path="/login" exact element={
						token !== "" && token !== undefined && schoolCode !== ""
						? <Navigate to="/app" />
						: <Login 
							setToken={setToken} 
							setRefToken={setRefToken} 
							setSchoolCode={setSchoolCode} 
							setUserData={setUserData}
							setShowID={setShowID}
						/>
					} />
					<Route path="/admin" exact element={
						token === "" || token === undefined || !isAdminAuthorized()
						? <Navigate to="/app" />
						: <Admin token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-timeline" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminTimeline token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-join-code" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminJoinCodeDisplay token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-create-show" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminCreateShow token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-add-prop" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminAddProp token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-convert-to-prop" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/app" />
						: <AdminConvertToProp token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/activate-account/:enc_id" exact element={
						<VerifyAccount/>
					} />
					<Route path="/forgot-password" exact element={
						<ForgotPassword/>
					} />
					<Route path="/resent-verify-email" exact element={
						<ResendVerifyEmail/>
					} />
					<Route path="/forgot-password/:enc_id" exact element={
						<ResetPassword/>
					} />
					<Route path="/accept-invitation/:enc_key" exact element={
						<AcceptInvitation/>
					} />
					<Route path="/about" exact element={
						<AboutPage/>
					} />
					
					<Route path="/error" exact element={
						<ErrorPage/>
					} />
					<Route path="*" element={<Page404 />} />
				</Routes>
			</Router>
		);
	}
}

export default App;
