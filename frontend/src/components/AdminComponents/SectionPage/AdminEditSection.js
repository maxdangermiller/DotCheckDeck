import React, { useEffect, useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';
import { RgbColorPicker } from "react-colorful";

const AdminEditSection = (props) => {
    const {show, setShow, editData, setEditData, handleSave, ...rest} = props;

    const setName = (value) => {
        setEditData({...editData,  "name": value});
    }

    const getColor = () => {
        if (editData.color_r !== undefined) {
            return "rgb(" + editData.color_r + "," + editData.color_g + "," + editData.color_b + ")";
        }
    }

    const color = () => {
        if (editData.color_r !== undefined) {
            return { r: editData.color_r, g: editData.color_g, b: editData.color_b };
        }
        return { r: 255, g: 255, b: 255 };
    }

    const setColor = (value) => {
        setEditData({...editData,  "color_r": value.r, "color_g": value.g, "color_b": value.b});
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
                    label="Name"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="John Doe" 
                        value={editData.name} 
                        onChange={(e) => setName(e.target.value)}
                    />
                </FloatingLabel>

                <div style={{backgroundColor: getColor()}}></div>
                <RgbColorPicker color={color()} onChange={(val) => setColor(val)} />
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

export default AdminEditSection;