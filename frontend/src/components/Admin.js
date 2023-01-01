import React, { useState, useEffect, useRef } from 'react';
import AdminAccordionItem from './AdminComponents/AdminAccordionItem';

import './Admin.css';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const Admin = (props) => {
    const [accordionState, setAccordionState] = useState([]);

    const { schoolCode, token, ...rest } = props

    useEffect(() => {
		fetch(WINDOW_LOCATION + "/sets?school_code=" + schoolCode + "&token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
                    for (let i = 0; i < result.length; i++) {
                        let element = result[i];

                        element["open"] = false;  
                        
                        // Set up and format the time codes!

                        let start = element["start_time_code"]
                        if (start !== null) {
                            element["start_time_code"] = new Date(start * 1000).toISOString().slice(14, 19)
                        } else {
                            element["start_time_code"] = ""
                        }

                        let end = element["end_time_code"]
                        if (end !== null) {
                            element["end_time_code"] = new Date(end * 1000).toISOString().slice(14, 19)
                        } else {
                            element["end_time_code"] = ""
                        }
                    }

                    setAccordionState(result);
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
	}, [])

    return(
        <div className="flex-column justify-content-center d-flex align-items-center adminFullScreen">
            <h1 className="customHeader">Admin</h1>
            <div className="overflow-auto customOverflow">
                <div className="accordion customAccordion">
                    {
                        accordionState.map((accordionItem, index) => 
                            <AdminAccordionItem 
                                accordionItem={accordionItem} 
                                index={index} 
                                key={accordionItem.id}
                                accordionState={accordionState}
                                setAccordionState={setAccordionState}
                                token={token}
                            />
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Admin;