import React, { useEffect, useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';
import {Switch, FormControlLabel, FormGroup} from '@mui/material/';

const AdminEditShow = (props) => {
    const {show, setShow, editData, setEditData, handleSave, setShowAddPDF, setAddPDFData, ...rest} = props;

    const setName = (value) => {
        setEditData({...editData,  "name": value});
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
                <Modal.Title>Edit Show</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FloatingLabel
                    controlId="floatingInput"
                    label="Name"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="Show Name" 
                        value={editData.name} 
                        onChange={(e) => setName(e.target.value)}
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingInput"
                    label="Code"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="12345678" 
                        value={editData.code} 
                        onChange={(e) => setCode(e.target.value)}
                    />
                </FloatingLabel>

                <FormControlLabel control={
                    <Switch
                        checked={editData.is_default}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                } label="Is Default?" />

            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" onClick={(e) => {setShowAddPDF(true); setAddPDFData(editData); handleClose();}}>
                    Add PDF to Show
                </Button>
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

export default AdminEditShow;