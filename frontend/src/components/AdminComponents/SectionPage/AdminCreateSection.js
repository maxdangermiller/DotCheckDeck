import React, { useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';
import getApi from '../../getApi';
import { RgbColorPicker } from "react-colorful";

const WINDOW_LOCATION = getApi();

const AdminCreateSection = (props) => {
    const {token, show, setShow, handleSave, ...rest} = props;

    const [name, setName] = useState("");
    const [colorValue, setColorValue] = useState({r: 0, g: 0, b: 0});

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const getColor = () => {
        return "rgb(" + colorValue.r + "," + colorValue.g + "," + colorValue.b + ")";
    }

    const color = () => {
        return { r: colorValue.r, g: colorValue.g, b: colorValue.b };
    }

    const setColor = (value) => {
        setColorValue({r: value.r, g: value.g, b: value.b});
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create Section</Modal.Title>
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
                        value={name} 
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
                <Button variant="primary" onClick={(e) => handleSave()}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminCreateSection;