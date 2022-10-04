import React, { useState, useEffect, useRef } from 'react'

const OptionsDropDown = (props) => {

    const [dropDownOpen, setDropDownOpen] = useState(false);

    /*
    Multi-set Check box
    Draw Paths check box
    Show movement brackets (Showing movement from the hashes) - DISCOURAGED if you have many people selected
    Highlight User Dropdown
    */

    return (
        <div className="accordion" id="accordionPanelsStayOpenExample">
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
                            Test 12345
                        </div>
                    </div>
                    : null
                }
            </div>
        </div>
    );
};

export default OptionsDropDown;