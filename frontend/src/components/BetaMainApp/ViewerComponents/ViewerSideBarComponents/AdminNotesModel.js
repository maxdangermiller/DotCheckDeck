import React, { useState, useEffect } from 'react';
import {Modal, Button, ModalTitle, FloatingLabel, Form } from 'react-bootstrap/';
import { TextField } from '@mui/material';
import getApi from '../../../utils/getApi';

const WINDOW_LOCATION = getApi();

const AdminNotesModel = (props) => {
    const {show, setShow, curSetInfo, isAdminAuthorized, token} = props;

    const [notes, setNotes] = useState("");

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const saveNotes = () => {
        
        try {
            fetch(WINDOW_LOCATION + '/update-notes', {
                method: 'POST',
                body: JSON.stringify({
                    "id": curSetInfo.id,
                    "notes": notes
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + token
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        // updateSpecificSetName(setName, curSetInfo.id, result["sn-update-timestamp"]);
                        alert("Notes have been updated, now everyone (including you) must refresh and then update to view the changes. ")
                        
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

    useEffect(() => {
        if (curSetInfo !== null && curSetInfo !== undefined && curSetInfo.notes !== null) {
            setNotes(curSetInfo.notes);
        }
        else {
            setNotes("");
        }
	    // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [curSetInfo])

    if (curSetInfo === null || curSetInfo === undefined) {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Notes for Set UNDEFINED</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "20vh", color: "red"}}>
                    NONE OF THE DIRECTORS/ADMINS HAVE WRITTEN ANY NOTES
                </Modal.Body>
                <Modal.Footer>

                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    if (curSetInfo.notes === null || curSetInfo.notes === "") {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Notes for Set {curSetInfo.set_numb} (ADMIN EDIT MODE)</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "20vh", color: "red"}}>
                    NONE OF THE DIRECTORS/ADMINS HAVE WRITTEN ANY NOTES
                    <FloatingLabel
                        label="Notes"
                        className="mb-3"
                    >
                        <Form.Control 
                            as="textarea" 
                            rows={3}
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </FloatingLabel>

                    <br/>

                    Note: Any changes will require an update for all users.
                    It's recommended to add your notes not during rehearsal so everyone doesn't get an update suggestion constantly. 
                    Any update made here will require every user to update, so try to write all of your notes when people aren't using it.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={saveNotes}>
                        Save Notes
                    </Button>
                </Modal.Footer>
            </Modal>
        ); 
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Notes for Set {curSetInfo.set_numb} (ADMIN EDIT MODE)</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{minHeight: "20vh"}}>
                <FloatingLabel
                    label="Notes"
                    className="mb-3"
                >
                    <Form.Control 
                        as="textarea" 
                        rows={3}
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </FloatingLabel>


                <br/>

                Note: Any changes will require an update for all users.
                It's recommended to add your notes not during rehearsal so everyone doesn't get an update suggestion constantly. 
                Any update made here will require every user to update, so try to write all of your notes when people aren't using it.
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={saveNotes}>
                    Save Notes
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminNotesModel;