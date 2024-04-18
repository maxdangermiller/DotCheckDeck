import React, { useState, useEffect, useRef } from 'react';
import getApi from '../utils/getApi';
import axios from "axios";
import { Autocomplete, TextField } from '@mui/material';

const WINDOW_LOCATION = getApi();

const AdminConvertToProp = (props) => {
    const { schoolCode, token, ...rest } = props

    const [showCode, setShowCode] = useState("");
    const [width, setWidth] = useState(1);
    const [height, setHeight] = useState(1);
    const [userLabel, setUserLabel] = useState("");
    const [line, setLine] = useState("50");
    const [steps, setSteps] = useState(0.0);
    const [side, setSide] = useState(1);
    const [fbSteps, setFBSteps] = useState(0.0);
    const [fbDirection, setFBDirection] = useState("On");
    const [useHash, setUseHash] = useState("Front side");


    const [image, setImage] = useState(null);
    const [sentRequest, setSentRequest] = useState(false);

    const sendFile = () => {
        if (image === null || sentRequest) {
            return;
        }

        const formData = new FormData();

        formData.append('show_code', showCode);
        formData.append('width', width);
        formData.append('height', height);
        formData.append('label', userLabel);
        
        formData.append('image', image);

        setSentRequest(true);

        axios({
            method: "POST",
            url: WINDOW_LOCATION + "/convert-user-to-prop",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data",
                'Authorization': 'Bearer ' + token
            }
        }).then((response) => {
            setSentRequest(false);
            console.log(response.data)
            window.location.href = "/admin";
        }).catch((error) => {
            if (error.response) {
                console.log(error.response)
                // console.log(error.response.status)
                // console.log(error.response.headers)
            }
        })
    }

    return (
        <div className='flex-column justify-content-center d-flex align-items-center adminFullScreen'>
            <div className="card bg-light" style={{borderRadius: '1rem'}}>
				<div className="card-body p-5 text-center" style={{height:"60vh"}}>
                    <div className='overflow overflow-auto' style={{height:"100%"}}>
                    <h2 className="fw-bold mb-2 text-uppercase">Create Prop</h2>
                    
                    <div className="mb-3">
                        <label htmlFor="showNameInput" className="form-label">Show Code</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            id="showNameInput" 
                            placeholder="12345678" 
                            value={showCode}
                            onChange={(event) => setShowCode(event.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="widthInput" className="form-label">Width in steps</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            id="widthInput" 
                            placeholder={0}
                            value={width}
                            onChange={(event) => setWidth(event.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="heightInput" className="form-label">Height in steps</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            id="heightInput" 
                            placeholder={0}
                            value={height}
                            onChange={(event) => setHeight(event.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="showNameInput" className="form-label">User Label</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            id="showNameInput" 
                            placeholder="" 
                            value={userLabel}
                            onChange={(event) => setUserLabel(event.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="image" className="form-label">Choose Image</label>
                        <input 
                            className="form-control" 
                            type="file" 
                            id="image" 
                            onChange={(event) => setImage(event.target.files[0])}
                        />
                    </div>
                    

                    {
                        !sentRequest
                        ? <button className="btn btn-primary" onClick={() => sendFile()}>Submit</button>
                        : <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    }
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminConvertToProp;