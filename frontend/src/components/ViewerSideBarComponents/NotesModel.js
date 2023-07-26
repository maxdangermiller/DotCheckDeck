import React from 'react';
import {Modal, Button} from 'react-bootstrap/';
import { TextField } from '@mui/material';
import getApi from '../getApi';

const WINDOW_LOCATION = getApi();

const NotesModel = (props) => {
    const {show, setShow, curSetInfo, ...rest} = props;

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    console.log(curSetInfo)

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Notes for Set {curSetInfo.set_numb}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{minHeight: "20vh"}}>
                {curSetInfo.notes}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default NotesModel;