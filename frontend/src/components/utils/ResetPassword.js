import React, { useState, useEffect, useRef } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import { TextField, Icon } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from "axios";
import getApi from './getApi';

const WINDOW_LOCATION = getApi();

const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
});


const ResetPassword = (props) => {
    let params = useParams();

    const [isDone, setIsDone] = useState(false);
    const [pwd1, setPwd1] = useState("");
    const [pwd2, setPwd2] = useState("");

    const [showAlert, setShowAlert] = useState(false);
	const [alertText, setAlertText] = useState("");

    const [passwordErrors, setPasswordErrors] = useState({
		'letter': true,
		'capital': true,
		'number': true,
		'length': true,
		'any': false
	});

    const setPwd = (value) => {
        let errors = {
			'letter': false,
			'capital': false,
			'number': false,
			'length': false,
			'any': false
		};
		 // Validate lowercase letters
		let lowerCaseLetters = /[a-z]/g;
		errors.letter = !value.match(lowerCaseLetters);

		// Validate capital letters
		let upperCaseLetters = /[A-Z]/g;
		errors.capital = !value.match(upperCaseLetters);

		// Validate numbers
		let numbers = /[0-9]/g;
		errors.number = !value.match(numbers);

		// Validate length
		errors.length = value.length < 8;

		if (!(errors.letter || errors.capital || errors.number || errors.length)) {
			errors.any = false;
		} else {
            errors.any = true;
        }

        setPasswordErrors(errors);
        setPwd1(value)
    }

    const resetPasswordRequest = () => {
        if (passwordErrors.any) {return;}
        axios({
            method: 'POST',
            url: WINDOW_LOCATION + '/reset-password',
            data: {
                password: pwd1,
                encrypted_id: params["enc_id"]
            },
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        }).then((response) => {
            setShowAlert(false);
            console.log(response.data)
            window.location.href = "/login"
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
        });
    }


    useState(() => {
        try {
            fetch(WINDOW_LOCATION + '/reset-password-auth/' + params["enc_id"], {
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                    }
            })
            .then((response) => {
                if (response.status === 200) {
                    console.log(response);
                    setIsDone(true);
                }
                else {
                    setShowAlert(true);
                    setAlertText("Invalid reset password key!");
                }
            })
            .catch((error) => {
                setShowAlert(true);
                setAlertText("Invalid reset password key!");
            });
        } catch (error) {
            setShowAlert(true);
            setAlertText("Invalid reset password key!");
        }
    }, []);

    return (
        <ThemeProvider theme={darkTheme}><section className="gradient-custom">
			<div className="container py-5 h-100" style={{width: "100%"}}>
				<div className="row d-flex justify-content-center align-items-center h-100" style={{width: "100%"}}>
					<div className="col-14 col-md-10 col-lg-8 col-xl-6">
						<div className="card bg-dark text-white" style={{borderRadius: '1rem', height: "80vh"}}>
							<div className="card-body p-5 text-center h-100">
                                <h2 className="fw-bold mb-2 text-uppercase">Activate</h2>
								<p className="text-white-50 mb-5">Activate an account with a school!</p>
								<div className="mt-md-4 pb-5 customCardBody">
                                    <div className="d-flex flex-column justify-content-start align-items-center h-100">

                                        {
                                            isDone ?
                                                <>
                                                    <TextField
                                                        className="mb-3 customInput"
                                                        value={pwd1}
                                                        onChange={e => setPwd(e.target.value)}
                                                        label="Password"
                                                        variant="outlined"
                                                        style={{width: "100%"}}
                                                        type="password"
                                                        id="password"

                                                        error={passwordErrors.any}
                                                    />

                                                    <TextField
                                                        className="mb-3 customInput"
                                                        value={pwd2}
                                                        onChange={e => setPwd2(e.target.value)}
                                                        label="Confirm Password"
                                                        variant="outlined"
                                                        style={{width: "100%"}}
                                                        type="password"
                                                        id="confirm-password"

                                                        error={passwordErrors.any || pwd1 !== pwd2}
                                                    />

                                                    <div className="d-flex justify-content-center align-items-start flex-column">
                                                    {
                                                        pwd1 === pwd2
                                                            ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> Passwords Match</p>
                                                            : <p className="mb-1"><Icon component={CancelIcon} color="error"/> Passwords Don't Match</p>
                                                    }
                                                    {
                                                        !passwordErrors.letter
                                                            ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> A lowercase letter</p>
                                                            : <p className="mb-1"><Icon component={CancelIcon} color="error"/> A lowercase letter</p>
                                                    }
                                                    {
                                                        !passwordErrors.capital
                                                            ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> A capital (uppercase) letter</p>
                                                            : <p className="mb-1"><Icon component={CancelIcon} color="error"/> A capital (uppercase) letter</p>
                                                    }
                                                    {
                                                        !passwordErrors.number
                                                            ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> A number</p>
                                                            : <p className="mb-1"><Icon component={CancelIcon} color="error"/> A number</p>
                                                    }
                                                    {
                                                        !passwordErrors.length
                                                            ? <p className="mb-4"><Icon component={CheckCircleIcon} color="success"/> Minimum 8 characters</p>
                                                            : <p className="mb-4"><Icon component={CancelIcon} color="error"/> Minimum 8 characters</p>
                                                    }
                                                    </div>
                                                </>
                                            : <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        }
                                    </div>

								</div>
                                <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => resetPasswordRequest()}>Reset</button>
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

export default ResetPassword;