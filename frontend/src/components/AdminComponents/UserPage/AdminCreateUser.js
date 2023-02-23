import React, { useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const AdminCreateUser = (props) => {
    const {token, show, setShow, ...rest} = props;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleSave = () => {
        console.log(JSON.stringify({
            "email": email,
            "password": password,
            "first_name": firstName,
            "last_name": lastName,
            "is_admin": isAdmin
        }));
        fetch(WINDOW_LOCATION + '/create-user', {
            method: 'POST',
            body: JSON.stringify({
                "email": email,
                "password": password,
                "first_name": firstName,
                "last_name": lastName,
                "is_admin": isAdmin
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + token
            }
            })
            .then(res => res.json())
            .then(
                (result) => {
                    
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.log(error);
                    alert(error)
                }
            );
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create User</Modal.Title>
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
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingInput"
                    label="Password"
                    className="mb-3"
                >
                    <Form.Control 
                        type="password" 
                        placeholder="" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
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
                        value={firstName} 
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
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </FloatingLabel>

                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setIsAdmin(!isAdmin)} 
                        checked={isAdmin} 
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
                <Button variant="primary" onClick={(e) => handleSave()}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminCreateUser;