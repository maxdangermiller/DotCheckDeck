import React, { useState, useEffect } from 'react';
import {Modal, Button} from 'react-bootstrap/';
import { Autocomplete, TextField } from '@mui/material';
import getApi from './getApi';

const WINDOW_LOCATION = getApi();

const UserSectionSelection = (props) => {
    const {schoolCode, token, userData, showID} = props;

    const [show, setShow] = useState(true);
    const [sections, setSections] = useState(null);
    const [section, setSection] = useState(null);

    const handleClose = () => setShow(false);

    useEffect(() => {
        // console.log(getShowUser())
        if (getShowUser() === undefined || getShowUser().section_id !== null) {
            setShow(false);
            return;
        }
        // Check if this is an admin, or a user that's doesn't have a show user
        if (userData.show_users.length === 0) {
            setShow(false);
            return;
        }

        setShow(true);

        try {
            fetch(WINDOW_LOCATION + "/get-sections?token=" + token + "&school_code=" + schoolCode)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('INVALID SCHOOL CODE');
                }
                return response.json();
            })
            .then((data) => {
                // console.log(data);
                setSections(data);
            })
            .catch((error) => {
                alert(error);
            });
        } catch (error) {
            console.log("ERROR " + error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, showID]);

    const getShowUser = () => {
        // console.log(showID)
        try {
            for (let i = 0; i < userData.show_users.length; i++) {
                if (userData.show_users[i].show_id === showID) {
                    // console.log(userData.show_users[i])
                    return userData.show_users[i];
                }
            }
        } catch (error) {
            
        }
        return undefined;
    }

    const update = () => {
        if (section.id === null || section.id === undefined) { return; }
        if (getShowUser() === undefined) { return; }
        try {
            fetch(WINDOW_LOCATION + '/update-user-section', {
                method: 'POST',
                body: JSON.stringify({
                    id: getShowUser().id,
                    section_id: section.id
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + token
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        console.log(result)
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

    const getSectionOptions = () => {
        if (sections === null || sections.length === 0) { return []; }

        let output = [];

        for (let x = 0; x < sections.length; x++) {
            output.push({
                id: sections[x].id, 
                label: sections[x].name, 
            });
            
        }

        return output.sort(function(a, b) {
            let keyA = a["label"].match(/(\d+)/);
            let keyB = b["label"].match(/(\d+)/);
            let keyAPrefix = a["label"].replace(/[0-9]/g, '');
            let keyBPrefix = b["label"].replace(/[0-9]/g, '');

            // Compare the letter "prefixes" first
            if (keyAPrefix < keyBPrefix) return -1;
            if (keyAPrefix > keyBPrefix) return 1;

            // Compare the numbers
            if (parseInt(keyA) < parseInt(keyB)) return -1;
            if (parseInt(keyA) > parseInt(keyB)) return 1;

            return 0;
        });
          
    }
    
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Help us out! Tell us what section you belong to!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Autocomplete
                    
                    options={getSectionOptions()}
                    sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                    renderInput={(params) => <TextField {...params} label="Select Your Section" />}
                    onChange={(event, newValue) => setSection(newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={section}
                    size="small"
                    

                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={update}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default UserSectionSelection;