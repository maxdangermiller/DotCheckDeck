import React, { useState } from 'react';
import {Modal, Button } from 'react-bootstrap/';
import getApi from '../../getApi';

const WINDOW_LOCATION = getApi();

const AdminDeleteUser = (props) => {
    const {show, setShow, user, token} = props;

    const [confirmed, setConfirmed] = useState(false);

    const handleClose = () => setShow(false);

    const handelDelete = () => {
        try {
            fetch(WINDOW_LOCATION + '/create-user', {
                method: 'DELETE',
                body: JSON.stringify({
                    "id": user.id,
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + token
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        setShow(false);
                        window.location.reload();
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
                <Modal.Title>Delete User ({user.email})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setConfirmed(!confirmed)} 
                        checked={confirmed} 
                    />
                    <label className="form-check-label ">
                        Are you sure
                    </label>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Bail!
                </Button>
                <Button variant="danger" onClick={(e) => handelDelete()} disabled={!confirmed}>
                    Delete
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminDeleteUser;