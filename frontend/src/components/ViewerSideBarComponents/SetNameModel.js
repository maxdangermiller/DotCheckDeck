import React from 'react';
import {Modal, Button} from 'react-bootstrap/';
import { TextField } from '@mui/material';

const SetNameModel = (props) => {
    const {show, setShow, token, curSetInfo, ...rest} = props;

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    let setName = curSetInfo !== null ? curSetInfo.set_name : "";

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create/Edit Set Name</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TextField value={setName} label="Name" />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default SetNameModel;