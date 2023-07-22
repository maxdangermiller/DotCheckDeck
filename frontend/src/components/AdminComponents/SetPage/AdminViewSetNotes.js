import React, { useEffect, useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';

const AdminViewSetNotes = (props) => {
    const {show, setShow, notes, ...rest} = props;

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Section</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>{notes}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminViewSetNotes;