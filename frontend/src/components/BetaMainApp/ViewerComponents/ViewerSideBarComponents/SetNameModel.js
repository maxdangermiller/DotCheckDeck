import React, { useState, useEffect } from 'react';
import {Modal, Button} from 'react-bootstrap/';
import { TextField } from '@mui/material';
import getApi from '../../../utils/getApi';

const WINDOW_LOCATION = getApi();

const SetNameModel = (props) => {
    const {show, setShow, token, curSetInfo, setCurSetInfo, updateSpecificSetName} = props;

    const [ setName, setCurSetName ] = useState('');



    function handelChangeSetName(event) {
        let value = event.target.value;
        setCurSetName(value)

        setCurSetInfo({...curSetInfo,  "set_name": value});
    }

    const saveSetName = () => {
        
        try {
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
                        updateSpecificSetName(setName, curSetInfo.id, result["sn-update-timestamp"]);
                        
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
        } catch (error) {
            console.log("ERROR " + error);
        }
    }

    useEffect(() => {
        if (curSetInfo === null || curSetInfo === undefined || curSetInfo.set_name === null || curSetInfo.set_name === undefined ) {
            setCurSetName("");
        }
        else {
            setCurSetName(curSetInfo.set_name);
        }
    }, [show])

    const handleClose = () => setShow(false);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create/Edit Set Name</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TextField value={setName} onChange={handelChangeSetName} label="Name" />
                <p>Please make it short to make sure everyone will be able to see the whole name!</p>
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