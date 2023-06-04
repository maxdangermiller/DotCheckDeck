import React, { useState, useEffect, useRef } from 'react';
import getApi from '../getApi';
import axios from "axios";

const WINDOW_LOCATION = getApi();

const AdminCreateShow = (props) => {
    const { schoolCode, token, ...rest } = props

    const [showName, setShowName] = useState("");
    const [files, setFiles] = useState([null]);

    const sendFile = () => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('pdf-file-' + i, files[i]);
        }
        formData.append('show-name', showName);
        console.log(files);

        axios({
            method: "POST",
            url: WINDOW_LOCATION + "/upload-show",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data",
                'Authorization': 'Bearer ' + token
            }
        }).then((response) => {
            console.log(response.data)
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
                    <button className="btn btn-primary" onClick={() => sendFile()}>Submit</button>
                </div>
            </div>
        </div>
    );
}

export default AdminCreateShow;