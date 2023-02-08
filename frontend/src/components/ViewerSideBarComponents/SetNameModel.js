import React from 'react';
import {Modal, Button} from 'react-bootstrap/';
import { TextField } from '@mui/material';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const SetNameModel = (props) => {
    const {show, setShow, token, curSetInfo, setCurSetInfo, sets, setSets, ...rest} = props;

    const setSetName = (value) => {
        setCurSetInfo({...curSetInfo,  "set_name": value});
    }

    const saveSetName = () => {
        fetch(WINDOW_LOCATION + '/update-set-name', {
            method: 'POST',
            body: JSON.stringify(curSetInfo),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + token
            }
            })
            .then(res => res.json())
            .then(
                (result) => {
                    let newSets = sets.map((value, index) => {
                        if (value.id === curSetInfo.id) {
                            console.log(value);
                            value.set_name = curSetInfo.set_name;
                        }

                        return value;
                    })

                    setSets(newSets);
                    setShow(false);
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.log(error);
                    alert(error)
                }
            );
    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    let setName = curSetInfo !== null ? curSetInfo.set_name : "";

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create/Edit Set Name</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TextField value={setName} onChange={(e) => setSetName(e.target.value)} label="Name" />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={saveSetName}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default SetNameModel;