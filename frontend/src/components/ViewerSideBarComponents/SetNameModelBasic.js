import React from 'react';
import {Modal, Button} from 'react-bootstrap/';
import { TextField } from '@mui/material';
import getApi from '../getApi';

const WINDOW_LOCATION = getApi();

const SetNameModelBasic = (props) => {
    const {show, setShow, token, curSetInfo, setCurSetInfo, data, setData, ...rest} = props;

    const setSetName = (value) => {
        setCurSetInfo({...curSetInfo,  "set_name": value});
    }

    const saveSetName = () => {
        fetch(WINDOW_LOCATION + '/update-set-name', {
            method: 'POST',
            body: JSON.stringify({id: curSetInfo.dot.set_id, set_name: curSetInfo.set_name}),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + token
            }
            })
            .then(res => res.json())
            .then(
                (result) => {
                    let newData = data.dots.map((value, index) => {
                        if (value.dot.id === curSetInfo.dot.id) {
                            value.set_name = curSetInfo.set_name;
                        }

                        return value;
                    })

                    setData({dots: newData});
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

export default SetNameModelBasic;