import React, { useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';
import getApi from '../../utils/getApi';

const WINDOW_LOCATION = getApi();

const AdminInviteDrumMajor = (props) => {
    const {token, show, setShow, default_show_id} = props;

    const [email, setEmail] = useState("");

    const handleClose = () => setShow(false);

    const handleSave = () => {
        try {     
            fetch(WINDOW_LOCATION + '/invite-user', {
                method: 'POST',
                body: JSON.stringify({
                    "email": email,
                    "is_admin": false,
                    "is_drum_major": true,
                    "show_id": default_show_id
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + token
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        console.log(result);
                        setShow(false);
                    },
                    // Note: it's important to handle errors here
                    // instead of a catch() block so that we don't swallow
                    // exceptions from actual bugs in components.
                    (error) => {
                        console.log(error);
                        alert(error)
                    }
                );
        } catch (error) {
            console.log("ERROR " + error);
        }
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Invite Drum Major</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FloatingLabel
                    controlId="emailInput"
                    label="Email address"
                    className="mb-3"
                >
                    <Form.Control 
                        type="email" 
                        placeholder="name@example.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </FloatingLabel>

                This will send an email to the user to activate their account
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={(e) => handleSave()}>
                    Invite
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminInviteDrumMajor;