import React, { useRef, useEffect, useState} from 'react';
import { TextField } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";
import './Activate.css'

import SchoolCodePage from './ActivateFormPages/SchoolCodePage';
import SelectLabelPage from './ActivateFormPages/SelectLabelPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Activate = (props) => {

    const [curPage, setCurPage] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
    const [schoolCode, setSchoolCode] = useState("");
    const [schoolInfo, setSchoolInfo] = useState("");

    const activateUser = () => {
        fetch('http://127.0.0.1:5000/users/activate', {
                method: 'POST',
                body: JSON.stringify({
                    school_code: schoolCode,
                    label: 'd7',
                    email: "mmiller5@uhigh.illinoisstate.edu", 
                    password: "Password12345", 
                    first_name: "Max", 
                    last_name: "Miller"
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        console.log(result)
                    },
                    // Note: it's important to handle errors here
                    // instead of a catch() block so that we don't swallow
                    // exceptions from actual bugs in components.
                    (error) => {
                        console.log(error);
                    }
                );
    }

    const checkSchoolCode = () => {
        setIsLoading(true);
        fetch('http://127.0.0.1:5000/school-code-auth', {
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
        }
	}

	return(
		<ThemeProvider theme={darkTheme}><section className="gradient-custom">
			<div className="container py-5 h-100">
				<div className="row d-flex justify-content-center align-items-center h-100">
					<div className="col-12 col-md-8 col-lg-6 col-xl-5">
						<div className="card bg-dark text-white" style={{borderRadius: '1rem'}}>
							<div className="card-body p-5 text-center">
								<div className="mb-md-5 mt-md-4 pb-5">

									<h2 className="fw-bold mb-2 text-uppercase">Activate</h2>
									<p className="text-white-50 mb-5">Activate an account with a school!</p>

        {
            !isLoading ?
            <div>
                {
                    curPage === 0 ?
                    <SchoolCodePage setSchoolCode={setSchoolCode} />

                    : curPage === 1 ?
                    <p>Are you sure you wish to join "{schoolInfo["name"]}"?</p>

                    : curPage === 2 ?
                    <SelectLabelPage options={schoolInfo["users"]} email={schoolInfo["email"]}/>
                    : null
                }
                {
                    curPage !== 0 ?
                    <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => setCurPage(0)}>Cancel</button>
                    : null
                }
                <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={e => btnClick(e)}>Continue</button>
            </div>
            : <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        }

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

export default Activate