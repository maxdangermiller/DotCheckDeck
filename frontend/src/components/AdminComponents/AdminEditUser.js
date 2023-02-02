import React, { useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';

const AdminEditUser = (props) => {
    const {show, setShow, editUserData, setEditUserData, ...rest} = props;

    const setEmail = (value) => {
        setEditUserData({...editUserData,  "email": value});
    }

    const setFirstName = (value) => {
        setEditUserData({...editUserData,  "first_name": value});
    }

    const setLastName = (value) => {
        setEditUserData({...editUserData,  "last_name": value});
    }

    const setIsAdmin = (value) => {
        setEditUserData({...editUserData,  "is_admin": value});
    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FloatingLabel
                    controlId="floatingInput"
                    label="Email address"
                    className="mb-3"
                >
                    <Form.Control 
                        type="email" 
                        placeholder="name@example.com" 
                        value={editUserData.email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingInput"
                    label="First Name"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="John" 
                        value={editUserData.first_name} 
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingInput"
                    label="Last Name"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="Doe" 
                        value={editUserData.last_name} 
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </FloatingLabel>

                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setIsAdmin(!editUserData.is_admin)} 
                        checked={editUserData.is_admin} 
                    />
                    <label className="form-check-label ">
                        Is Admin
                    </label>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleClose}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminEditUser;