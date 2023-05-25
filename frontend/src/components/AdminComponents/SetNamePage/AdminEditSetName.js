import React, { useEffect, useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';

const AdminEditSetName = (props) => {
    const {show, setShow, editData, setEditData, handleSave, ...rest} = props;

    const setName = (value) => {
        setEditData({...editData,  "name": value});
    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Set Name</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FloatingLabel
                    controlId="floatingInput"
                    label="Name"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="Set Name" 
                        value={editData.name} 
                        onChange={(e) => setName(e.target.value)}
                    />
                </FloatingLabel>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={(e) => handleSave(editData)}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminEditSetName;