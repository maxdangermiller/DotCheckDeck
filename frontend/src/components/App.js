import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css';
import Viewer from './Viewer';
import Activate from './Activate';
import useToken from './useToken';
import Login from './Login';
import Nav from './Nav';
import Admin from './Admin';

import axios from "axios";


function App() {

	const { token, refToken, setRefToken, removeToken, setToken } = useToken();
	const [ userData, setUserData ] = useState({});
	const [ schoolCode, setSchoolCode ] = useState("");

	useEffect(() => {
		if (token == null) {
			// console.log("Token: " + token);
			// console.log("Ref Token: " + refToken);
			if (refToken != null) {
				axios({
					method: "POST",
					url: "http://127.0.0.1:5000/get-token",
					headers: {
						Authorization: `Bearer ${refToken}`,
					}
				}).then((response) => {
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
			} else { setToken(""); }
		}
	}, [token, refToken]);
	
	const logout = () => {
		axios({
			method: "POST",
			url:"http://127.0.0.1:5000/logout",
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
		if (userData !== undefined && userData["is_admin"] !== undefined) {
			return userData["is_admin"] || userData["is_section_leader"];
		}
		return false;
	}

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
				<Nav token={token} loggedIn={token !== "" && token !== undefined} logout={logout}/>
				<Routes>
					<Route path="/" exact element={
						token === ""
						? <Navigate to="/login" />
						: <Viewer token={token} schoolCode={schoolCode}/>
					} />
					<Route path="/activate" exact element={
						token !== "" && token !== undefined
						? <Navigate to="/" />
						: <Activate setToken={setToken} setRefToken={setRefToken}/>
					} />
					<Route path="/login" exact element={
						token !== "" && token !== undefined
						? <Navigate to="/" />
						: <Login setToken={setToken} setRefToken={setRefToken}/>
					} />
					<Route path="/admin" exact element={
						token !== "" && token !== undefined && !isAdminAuthorized()
						? <Navigate to="/" />
						: <Admin token={token} schoolCode={schoolCode}/>
					} />
					<Route path="*" element={<h1>404, you've been dumb</h1>} />
				</Routes>
			</Router>
		);
	}
}

export default App;
