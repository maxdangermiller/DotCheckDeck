import React, { useState, useEffect, useRef } from 'react';
import getApi from '../getApi';
import axios from "axios";
import { Autocomplete, TextField } from '@mui/material';

const WINDOW_LOCATION = getApi();

const AdminAddProp = (props) => {
    const { schoolCode, token, ...rest } = props

    const [showCode, setShowCode] = useState("");
    const [width, setWidth] = useState(1);
    const [height, setHeight] = useState(1);
    const [direction, setDirection] = useState("");
    const [line, setLine] = useState("50");
    const [steps, setSteps] = useState(0.0);
    const [side, setSide] = useState(1);
    const [fbSteps, setFBSteps] = useState(0.0);
    const [fbDirection, setFBDirection] = useState("On");
    const [useHash, setUseHash] = useState("Front side");


    const [image, setImage] = useState(null);
    const [sentRequest, setSentRequest] = useState(false);

    const sendFile = () => {
        if (image === null) { //  || sentRequest
            return;
        }

        const formData = new FormData();

        formData.append('show_code', showCode);
        formData.append('width', width);
        formData.append('height', height);
        formData.append('direction', direction);
        formData.append('line', line);
        formData.append('steps', steps);
        formData.append('side', side);
        formData.append('fb_steps', fbSteps);
        formData.append('fb_direction', fbDirection);
        formData.append('use_hash', useHash);
        
        formData.append('image', image);

        setSentRequest(true);

        axios({
            method: "POST",
            url: WINDOW_LOCATION + "/add-prop-to-show",
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

                    <br />

                    <Autocomplete
                        options={["", "Outside", "Inside"]}
                        sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                        renderInput={(params) => <TextField {...params} label="Direction" />}
                        onChange={(event, newValue) => setDirection(newValue)}
                        value={direction}
                        size="small"
                    />

                    <Autocomplete
                        options={["5", "10", "15", "20", "25", "30", "35", "40", "45", "50"]}
                        sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                        renderInput={(params) => <TextField {...params} label="Line" />}
                        onChange={(event, newValue) => setLine(newValue)}
                        value={line}
                        size="small"
                    />

                    <div className="mb-3">
                        <label htmlFor="stepsInput" className="form-label">Steps</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            id="stepsInput" 
                            placeholder={0}
                            value={steps}
                            onChange={(event) => setSteps(event.target.value)}
                        />
                    </div>

                    <Autocomplete
                        options={["1", "2"]}
                        sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                        renderInput={(params) => <TextField {...params} label="Side" />}
                        onChange={(event, newValue) => setSide(parseInt(newValue))}
                        value={side.toString()}
                        size="small"
                    />

                    <div className="mb-3">
                        <label htmlFor="stepsInput" className="form-label">Forward Backward Steps</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            id="stepsInput" 
                            placeholder={0}
                            value={fbSteps}
                            onChange={(event) => setFBSteps(event.target.value)}
                        />
                    </div>

                    <Autocomplete
                        options={["On", "Front", "Behind"]}
                        sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                        renderInput={(params) => <TextField {...params} label="Line" />}
                        onChange={(event, newValue) => setFBDirection(newValue)}
                        value={fbDirection}
                        size="small"
                    />

                    <Autocomplete
                        options={["Front side", "Front Hash", "Back Hash", "Back Side"]}
                        sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                        renderInput={(params) => <TextField {...params} label="Line" />}
                        onChange={(event, newValue) => setUseHash(newValue)}
                        value={useHash}
                        size="small"
                    />

                    <br />

                    
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
                        true
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

export default AdminAddProp;