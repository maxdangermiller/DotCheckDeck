import React, { useState, useEffect, useRef } from 'react';
import getApi from '../getApi';

const WINDOW_LOCATION = getApi();

const AdminJoinCodeDisplay = (props) => {
    const { schoolCode, token, ...rest } = props

    const [isLoading, setIsLoading] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState("");

    useState(() => {
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
            setSchoolInfo(data)
        })
        .catch((error) => {
            setIsLoading(false);
            alert(error);
        });
    }, []);

    return (
        <div className='flex-column justify-content-center d-flex align-items-center adminFullScreen'>
            {
                !isLoading ?
                <>
                    <h1 style={{fontSize:"16vh"}}>{schoolInfo.name}</h1>
                    <h1 style={{fontSize:"24vh"}}><strong>{schoolCode}</strong></h1>
                </>
                : <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            }
        </div>
    );
}

export default AdminJoinCodeDisplay;