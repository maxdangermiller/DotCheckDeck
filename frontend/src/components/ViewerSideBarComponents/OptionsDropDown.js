import React, { useState, useEffect, useRef } from 'react'
import { Autocomplete, TextField } from '@mui/material';

const OptionsDropDown = (props) => {

    const [dropDownOpen, setDropDownOpen] = useState(false);

    const { userOptions, setUserOptions, data, curSet, ...rest } = props

    /*
    Multi-set Check box
    Draw Paths check box
    Show movement brackets (Showing movement from the hashes) - DISCOURAGED if you have many people selected
    Highlight User Dropdown
    */

    const setMultiSelect = (value) => {
        setUserOptions({...userOptions,  "multiSelect": value});
    }

    const setDrawPaths = (value) => {
        setUserOptions({...userOptions,  "drawPath": value});
    }

    const seUseSectionColors = (value) => {
        setUserOptions({...userOptions,  "useSectionColors": value});
    }

    const setShowMovementBrackets = (value) => {
        setUserOptions({...userOptions,  "showMovementBrackets": value});
    }

    const setHighlightUser = (value) => {
        setUserOptions({...userOptions,  "highlightUser": value});
    }

    const getUserOptions = (value, set_numb) => {

        if (value[set_numb] === undefined) { return []; }

        let output = [];

        let dots = value[set_numb].dots;

        for (let x = 0; x < dots.length; x++) {
            output.push({
                id: dots[x].userID, 
                label: dots[x].userLabel, 
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
        <div className="accordion" style={{width: '90%'}}>
            <div className="overflow-auto" style={{height: '40vh'}}>
            <div className="accordion-item">
                <h2 className="accordion-header">
                    <button 
                        className={dropDownOpen ? "accordion-button" : "accordion-button collapsed"} 
                        type="button" 
                        onClick={(e) => setDropDownOpen(!dropDownOpen)}
                    >
                        Options
                    </button>
                </h2>
                {
                    dropDownOpen ?
                    <div className="accordion-collapse collapse show">
                        <div className="accordion-body">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" value="" onChange={() => setMultiSelect(!userOptions.multiSelect)} checked={userOptions.multiSelect} />
                                <label className="form-check-label ">
                                    Enable Multi-Select
                                </label>
                            </div>
                            <div className="form-check">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    value="" 
                                    onChange={() => setDrawPaths(!userOptions.drawPath)} 
                                    checked={userOptions.drawPath} 
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
                                    onChange={() => setShowMovementBrackets(!userOptions.showMovementBrackets)} 
                                    checked={userOptions.showMovementBrackets} 
                                    disabled={userOptions.highlightUser === null}
                                />
                                <label className="form-check-label ">
                                    Show Movement Brackets
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
                        </div>
                    </div>
                    : null
                }
            </div>
            </div>
        </div>
    );
};

export default OptionsDropDown;