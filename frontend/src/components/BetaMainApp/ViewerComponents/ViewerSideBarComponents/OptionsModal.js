import React from 'react';
import {Modal, Button} from 'react-bootstrap/';
import { Autocomplete, TextField } from '@mui/material';

const OptionsModal = (props) => {
    const {show, setShow, userOptions, setUserOptions, data, curSet, ...rest} = props;

    const setShowNextSet = (value) => {
        setUserOptions({...userOptions,  "showNextSet": value});
    }

    const setShowLastSet = (value) => {
        setUserOptions({...userOptions,  "showLastSet": value});
    }

    const setShowCollegeHash = (value) => {
        setUserOptions({...userOptions,  "showCollegeHash": value});
    }

    const setDrawPaths = (value) => {
        setUserOptions({...userOptions,  "drawPath": value});
    }

    const seUseSectionColors = (value) => {
        setUserOptions({...userOptions,  "useSectionColors": value});
    }

    const setHighlightSection = (value) => {
        setUserOptions({...userOptions,  "highlightSection": value});
    }

    const setShowMovementBrackets = (value) => {
        setUserOptions({...userOptions,  "showMovementBrackets": value});
    }
    

    const setUseCollegeHash = (value) => {
        setUserOptions({...userOptions,  "useCollegeHash": value});
    }

    const setUseActualSetLength = (value) => {
        setUserOptions({...userOptions,  "useActualSetLength": value});
    }

    const setHighlightUser = (value) => {
        setUserOptions({...userOptions,  "highlightUser": value});
    }

    const setDimOtherUsers = (value) => {
        setUserOptions({...userOptions,  "dimOtherUsers": value});
    }

    const getUserOptions = (_data, set_numb) => {

        if (_data[set_numb] === undefined) { return []; }

        let output = [];

        console.log(_data)

        for (let x = 0; x < _data.length; x++) {
            if (!_data[x]["show_user"]["is_locked"] && _data[x]["label"] !== null) {
                output.push({
                    id: _data[x]["show_user"]["is_locked"],
                    label: _data[x]["label"] 
                });
            }
        }


        return output.sort(function(a, b) {
            try {
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
            } catch (error) {
                console.log(output);
                console.log(a, b);
                console.log(error);
            }

            return 0;
        });

    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => seUseSectionColors(!userOptions.useSectionColors)} 
                        checked={userOptions.useSectionColors} 
                    />
                    <label className="form-check-label ">
                        Use Section Colors
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setShowCollegeHash(!userOptions.showCollegeHash)} 
                        checked={userOptions.showCollegeHash} 
                    />
                    <label className="form-check-label ">
                        Show College Hash
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setShowMovementBrackets(!userOptions.showMovementBrackets)} 
                        checked={userOptions.showMovementBrackets} 
                        disabled={userOptions.highlightUser === null}
                    />
                    <label className="form-check-label ">
                        Show Movement Brackets
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setUseCollegeHash(!userOptions.useCollegeHash)} 
                        checked={userOptions.useCollegeHash} 
                        disabled={userOptions.highlightUser === null}
                    />
                    <label className="form-check-label ">
                        Use College Hash
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setShowNextSet(!userOptions.showNextSet)} 
                        checked={userOptions.showNextSet} 
                        disabled={userOptions.highlightUser === null}
                    />
                    <label className="form-check-label ">
                        Show Next Set
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setShowLastSet(!userOptions.showLastSet)} 
                        checked={userOptions.showLastSet} 
                        disabled={userOptions.highlightUser === null}
                    />
                    <label className="form-check-label ">
                        Show Last Set
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setDrawPaths(!userOptions.drawPath)} 
                        checked={userOptions.drawPath} 
                        disabled={userOptions.highlightUser === null || !userOptions.showLastSet && !userOptions.showNextSet}
                    />
                    <label className="form-check-label">
                        Draw Paths
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setDimOtherUsers(!userOptions.dimOtherUsers)} 
                        checked={userOptions.dimOtherUsers} 
                        disabled={userOptions.highlightUser === null || userOptions.highlightSection}
                    />
                    <label className="form-check-label">
                        Highlight User
                    </label>
                </div>
                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value="" 
                        onChange={() => setHighlightSection(!userOptions.highlightSection)} 
                        checked={userOptions.highlightSection} 
                        disabled={userOptions.highlightUser === null || userOptions.dimOtherUsers}
                    />
                    <label className="form-check-label ">
                        Highlight Section
                    </label>
                </div>

                <Autocomplete

                    options={getUserOptions(data, curSet)}
                    sx={{ width: "100%", paddingTop: "1vh", paddingBottom: "1vh" }}
                    renderInput={(params) => <TextField {...params} label="Select Your Label" />}
                    onChange={(event, newValue) => setHighlightUser(newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={userOptions.highlightUser}
                    size="small"


                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default OptionsModal;