import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css';
import Viewer from './Viewer';
import Activate from './Activate';
import useToken from './useToken';
import Login from './Login';
import NavBar from './NavBar';
import Admin from './Admin';
import AdminTimeline from './AdminComponents/TimelinePage/AdminTimeline';
import PWAInstructions from './PWAInstructions';
import getApi from './getApi';
import AdminJoinCodeDisplay from './AdminComponents/AdminJoinCodeDisplay';
import AdminCreateShow from './AdminComponents/AdminCreateShow';
import BasicViewer from './BasicViewer';
import VerifyAccount from './utils/VerifyAccount';
import ResetPassword from './utils/ResetPassword';
import ForgotPassword from './utils/ForgotPassword';
import AcceptInvitation from './utils/AcceptInvitation';

import axios from "axios";


const WINDOW_LOCATION = getApi();

function App() {

	const { token, refToken, setRefToken, removeToken, setToken } = useToken();
	const [ userData, setUserData ] = useState({});
	const [ schoolCode, setSchoolCode ] = useState("");
	const [ isBasic, setIsBasic ] = useState(false);

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
						}
					}).then((response) => {
						console.log(response.data)
						if (response.status === 202) {
							setToken(response.data.access_token);
							setUserData(response.data.user);
							setSchoolCode(response.data.school_code);
						}
	
					}).catch((error) => {
						if (error.response) {
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
	}, [token, refToken]);
	
	const logout = () => {
		axios({
			method: "POST",
			url: WINDOW_LOCATION + "/logout",
		}).then((response) => {
			removeToken();
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
		if (token === "" || token === undefined) {
			return false;
		}

		if (userData !== undefined && userData["is_admin"] !== undefined) {
			return userData["is_admin"];
		}
		return false;
	}

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const isPWAAdded = window.matchMedia('(display-mode: standalone)').matches;

	if (token == null) {
		return (
			<div className="d-flex align-items-center justify-content-center flex-column fullScreen">
				<div className="spinner-border" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	} else {
		return (
			<Router>
				<NavBar 
					token={token} 
					loggedIn={token !== "" && token !== undefined} 
					logout={logout}
					isAdminAuthorized={isAdminAuthorized}
					isBasic={isBasic}
					setIsBasic={setIsBasic}
				/>
				{
					isMobile && !isPWAAdded ?
					<PWAInstructions />
					: null
				}
				<Routes>
					<Route path="/" exact element={
						token === "" || schoolCode === ""
						? <Navigate to="/login" />
						: isBasic
							? <BasicViewer token={token} schoolCode={schoolCode} />
							: <Viewer token={token} schoolCode={schoolCode} userData={userData}/>
					} />
					<Route path="/activate/:join_code" exact element={
						token !== "" && token !== undefined && schoolCode !== ""
						? <Navigate to="/" />
						: <Activate setToken={setToken} setRefToken={setRefToken}/>
					} />
					<Route path="/activate" exact element={
						token !== "" && token !== undefined && schoolCode !== ""
						? <Navigate to="/" />
						: <Activate setToken={setToken} setRefToken={setRefToken}/>
					} />
					<Route path="/login" exact element={
						token !== "" && token !== undefined && schoolCode !== ""
						? <Navigate to="/" />
						: <Login 
							setToken={setToken} 
							setRefToken={setRefToken} 
							setSchoolCode={setSchoolCode} 
							setUserData={setUserData}
						/>
					} />
					<Route path="/admin" exact element={
						token === "" || token === undefined || !isAdminAuthorized()
						? <Navigate to="/" />
						: <Admin token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-timeline" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/" />
						: <AdminTimeline token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-join-code" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/" />
						: <AdminJoinCodeDisplay token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/admin-create-show" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/" />
						: <AdminCreateShow token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/activate-account/:enc_id" exact element={
						<VerifyAccount/>
					} />
					<Route path="/forgot-password" exact element={
						<ForgotPassword/>
					} />
					<Route path="/forgot-password/:enc_id" exact element={
						<ResetPassword/>
					} />
					<Route path="/accept-invitation/:enc_key" exact element={
						<AcceptInvitation/>
					} />
					

					<Route path="*" element={<h1>404, you've been dumb</h1>} />
				</Routes>
			</Router>
		);
	}
}

export default App;
