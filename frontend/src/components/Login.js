import React, { useRef, useEffect, useState} from 'react';
import { TextField } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";
import './Login.css'
import getApi from './getApi';

import 'bootstrap/dist/css/bootstrap.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const WINDOW_LOCATION = getApi();

const Login = (props) => {

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showAlert, setShowAlert] = useState(false);
	const [alertText, setAlertText] = useState("");


	const btnClick = (e) => {
		if (email === "" || password === "") { return; }
		console.log(WINDOW_LOCATION + "/token")
		try {

			axios({
				method: "POST",
				url: WINDOW_LOCATION + "/token",
				data:{
					email: email,
					password: password
				}
			}).then((response) => {
				setShowAlert(false);
				// console.log(response.data)
				props.setToken(response.data.access_token);
				props.setRefToken(response.data.refresh_token);
				props.setSchoolCode(response.data.school_code);
				props.setUserData(response.data.user);
				props.setShowID(response.data.show_id);
				// window.location.href = "/editor";
			}).catch((error) => {
				if (error.response) {
					console.log(error.response)
					console.log(error.response.status)
					console.log(error.response.headers)
					setShowAlert(true);

					try {
						if (error.response.data !== undefined) {
							if (error.response.data.msg !== undefined) {
								setAlertText(error.response.data.msg);
							} else {
								setAlertText(error.response.data);
							}
						}
					} catch (error) {
						
					}
				}
			})
		} catch (error) {
			alert("We encountered an error... please try again")
			setShowAlert(true);
			setAlertText(error.response);
		} 

		// setEmail("");
		// setPassword("");

		e.preventDefault()
	}

	return(
		<ThemeProvider theme={darkTheme}><section className="gradient-custom">
			<div className="container">
				<div className="row d-flex justify-content-center align-items-center loginHeight">
					<div className="col-12 col-md-8 col-lg-6 col-xl-5 loginFormHeight">
						<div className="card bg-dark text-white loginFormHeight" style={{borderRadius: '1rem'}}>
							<div className="card-body p-5 text-center loginFormTextHeight">
								<div className="mb-md-5 mt-md-4">

									<h2 className="fw-bold mb-2 text-uppercase">Login</h2>
									<p className="text-white-50 mb-5">Please enter your login and password!</p>

									<TextField
										className="mb-3 customInput"
										value={email}
										onChange={e => setEmail(e.target.value)}
										label="Email"
										variant="outlined"
									/>
									<TextField
										className="mb-3 customInput"
										value={password}
										onChange={e => setPassword(e.target.value)}
										label="Password"
										type="password"
									/>

									<button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => btnClick(e)}>Login</button>

								</div>

								<div>
									<p className="mb-0">Don't have an account? <a href="/activate" className="text-white-50 fw-bold">Activate New Account</a></p>
									<p className="mb-0">Forgot your password? <a href="/forgot-password" className="text-white-50 fw-bold">Forgot Password</a></p>
									<p className="mb-0">Need to verify your account? <a href="/resent-verify-email" className="text-white-50 fw-bold">Resend Email</a></p>
								</div>

							</div>
						</div>
					</div>
				</div>
			</div>
			{
				showAlert ?
				<div className="alert alert-danger alert-dismissible customAlert" role="alert">
					<div>
						<strong>Something went wrong! We guess it's possible that we did something wrong, but it's probably on you.</strong> 
					</div>
					{alertText}
					<button className="btn-close" onClick={(e) => setShowAlert(false)}></button>
				</div>
				: null
			}
		</section></ThemeProvider>
	);
}

// <p className="small mb-5 pb-lg-2"><a className="text-white-50" href="#">Forgot
// 										password?</a></p>

export default Login