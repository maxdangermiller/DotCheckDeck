import React, { useRef, useEffect, useState} from 'react';
import { TextField } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";
import './Login.css'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Login = (props) => {

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const btnClick = (e) => {
        /*
		axios({
			method: "POST",
			url:"/token",
			data:{
				email: email,
				password: password
			}
		}).then((response) => {
			// console.log(response.data)
			props.setToken(response.data.access_token);
			props.setRefToken(response.data.refresh_token);
			// window.location.href = "/editor";
		}).catch((error) => {
			if (error.response) {
				console.log(error.response)
				console.log(error.response.status)
				console.log(error.response.headers)
			}
		})
        */

		// setEmail("");
		// setPassword("");

		e.preventDefault()
	}

	return(
		<ThemeProvider theme={darkTheme}><section className="gradient-custom">
			<div className="container py-5 h-100">
				<div className="row d-flex justify-content-center align-items-center h-100">
					<div className="col-12 col-md-8 col-lg-6 col-xl-5">
						<div className="card bg-dark text-white" style={{borderRadius: '1rem'}}>
							<div className="card-body p-5 text-center">
								<div className="mb-md-5 mt-md-4 pb-5">

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
									<p className="mb-0">Don't have an account? <a href="join" className="text-white-50 fw-bold">Sign Up</a></p>
								</div>

							</div>
						</div>
					</div>
				</div>
			</div>
		</section></ThemeProvider>
	);
}

// <p className="small mb-5 pb-lg-2"><a className="text-white-50" href="#">Forgot
// 										password?</a></p>

export default Login