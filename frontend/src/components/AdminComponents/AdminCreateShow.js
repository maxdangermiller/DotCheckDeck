import React, { useState, useEffect, useRef } from 'react';
import getApi from '../utils/getApi';
import axios from "axios";

const WINDOW_LOCATION = getApi();

const AdminCreateShow = (props) => {
    const { schoolCode, token, ...rest } = props

    const [showName, setShowName] = useState("");
    const [files, setFiles] = useState([null]);
    const [audio, setAudio] = useState(null);
    const [sentRequest, setSentRequest] = useState(false);

    const sendFile = () => {
        if (files.length === 0 || audio === null || sentRequest) {
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('pdf-file-' + i, files[i]);
        }
        formData.append('mp3-file', audio);
        formData.append('show-name', showName);
        console.log(files);

        setSentRequest(true);

        axios({
            method: "POST",
            url: WINDOW_LOCATION + "/upload-show",
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
				<div className="card-body p-5 text-center">
                    <h2 className="fw-bold mb-2 text-uppercase">Create New Show</h2>
                    
                    <div className="mb-3">
                        <label htmlFor="showNameInput" className="form-label">Show Name</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            id="showNameInput" 
                            placeholder="Default Show Name" 
                            value={showName}
                            onChange={(event) => setShowName(event.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="formFileMultiple" className="form-label">Choose Show Files</label>
                        <input 
                            className="form-control" 
                            type="file" 
                            id="formFileMultiple" 
                            onChange={(event) => setFiles(event.target.files)}
                            multiple
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="showAudio" className="form-label">Choose Show Audio</label>
                        <input 
                            className="form-control" 
                            type="file" 
                            id="showAudio" 
                            onChange={(event) => setAudio(event.target.files[0])}
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
    );
}

export default AdminCreateShow;