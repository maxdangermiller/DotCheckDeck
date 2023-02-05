import React, { useState } from 'react';
import {Modal, Button, FloatingLabel, Form, ListGroup, Row, Col } from 'react-bootstrap/';
import { Autocomplete, TextField } from '@mui/material';

const AdminEditShowUser = (props) => {
    const {showEditShowUser, setShowEditShowUser, editUserData, setEditUserData, sections, handleSave, ...rest} = props;

    const setValue = (index, key, value) => {
        const newState = editUserData.show_users.map((val, i) => {
            if (i === index) {
              val[key] = value;
            } 
            return val;
        });

        setEditUserData({...editUserData,  "show_users": newState});
    }

    const setSymbol = (index, value) => {
        setValue(index, "symbol", value);
    }

    const setLabel = (index, value) => {
        setValue(index, "label", value);
    }

    const setIsSectionLeader = (index, value) => {
        setValue(index, "is_section_leader", value);
    }

    const setBandSection = (index, value) => {
        setValue(index, "section_id", value.id)
    }

    const findSectionNameByID = (id) => {
        for (let i = 0; i < sections.length; i++) {
            if (sections[i].id === id) {
                return {id: sections[i].id, label: sections[i].name};
            }
        }
        return {id: sections[0].id, label: sections[0].name};
    }

    const fixUserOptions = (options) => {
        let out = [];

        for (let x = 0; x < options.length; x++) {
            out.push({
                id: options[x].id, 
                label: options[x].name, 
            });
            
        }

        return out;
    }

    const handleClose = () => setShowEditShowUser(false);
    const handleShow = () => setShowEditShowUser(true);

    return (
        <Modal show={showEditShowUser} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Show User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ListGroup>
                    {
                        editUserData.show_users != undefined ?

                        editUserData.show_users.map((showUser, index) => 
                            <ListGroup.Item key={index}>
                                <h2>NAME HERE!</h2>
                                <Row className="mb-3">
                                    <Form.Group as={Col}>
                                        <Form.Label>Symbol</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Label" 
                                            value={showUser.symbol} 
                                            onChange={(e) => setSymbol(index, e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group as={Col}>
                                        <Form.Label>Label</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Label" 
                                            value={showUser.label} 
                                            onChange={(e) => setLabel(index, e.target.value)}
                                        />
                                    </Form.Group>
                                </Row>
                                <div className="mb-3 form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        value="" 
                                        onChange={() => setIsSectionLeader(index, !showUser.is_section_leader)} 
                                        checked={showUser.is_section_leader} 
                                    />
                                    <label className="form-check-label ">
                                        Is Section Leader
                                    </label>
                                </div>
                                <Autocomplete
                                    disablePortal
                                    options={fixUserOptions(sections)}
                                    sx={{ width: "100%" }}
                                    renderInput={(params) => <TextField {...params} label="Band Section" />}
                                    onChange={(event, newValue) => setBandSection(index, newValue)}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={findSectionNameByID(showUser.section_id)}
                                />
                            </ListGroup.Item>
                        )
                        : null
                    }
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={(e) => handleSave(editUserData)}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminEditShowUser;