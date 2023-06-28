import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import getApi from '../getApi';

const WINDOW_LOCATION = getApi();

const VerifyAccount = (props) => {
    let params = useParams();

    const [isLoading, setIsLoading] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState("");

    useState(() => {
        setIsLoading(true);
        fetch(WINDOW_LOCATION + '/verify-account/' + params["enc_id"], {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
        })
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            setIsLoading(false);
            alert(error);
        });
    }, []);

    return (
        <div className='flex-column justify-content-center d-flex align-items-center adminFullScreen'>
            <h1>You can close this page now. Your account has been activated, under duress.</h1>
        </div>
    );
}

export default VerifyAccount;