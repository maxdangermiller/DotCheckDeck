import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from "react-qr-code";
import getApi from '../utils/getApi';

const WINDOW_LOCATION = getApi();

const AdminJoinCodeDisplay = (props) => {
    let { show_id } = useParams();
    const { token } = props

    const [isLoading, setIsLoading] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState("");

    useState(() => {
        let url = WINDOW_LOCATION + '/default-join-code';

        if (show_id !== null) {
            url = url + "?show_id=" + show_id
        }

        setIsLoading(true);
        try {
            fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                        'Authorization': 'Bearer ' + token
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
        } catch (error) {
            console.log("ERROR " + error);
        }
    }, []);

    console.log(window.location);

    return (
        <div className='flex-column justify-content-center d-flex align-items-center adminFullScreen'>
            {
                !isLoading ?
                <>
                    <h1 style={{fontSize:"16vh"}}>{schoolInfo.name}</h1>
                    <QRCode 
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={window.location.origin + "/activate/" + schoolInfo.code} 
                    />
                    <h1 style={{fontSize:"12vh"}}><strong>{schoolInfo.code}</strong></h1>
                </>
                : <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            }
        </div>
    );
}

export default AdminJoinCodeDisplay;