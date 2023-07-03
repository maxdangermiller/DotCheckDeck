import React, { useState} from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './Activate.css'
import axios from "axios";

import SchoolCodePage from './ActivateFormPages/SchoolCodePage';
import SelectLabelPage from './ActivateFormPages/SelectLabelPage';
import RegisterPage from './ActivateFormPages/RegisterPage';
import TermsPage from './ActivateFormPages/TermsPage';
import LoginPage from './ActivateFormPages/LoginPage';
import WaitForVerify from './ActivateFormPages/WaitForVerify';
import getApi from './getApi';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Join Code:  S0EN7K9V

const WINDOW_LOCATION = getApi();

const Activate = (props) => {

    const [curPage, setCurPage] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
    const [schoolCode, setSchoolCode] = useState("");
    const [schoolInfo, setSchoolInfo] = useState("");
    const [userData, setUserData] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        "first_name": "", "last_name": "",
        "email": "", "password": "", "password_confirm": "",
        "errors": {
            "first_name_error": false,
            "last_name_error": false,
            "email_error": false,
            "email_exists_error": false,
            "password_errors": {
                'letter': true,
                'capital': true,
                'number': true,
                'length': true,
                'any': false
            }
        }
    });
    const [loginData, setLoginData] = useState({email: "", password: ""})
    const [isUserVerified, setIsUserVerified] = useState(false);

    const [showAlert, setShowAlert] = useState(false);
	const [alertText, setAlertText] = useState("");

    /*
    0: Code
    1: Are you sure?
    2: Label
    3: Terms Page
    4: Add to existing user or create new user NEW
    
    Existing user:
    5: Login NEW

    New User:
    6: Register Page
    7: Check if verified NEW

    8: Done NEW
    */

    const activateUser = (label, email, password, firstName, lastName) => {
        axios({
            method: 'POST',
            url: WINDOW_LOCATION + '/users/activate',
            data: {
                school_code: schoolCode,
                label: label,
                email: email, 
                password: password, 
                first_name: firstName, 
                last_name: lastName
            },
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        }).then((response) => {
            setShowAlert(false);
            console.log(response.data)
            setCurPage(7);
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

    const loginUser = (email, password, label) => {
		if (email === "" || password === "") { return; }

		try {
			axios({
				method: "POST",
				url: WINDOW_LOCATION + "/add-show-user-to-user",
				data:{
					email: email,
					password: password,
                    show_code: schoolCode,
                    label: label,
				}
			}).then((response) => {
                setShowAlert(false);
				console.log(response.data)
                setCurPage(8);
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
    }

    const checkSchoolCode = () => {
        setIsLoading(true);
        fetch(WINDOW_LOCATION + '/school-code-auth', {
                method: 'POST',
                body: JSON.stringify({
                    school_code: schoolCode,
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('INVALID SCHOOL CODE');
            }
            return response.json();
        })
        .then((data) => {
            console.log(data);
            setIsLoading(false);
            setCurPage(curPage + 1);
            setSchoolInfo(data)
        })
        .catch((error) => {
            setIsLoading(false);
            alert(error);
        });
    }

	const btnClick = (e) => {
		e.preventDefault()

        // Code page
        if (curPage === 0) {
            checkSchoolCode();
        } 
        
        // Are you sure page
        else if (curPage === 1) {
            setCurPage(2);
        } 
        
        // Label Page
        else if (curPage === 2 && userData != null) {
            setCurPage(3);
        } 
        
        // Terms Page
        else if (curPage === 3 && agreedToTerms) {
            setCurPage(4);
        } 

        // MISSING PAGE 4 INTENTIONALLY
        
        // Login Page
        else if (curPage === 5) {
            loginUser(loginData.email, loginData.password, userData.label);
        }
        
        // Register Page
        else if (curPage === 6) {
            const errors = registrationData.errors;
            if (!errors.first_name_error && !errors.last_name_error && !errors.email_error && !errors.password_errors.any) {
                // NO ERRORS; SEND REQUEST
                activateUser(
                    userData.label, 
                    registrationData.email, 
                    registrationData.password, 
                    registrationData.first_name, 
                    registrationData.last_name
                );
            }
        }

        else if (curPage === 7) {
            setCurPage(8);
        }

        else if (curPage === 8) {
            window.location.href = "/login";
        }
	}

    const getPage = () => {
        // Code Page
        if (curPage === 0) {
            return <SchoolCodePage setSchoolCode={setSchoolCode} />;
        }

        // Are you sure page
        if (curPage === 1) {
            return <p>Are you sure you wish to join "{schoolInfo["schoolName"]}'s {schoolInfo["name"]}"?</p>;
        }

        // Select Label Page
        if (curPage === 2) {
            return <SelectLabelPage options={schoolInfo["users"]} email={schoolInfo["email"]} userData={userData} setUserData={setUserData}/>;
        }

        // Terms Page
        if (curPage === 3) {
            return <TermsPage agreedToTerms={agreedToTerms} setAgreedToTerms={setAgreedToTerms}/>;
        }

        // Add to existing user or create new user
        if (curPage === 4) {
            return (
                <>
                    
                    <button className="btn btn-outline-light btn-lg" type="submit" onClick={e => setCurPage(5)}>Add to Existing Account</button>
                    <br/>
                    <button className="btn btn-outline-light btn-lg" type="submit" onClick={e => setCurPage(6)}>Create New Account</button>
                </>
            );
        }
        
        // Login
        if (curPage === 5) {
            return <LoginPage userData={userData} loginData={loginData} setLoginData={setLoginData} />
        }

        // Register Page
        if (curPage === 6) {
            return <RegisterPage userData={userData} registrationData={registrationData} setRegistrationData={setRegistrationData}/>;
        }

        // Check if verified
        if (curPage === 7) {
            return <WaitForVerify email={registrationData.email}/>
        }

        // Done
        if (curPage === 8) {
            return <h2>You're all set up!</h2>
        }

        return <div>You shouldn't have made it to this page....</div>;
    }

	return(
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
                                            !isLoading ?
                                                <>{getPage()}</>
                                            : <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        }
                                    </div>

								</div>
                                {
                                    curPage !== 0 ?
                                    <button 
                                        className="btn btn-outline-light btn-lg px-5" 
                                        type="submit" 
                                        onClick={e => setCurPage(0)}
                                    >
                                        Start Over
                                    </button>
                                    : null
                                }
                            <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => btnClick(e)}>Continue</button>
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

export default Activate