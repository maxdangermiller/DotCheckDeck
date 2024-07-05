import React, { useRef, useEffect, useState} from 'react';
import { TextField, Icon } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const LoginPage = (props) => {

    const { userOptions, loginData, setLoginData, ...rest } = props

    const setEmail = (value) => {
        setLoginData({...loginData, email: value});
    }

    const setPassword = (value) => {
        setLoginData({...loginData, password: value});
    }

    return (
        <>
            <TextField
                className="mb-3 customInput"
                value={loginData.email}
                onChange={e => setEmail(e.target.value)}
                label="Email"
                type="email"
                variant="outlined"
                autoComplete="username"
            />
            <TextField
                className="mb-3 customInput"
                value={loginData.password}
                onChange={e => setPassword(e.target.value)}
                label="Password"
                type="password"
                variant="outlined"
                autoComplete='current-password'
            />
        </>
    )
}

export default LoginPage;