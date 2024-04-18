import React from 'react';
import getApi from '../utils/getApi';

import 'bootstrap/dist/css/bootstrap.css';

const WINDOW_LOCATION = getApi();

const WaitForVerify = (props) => {
    const sendEmail = () => {
        try {     
            fetch(WINDOW_LOCATION + '/send-verify-email?email=' + props.email, {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            })
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                alert(error);
            });
        } catch (error) {
            console.log("ERROR " + error);
        }
    }

    return (
        <div className='h-100'>
            An email has been sent to you with an verify email link, please click it!
            <br />
            <button className="btn btn-outline-light btn-lg" type="submit" onClick={e => sendEmail()}>Resend Email</button>
        </div>
    )
}

export default WaitForVerify;