import React, { useRef, useEffect, useState} from 'react';
import { TextField, Icon } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import 'bootstrap/dist/css/bootstrap.css';

const RegisterPage = (props) => {

    const { userOptions, registrationData, setRegistrationData, ...rest } = props

    // const [firstNameError, setFirstNameError] = useState(false);
    const [lastNameError, setLastNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
	const [emailExistsError, setEmailExistsError] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({
		'letter': true,
		'capital': true,
		'number': true,
		'length': true,
		'any': false
	});

    const setFirstName = (value) => {
        setRegistrationData({
            ...registrationData,  
            "first_name": value,
            "errors": {...registrationData.errors, "first_name_error": value === ""}
        });
    }

    const setLastName = (value) => {
        setRegistrationData({
            ...registrationData,  
            "last_name": value,
            "errors": {...registrationData.errors, "last_name_error": value === ""}
        });
    }

    const validateEmail = (input) => {
		const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/;
		const validRegex2 = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/;

		return input.match(validRegex) || input.match(validRegex2);
	}

    const setEmail = (value) => {
        setRegistrationData({
            ...registrationData,  
            "email": value,
            "errors": {...registrationData.errors, "email_error": !validateEmail(value)}
        });
    }

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

		// setPasswordErrors(errors);
        setRegistrationData({
            ...registrationData,  
            "password": value,
            "errors": {...registrationData.errors, "password_errors": errors}
        });
    }

    const setConfPwd = (value) => {
        setRegistrationData({...registrationData,  "password_confirm": value});
    }

    return (
        <div>
            <TextField
                className="mb-3 customInput"
                value={registrationData.first_name}
                onChange={e => setFirstName(e.target.value)}
                label="First Name"
                variant="outlined"
                style={{width: "100%"}}
                id="first-name"

                error={registrationData.errors.first_name_error}
            />

            <TextField
                className="mb-3 customInput"
                value={registrationData.last_name}
                onChange={e => setLastName(e.target.value)}
                label="Last Name"
                variant="outlined"
                style={{width: "100%"}}
                id="last-name"

                error={registrationData.errors.last_name_error}
            />

            <TextField
                className="mb-3 customInput"
                value={registrationData.email}
                onChange={e => setEmail(e.target.value)}
                label="Email"
                variant="outlined"
                style={{width: "100%"}}
                id="email"
                type="email"

                error={registrationData.errors.email_error || registrationData.errors.email_exists_error}
            />

            <TextField
                className="mb-3 customInput"
                value={registrationData.password}
                onChange={e => setPwd(e.target.value)}
                label="Password"
                variant="outlined"
                style={{width: "100%"}}
                type="password"
                id="password"

                error={registrationData.errors.password_errors.any}
            />

            <TextField
                className="mb-3 customInput"
                value={registrationData.password_confirm}
                onChange={e => setConfPwd(e.target.value)}
                label="Confirm Password"
                variant="outlined"
                style={{width: "100%"}}
                type="password"
                id="confirm-password"

                error={registrationData.errors.password_errors.any || registrationData.password !== registrationData.password_confirm}
            />

            <div className="d-flex justify-content-center align-items-start flex-column">
            {
                registrationData.password === registrationData.password_confirm
                    ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> Passwords Match</p>
                    : <p className="mb-1"><Icon component={CancelIcon} color="error"/> Passwords Don't Match</p>
            }
            {
                !registrationData.errors.password_errors.letter
                    ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> A lowercase letter</p>
                    : <p className="mb-1"><Icon component={CancelIcon} color="error"/> A lowercase letter</p>
            }
            {
                !registrationData.errors.password_errors.capital
                    ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> A capital (uppercase) letter</p>
                    : <p className="mb-1"><Icon component={CancelIcon} color="error"/> A capital (uppercase) letter</p>
            }
            {
                !registrationData.errors.password_errors.number
                    ? <p className="mb-1"><Icon component={CheckCircleIcon} color="success"/> A number</p>
                    : <p className="mb-1"><Icon component={CancelIcon} color="error"/> A number</p>
            }
            {
                !registrationData.errors.password_errors.length
                    ? <p className="mb-4"><Icon component={CheckCircleIcon} color="success"/> Minimum 8 characters</p>
                    : <p className="mb-4"><Icon component={CancelIcon} color="error"/> Minimum 8 characters</p>
            }
            </div>
        </div>
    )
}

export default RegisterPage;