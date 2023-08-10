import React, { useState, useEffect, useRef } from 'react';
import getApi from '../../getApi';
import axios from "axios";
import { Autocomplete, TextField } from '@mui/material';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';

const WINDOW_LOCATION = getApi();

const AdminEditProp = (props) => {
    const { token, show, setShow, prop, ...rest } = props

    const [width, setWidth] = useState(1);
    const [height, setHeight] = useState(1);
    const [direction, setDirection] = useState("On");
    const [line, setLine] = useState("50");
    const [steps, setSteps] = useState(0.0);
    const [side, setSide] = useState(1);
    const [fbSteps, setFBSteps] = useState(0.0);
    const [fbDirection, setFBDirection] = useState("On");
    const [useHash, setUseHash] = useState("Front side");


    const [image, setImage] = useState(null);
    const [sentRequest, setSentRequest] = useState(false);

    useEffect(() => {
        if (prop.dots === undefined || prop.dots.length === 0) { return; }

        setWidth(prop.dots[0].dot_icon.width_in_steps)
        setHeight(prop.dots[0].dot_icon.hight_in_steps)
        setDirection(prop.dots[0].direction === "" ? "On" : prop.dots[0].direction);
        setLine(prop.dots[0].line);
        setSteps(prop.dots[0].steps);
        setSide(prop.dots[0].side);
        setFBSteps(prop.dots[0].fb_steps);
        setFBDirection(prop.dots[0].fb_direction);
        setUseHash(prop.dots[0].use_hash);
    }, [prop])

    const sendFile = () => {
        if (sentRequest) {
            return;
        }

        const formData = new FormData();

        formData.append('prop_id', prop.id);
        formData.append('width', width);
        formData.append('height', height);
        formData.append('direction', direction === "On" ? "" : direction);
        formData.append('line', line);
        formData.append('steps', steps);
        formData.append('side', side);
        formData.append('fb_steps', fbSteps);
        formData.append('fb_direction', fbDirection);
        formData.append('use_hash', useHash);
        
        if (image !== null) {
            formData.append('image', image);
        }

        setSentRequest(true);

        axios({
            method: "POST",
            url: WINDOW_LOCATION + "/move-stationary-prop",
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

    const handleClose = () => {
        setShow(false);
        setSentRequest(false);
    };
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Edit Stationary Prop</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className='d-flex flex-row justify-content-between align-items-center'>
                    <TextField
                        label="Width in steps"
                        value={width}
                        onChange={(event) => setWidth(event.target.value)}
                        sx={{ width: "40%", margin: "1rem" }}
                        type="number"
                    />
                    <TextField
                        label="Height in steps"
                        value={height}
                        onChange={(event) => setHeight(event.target.value)}
                        sx={{ width: "40%", margin: "1rem" }}
                        type="number"
                    />
                </div>

                <br />

                <div className='d-flex flex-row justify-content-between align-items-center'>
                    <TextField
                        label="Steps"
                        value={steps}
                        onChange={(event) => setSteps(event.target.value)}
                        sx={{ width: "30%", margin: "1rem" }}
                        type="number"
                    />

                    <Autocomplete
                        options={["On", "Outside", "Inside"]}
                        sx={{ width: "30%", margin: "1rem" }}
                        renderInput={(params) => <TextField {...params} label="Direction" />}
                        onChange={(event, newValue) => setDirection(newValue)}
                        value={direction}
                        size="small"
                    />

                    <Autocomplete
                        options={["5", "10", "15", "20", "25", "30", "35", "40", "45", "50"]}
                        sx={{ width: "20%", margin: "1rem" }}
                        renderInput={(params) => <TextField {...params} label="Line" />}
                        onChange={(event, newValue) => setLine(newValue)}
                        value={line}
                        size="small"
                    />
                </div>

                <div className='d-flex flex-row justify-content-between align-items-center'>
                    <TextField
                        label="Steps"
                        value={fbSteps}
                        onChange={(event) => setFBSteps(event.target.value)}
                        sx={{ width: "15%", margin: "1rem" }}
                        type="number"
                    />

                    <Autocomplete
                        options={["On", "Front", "Behind"]}
                        sx={{ width: "30%", margin: "1rem" }}
                        renderInput={(params) => <TextField {...params} label="Line" />}
                        onChange={(event, newValue) => setFBDirection(newValue)}
                        value={fbDirection}
                        size="small"
                    />

                    <Autocomplete
                        options={["Front side", "Front Hash", "Back Hash", "Back Side"]}
                        sx={{ width: "30%", margin: "1rem" }}
                        renderInput={(params) => <TextField {...params} label="Hash" />}
                        onChange={(event, newValue) => setUseHash(newValue)}
                        value={useHash}
                        size="small"
                    />
                    
                    <Autocomplete
                        options={["1", "2"]}
                        sx={{ width: "15%", paddingTop: "1vh", paddingBottom: "1vh" }}
                        renderInput={(params) => <TextField {...params} label="Side" />}
                        onChange={(event, newValue) => setSide(parseInt(newValue))}
                        value={side.toString()}
                        size="small"
                    />
                </div>


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
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                {
                    !sentRequest
                    ? <Button variant="primary" onClick={(e) => sendFile()}>
                        Save
                    </Button>
                    : <Button variant="primary">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </Button>
                }
            </Modal.Footer>
        </Modal>
    );
}

export default AdminEditProp;