import React, { useState, useEffect, useRef } from 'react';
import AdminAccordionItem from './AdminComponents/AdminAccordionItem';

import './Admin.css';

const Admin = (props) => {
    const [accordionState, setAccordionState] = useState([]);

    const { schoolCode, token, ...rest } = props

    const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

    useEffect(() => {
		fetch(WINDOW_LOCATION + "/sets?school_code=" + schoolCode + "&token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
                    for (let i = 0; i < result.length; i++) {
                        let element = result[i];

                        element["open"] = false;  
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
        <div className="flex-column justify-content-center d-flex align-items-center fullScreen">
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
                            />
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Admin;