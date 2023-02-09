import React, { useState, useEffect, useRef } from 'react';
import AdminAccordionItem from './AdminComponents/AdminAccordionItem';
import AdminUsersPage from './AdminComponents/UserPage/AdminUsersPage';
import AdminSectionsPage from './AdminComponents/SectionPage/AdminSectionsPage';

import './Admin.css';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const Admin = (props) => {
    const [data, setData] = useState({"school": {}, "sections": [], "sets": [], "shows": [], "users": []});
    const [menuIndex, setMenuIndex] = useState(0);

    const { schoolCode, token, ...rest } = props

    const getActivePage = () => {
        if (menuIndex === 0) {
            return (<AdminUsersPage token={token} users={data.users} sections={data.sections} shows={data.shows}/>);
        }
        if (menuIndex === 1) {
            return (<AdminSectionsPage token={token} sections={data.sections}/>);
        }
        return null;
    }

    useEffect(() => {
		fetch(WINDOW_LOCATION + "/get-all?token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
                    console.log(result);
                    setData(result);
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
	}, [])

    const getActiveClassName = (target) => {
        if (menuIndex == target) {
            return "nav-link active";
        }
        return "nav-link";
    }


    return(
        <div className="flex-column justify-content-center d-flex align-items-center adminFullScreen">
            <h1 className="customHeader">Admin</h1>

            <div className="flex-row justify-content-center d-flex align-items-center adminContentHolder">
                <div className="adminContentSideBar">
                    <nav className="h-100 flex-column align-items-stretch pe-4 border-end">
                        <nav className="nav nav-pills flex-column">
                            <a className={getActiveClassName(0)} onClick={(e) => setMenuIndex(0)}>Users</a>
                            <a className={getActiveClassName(1)} onClick={(e) => setMenuIndex(1)}>Sections</a>
                            <a className={getActiveClassName(2)} onClick={(e) => setMenuIndex(2)}>Set Names</a>
                            <a className={getActiveClassName(3)} onClick={(e) => setMenuIndex(3)}>Show Settings</a>
                            <a className={getActiveClassName(4)} onClick={(e) => setMenuIndex(4)}>School Settings</a>
                           
                        </nav>
                    </nav>
                </div>
                <div className="adminContentPage">
                    {getActivePage()}
                </div>
            </div>
        </div>
    );
};

export default Admin;