import React, { useEffect, useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';
import {Switch, FormControlLabel, FormGroup} from '@mui/material/';
import getApi from '../../getApi';
import axios from "axios";

const WINDOW_LOCATION = getApi();

const AdminAddPDF = (props) => {
    const {show, setShow, editData, setEditData, token, ...rest} = props;
    const [files, setFiles] = useState([null]);

    const handleSave = () => {
        if (files.length === 0 || files[0] === null) {
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('pdf-file-' + i, files[i]);
        }
        formData.append('show-id', editData.id);
        console.log(files);

        axios({
            method: "POST",
            url: WINDOW_LOCATION + "/upload-dot-sheet",
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

    const setCode = (value) => {
        setEditData({...editData,  "code": value});
    }

    const setIsDefault = (value) => {
        console.log(value)
        setEditData({...editData, "is_default": value})
    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add PDF to Show</Modal.Title>
            </Modal.Header>
            <Modal.Body>
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
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={(e) => handleSave()}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminAddPDF;