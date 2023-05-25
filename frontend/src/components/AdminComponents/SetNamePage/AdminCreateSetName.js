import React, { useEffect, useState } from 'react';
import {Modal, Button, FloatingLabel, Form } from 'react-bootstrap/';
import { Autocomplete, TextField } from '@mui/material';

const AdminCreateSetName = (props) => {
    const {show, setShow, editData, setEditData, handleSave, allData, ...rest} = props;

    const setName = (value) => {
        setEditData({...editData,  "name": value});
    }

    const setSetNumb = (setData) => {
        setEditData({...editData,  "set_id": setData.id});
    }

    const getSetNumb = (id) => {
        for (let i = 0; i < allData.sets.length; i++) {
            if (allData.sets[i].id === id) {
                return {
                    id: allData.sets[i].id, 
                    label: allData.sets[i].set_numb, 
                };
            }
        }
        return {
            id: -1, 
            label: "ERROR", 
        };
    }

    const getSetNumbs = () => {
        let output = [];

        for (let i = 0; i < allData.sets.length; i++) {
            output.push({
                id: allData.sets[i].id, 
                label: allData.sets[i].set_numb, 
            });
        }

        return output;
    }

    const getSectionName = (id) => {
        for(let i = 0; i < allData.sections.length; i++) {
            if (allData.sections[i].id === id) {
                return allData.sections[i].name;
            }
        }
        return "ERROR";
    }

    
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create Set Name</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FloatingLabel
                    controlId="floatingInput"
                    label="Name"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="Name" 
                        value={editData.name} 
                        onChange={(e) => setName(e.target.value)}
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingInput"
                    label="Section"
                    className="mb-3"
                >
                    <Form.Control 
                        type="text" 
                        placeholder="Section" 
                        value={getSectionName(editData.section_id)} 
                        onChange={(e) => setName(e.target.value)}
                        disabled
                    />
                </FloatingLabel>
                
                <Autocomplete
                                
                    options={getSetNumbs()}
                    sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                    renderInput={(params) => <TextField {...params} label="Set Number" />}
                    onChange={(event, newValue) => setSetNumb(newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={getSetNumb(editData.set_id)}
                    size="small"
                    

                />
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

export default AdminCreateSetName;