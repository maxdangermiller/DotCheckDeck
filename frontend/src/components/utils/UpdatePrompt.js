import React from 'react';
import {Modal, Button} from 'react-bootstrap/';

const UpdatePrompt = (props) => {
    const {show, setShow, update, ...rest} = props;

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Hey! There's a new update available!</Modal.Title>
            </Modal.Header>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Later
                </Button>
                <Button variant="primary" onClick={update}>
                    Update
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default UpdatePrompt;