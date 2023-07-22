import React, { useEffect, useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';

const AdminEditSet = (props) => {
    const {show, setShow, editData, setEditData, handleSave, ...rest} = props;

    const setMeasure = (value) => {
        setEditData({...editData,  "measure": value});
    }

    const setCounts = (value) => {
        setEditData({...editData,  "counts": value});
    }

    const setTotalCounts = (value) => {
        setEditData({...editData,  "total_counts": value});
    }

    const setNotes = (value) => {
        setEditData({...editData,  "notes": value});
    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Section</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FloatingLabel
                    controlId="floatingInput"
                    label="Measure"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="" 
                        value={editData.measure} 
                        onChange={(e) => setMeasure(e.target.value)}
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingInput"
                    label="Counts"
                    className="mb-3"
                >
                    <Form.Control 
                        type="number" 
                        placeholder="" 
                        value={editData.counts} 
                        onChange={(e) => setCounts(e.target.value)}
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingInput"
                    label="Total Counts"
                    className="mb-3"
                >
                    <Form.Control 
                        type="number" 
                        placeholder="" 
                        value={editData.total_counts} 
                        onChange={(e) => setTotalCounts(e.target.value)}
                    />
                </FloatingLabel>
                
                <FloatingLabel
                    label="Notes"
                    className="mb-3"
                >
                    <Form.Control 
                        as="textarea" 
                        rows={3}
                        value={editData.notes} 
                        onChange={(e) => setNotes(e.target.value)}
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

export default AdminEditSet;