import React, { useRef, useEffect, useState} from 'react';
import { TextField } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";
import './Activate.css'

import SchoolCodePage from './ActivateFormPages/SchoolCodePage';
import SelectLabelPage from './ActivateFormPages/SelectLabelPage';
import RegisterPage from './ActivateFormPages/RegisterPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const Activate = (props) => {

    const [curPage, setCurPage] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
    const [schoolCode, setSchoolCode] = useState("");
    const [schoolInfo, setSchoolInfo] = useState("");
    const [userData, setUserData] = useState(null);
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

    const activateUser = (label, email, password, firstName, lastName) => {
        fetch(WINDOW_LOCATION + '/users/activate', {
                method: 'POST',
                body: JSON.stringify({
                    school_code: schoolCode,
                    label: label,
                    email: email, 
                    password: password, 
                    first_name: firstName, 
                    last_name: lastName
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        // console.log("Result: " + result)
                        // setCurPage(4);
                        window.location.href = "/login";
                    },
                    // Note: it's important to handle errors here
                    // instead of a catch() block so that we don't swallow
                    // exceptions from actual bugs in components.
                    (error) => {
                        console.log(error);
                        alert(error)
                    }
                );
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

        if (curPage === 0) {
            checkSchoolCode();
        } else if (curPage === 1) {
            setCurPage(2);
        } else if (curPage === 2 && userData != null) {
            setCurPage(3);
        } else if (curPage == 3) {
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
	}

	return(
		<ThemeProvider theme={darkTheme}><section className="gradient-custom">
			<div className="container py-5 h-100">
				<div className="row d-flex justify-content-center align-items-center h-100">
					<div className="col-12 col-md-8 col-lg-6 col-xl-5">
						<div className="card bg-dark text-white" style={{borderRadius: '1rem', height: "80vh"}}>
							<div className="card-body p-5 text-center h-100">
                                <h2 className="fw-bold mb-2 text-uppercase">Activate</h2>
								<p className="text-white-50 mb-5">Activate an account with a school!</p>
								<div className="mt-md-4 pb-5 customCardBody">

        {
            !isLoading ?
            <div>
                {
                    curPage === 0 ?
                    <SchoolCodePage setSchoolCode={setSchoolCode} />

                    : curPage === 1 ?
                    <p>Are you sure you wish to join "{schoolInfo["name"]}"?</p>

                    : curPage === 2 ?
                    <SelectLabelPage options={schoolInfo["users"]} email={schoolInfo["email"]} userData={userData} setUserData={setUserData}/>
                    : curPage === 3 ?
                    <RegisterPage userData={userData} registrationData={registrationData} setRegistrationData={setRegistrationData}/>
                    : null
                }
            </div>
            : <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        }

								</div>
        {
            curPage !== 0 ?
            <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => setCurPage(0)}>Cancel</button>
            : null
        }
                            <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => btnClick(e)}>Continue</button>
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

export default Activate