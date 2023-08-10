import React, { useState, useEffect, useRef } from 'react';
import AdminAccordionItem from './AdminComponents/AdminAccordionItem';
import AdminUsersPage from './AdminComponents/UserPage/AdminUsersPage';
import AdminSectionsPage from './AdminComponents/SectionPage/AdminSectionsPage';
import AdminSetNamePage from './AdminComponents/SetNamePage/AdminSetNamePage';
import AdminShowPage from './AdminComponents/ShowPage/AdminShowPage';
import AdminSetsPage from './AdminComponents/SetPage/AdminSetsPage';
import AdminPropsPage from './AdminComponents/PropsPage/AdminPropsPage';
import getApi from './getApi';

import './Admin.css';

const WINDOW_LOCATION = getApi();

const Admin = (props) => {
    const [data, setData] = useState({"school": {}, "sections": [], "sets": [], "shows": [], "users": [], "prop_show_users": [], "default_show": {}});
    const [menuIndex, setMenuIndex] = useState(0);

    const { schoolCode, token, ...rest } = props

    const getActivePage = () => {
        console.log(data);
        if (menuIndex === 0) {
            return (<AdminUsersPage token={token} users={data.users} sections={data.sections} shows={data.shows} setUsers={setUsers}/>);
        }
        if (menuIndex === 1) {
            return (<AdminSectionsPage token={token} sections={data.sections} setSections={setSections}/>);

        }
        if (menuIndex === 2) {
            return (<AdminSetNamePage token={token} sections={data.sections} setSections={setSections} allData={data}/>);

        }
        if (menuIndex === 3) {
            return (<AdminSetsPage token={token} sets={data.sets} setSets={setSets} />);

        }
        if (menuIndex === 4) {
            return (<AdminPropsPage  token={token} props={data.prop_show_users} setProps={setProps} sets={data.sets} showCode={data.default_show.code}/>);

        }
        if (menuIndex === 5) {
            return (<AdminShowPage token={token} shows={data.shows} setShows={setShows}/>);

        }
        return null;
    }

    const setUsers = (users) => {
        setData({...data, "users": users})
    }

    const setSections = (sections) => {
        setData({...data, "sections": sections})
    }

    const setSets = (sections) => {
        setData({...data, "sets": sections})
    }

    const setProps = (props) => {
        setData({...data, "prop_show_users": props})
    }

    const setShows = (shows) => {
        setData({...data, "shows": shows})
    }

    useEffect(() => {
		fetch(WINDOW_LOCATION + "/get-all?token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
                    console.log(result);
                    if (result === "NO SHOWS") {
                        window.location.href = "admin-create-show";
                    } else {
                        setData(result);
                    }
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
                    if (error === "NO SHOWS") {
                        window.location.href = "admin-create-show";
                    }
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
                            <a className={getActiveClassName(3)} onClick={(e) => setMenuIndex(3)}>Sets</a>
                            <a className={getActiveClassName(4)} onClick={(e) => setMenuIndex(4)}>Props</a>
                            <a className={getActiveClassName(5)} onClick={(e) => setMenuIndex(5)}>Show Settings</a>
                            <a className={getActiveClassName(6)} onClick={(e) => setMenuIndex(6)}>School Settings</a>
                           
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