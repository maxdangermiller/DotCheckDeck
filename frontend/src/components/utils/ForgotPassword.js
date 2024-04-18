import React, { useRef, useEffect, useState} from 'react';
import { TextField } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";
import getApi from './getApi';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const WINDOW_LOCATION = getApi();

const ForgotPassword = (props) => {

	const [email, setEmail] = useState("");
	const [showAlert, setShowAlert] = useState(false);
	const [alertText, setAlertText] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);


	const btnClick = (e) => {
        if (email === "") { return; }
		try {
            fetch(WINDOW_LOCATION + '/send-reset-password-email?email=' + email, {
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                    }
            })
            .then((response) => {
                if (response.status === 200) {
                    console.log(response);
                    setShowSuccess(true);
                    setShowAlert(false);
                }
                else {
                    setShowSuccess(false);
                    setShowAlert(true);
                    setAlertText("Invalid reset password key!");
                }
            })
            .catch((error) => {
                setShowSuccess(false);
                setShowAlert(true);
                setAlertText("Invalid reset password key!");
            });
        } catch (error) {
            setShowSuccess(false);
            setShowAlert(true);
            setAlertText("Invalid reset password key!");
        }

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

									<h2 className="fw-bold mb-2 text-uppercase">Forgot Password</h2>
									<p className="text-white-50 mb-5">Please enter your email!</p>

									<TextField
										className="mb-3 customInput"
										value={email}
										onChange={e => setEmail(e.target.value)}
										label="Email"
										variant="outlined"
									/>

									<button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => btnClick(e)}>Send Reset Link</button>

								</div>

								<div>
									<p className="mb-0">Didn't mean to get here? <a href="/login" className="text-white-50 fw-bold">Login</a></p>
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
			{
				showSuccess ?
				<div className="alert alert-primary alert-dismissible customAlert" role="alert">
					<div>
						<strong>If that account exists, an email has been sent to it that will allow you to reset your password</strong> 
					</div>
					<button className="btn-close" onClick={(e) => setShowSuccess(false)}></button>
				</div>
				: null
			}
		</section></ThemeProvider>
	);
}

// <p className="small mb-5 pb-lg-2"><a className="text-white-50" href="#">Forgot
// 										password?</a></p>

export default ForgotPassword