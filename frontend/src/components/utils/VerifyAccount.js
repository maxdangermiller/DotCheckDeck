import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import getApi from '../getApi';

const WINDOW_LOCATION = getApi();

const VerifyAccount = (props) => {
    let params = useParams();

    const [isDone, setIsDone] = useState(false);

    useState(() => {
        try {
            fetch(WINDOW_LOCATION + '/verify-account/' + params["enc_id"], {
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
                    alert("Something went wrong.");
                }
            })
            .catch((error) => {
                alert(error);
            });
        } catch (error) {
            alert(error);
        }
    }, []);

    if (!isDone) {
        return (
            <div className='flex-column justify-content-center d-flex align-items-center adminFullScreen'>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className='flex-column justify-content-center d-flex align-items-center adminFullScreen'>
            <h1>You can close this page now. Your account has been activated, under duress.</h1>
        </div>
    );
}

export default VerifyAccount;