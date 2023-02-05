import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import Boolean from '../Boolean';
import AdminEditUser from './AdminEditUser';
import AdminEditShowUser from './AdminEditShowUser';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const SORT_ID = 0;
const SORT_LABEL = 1;
const SORT_EMAIL = 2;
const SORT_FIRST_NAME = 3;
const SORT_LAST_NAME = 4;
const SORT_IS_ADMIN = 5;
const SORT_ACTIVATED_DATE = 6;
const SORT_CREATED_DATE = 7;
const SORT_UPDATED_DATE = 8;
const SORT_UP = 1;
const SORT_DOWN = -1;

const AdminUsersPage = (props) => {
    const {token, users, sections, ...rest} = props;

    const [showEditUser, setShowEditUser] = useState(false);
    const [showEditShowUser, setShowEditShowUser] = useState(false);
    const [editUserData, setEditUserData] = useState({});
    const [sortBy, setSortBy] = useState(0);
    const [sortDirection, setSortDirection] = useState(SORT_UP);


    const dateTimeFormat = (dateTime) => {
        if (dateTime == null) { return ""; }
        let date = new Date(Date.parse(dateTime));

        return date.toDateString();
    }

    const openEditUser = (user) => {
        // "JSON.parse(JSON.stringify(person))" Are there for deep copying 
        setEditUserData(JSON.parse(JSON.stringify(user)));
        setShowEditUser(true);
        setShowEditShowUser(false);
    }

    const openEditShowUser = (user) => {
        // "JSON.parse(JSON.stringify(person))" Are there for deep copying 
        setEditUserData(JSON.parse(JSON.stringify(user)));
        setShowEditUser(false);
        setShowEditShowUser(true);
    }

    const getAllShowUserLabels = (user) => {
        let out = "";

        for (let i = 0; i < user.show_users.length; i++) {
            out = out + user.show_users[i].label;
            if (i != user.show_users.length - 1) { out += ", " }
        }

        return out;
    }

    const handleSave = (userData) => {
        fetch(WINDOW_LOCATION + '/users', {
            method: 'POST',
            body: JSON.stringify(userData),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + token
            }
            })
            .then(res => res.json())
            .then(
                (result) => {
                    setShowEditShowUser(false);
                    setEditUserData(false);
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.log(error);
                    alert(error)
                }
            );
    }

    const sortLabels = (data) => {
        return data.sort(function(a, b) {
            let keyA = getAllShowUserLabels(a).match(/(\d+)/);
            let keyB = getAllShowUserLabels(b).match(/(\d+)/);
            let keyAPrefix = getAllShowUserLabels(a).replace(/[0-9]/g, '');
            let keyBPrefix = getAllShowUserLabels(b).replace(/[0-9]/g, '');
            
            let oppDir = sortDirection === SORT_UP ? SORT_DOWN : SORT_UP;

            // Compare the letter "prefixes" first
            if (keyAPrefix < keyBPrefix) return sortDirection;
            if (keyAPrefix > keyBPrefix) return oppDir;

            // Compare the numbers
            if (parseInt(keyA) < parseInt(keyB)) return sortDirection;
            if (parseInt(keyA) > parseInt(keyB)) return oppDir;

            return 0;
        });
    }

    const sort = (data) => {
        if (sortBy === SORT_LABEL) { return sortLabels(data); }
        
        let useKey = "";

        if (sortBy === SORT_ID)             { useKey = "id";            }
        if (sortBy === SORT_EMAIL)          { useKey = "email";         }
        if (sortBy === SORT_FIRST_NAME)     { useKey = "first_name";    }
        if (sortBy === SORT_LAST_NAME)      { useKey = "last_name";     }
        if (sortBy === SORT_IS_ADMIN)       { useKey = "is_admin";      }
        if (sortBy === SORT_ACTIVATED_DATE) { useKey = "activated_date";}
        if (sortBy === SORT_CREATED_DATE)   { useKey = "created_date";  }
        if (sortBy === SORT_UPDATED_DATE)   { useKey = "last_updated";  }

        return data.sort(function(a, b) {
            let keyA = a[useKey] !== null ? a[useKey] : "";
            let keyB = b[useKey] !== null ? b[useKey] : "";

            let oppDir = sortDirection === SORT_UP ? SORT_DOWN : SORT_UP;
            if (keyA < keyB) return oppDir;
            if (keyA > keyB) return sortDirection;

            return 0;
        });
    }

    const handelHeaderClick = (id) => {
        if (id !== sortBy){
            setSortBy(id);
            setSortDirection(SORT_DOWN);
        } else {
            setSortDirection(sortDirection === SORT_UP ? SORT_DOWN : SORT_UP);
        }

    }


    return(
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th onClick={() => handelHeaderClick(0)}>#</th>
                    <th onClick={() => handelHeaderClick(1)}>Labels</th>
                    <th onClick={() => handelHeaderClick(2)}>Email</th>
                    <th onClick={() => handelHeaderClick(3)}>First Name</th>
                    <th onClick={() => handelHeaderClick(4)}>Last Name</th>
                    <th onClick={() => handelHeaderClick(5)}>Is Admin</th>
                    <th onClick={() => handelHeaderClick(6)}>Activated Date</th>
                    <th onClick={() => handelHeaderClick(7)}>Created Date</th>
                    <th onClick={() => handelHeaderClick(8)}>Last Updated</th>
                    <th>Edit</th>
                    <th>Edit Show Users</th>
                </tr>
            </thead>
            <tbody>
                {
                    sort(users).map((user, index) => 
                        <tr key={index}>
                            <td><div className={CELL_STYLE}> {user.id} </div></td>
                            <td><div className={CELL_STYLE}> {getAllShowUserLabels(user)} </div></td>
                            <td><div className={CELL_STYLE}> {user.email} </div></td>
                            <td><div className={CELL_STYLE}> {user.first_name} </div></td>
                            <td><div className={CELL_STYLE}> {user.last_name} </div></td>
                            <td><div className={CELL_STYLE}> <Boolean state={user.is_admin}/> </div></td>
                            <td><div className={CELL_STYLE}> {dateTimeFormat(user.activated_date)} </div></td>
                            <td><div className={CELL_STYLE}> {dateTimeFormat(user.created_date)} </div></td>
                            <td><div className={CELL_STYLE}> {dateTimeFormat(user.last_updated)} </div></td>
                            <td><div className={CELL_STYLE}>
                                <button className='btn btn-success' onClick={(e) => openEditUser(user)}>Edit</button> 
                            </div></td>
                            <td><div className={CELL_STYLE}> 
                                <button className='btn btn-primary' onClick={(e) => openEditShowUser(user)}>Edit</button> 
                            </div></td>
                        </tr> 
                )
                }
                
                <AdminEditUser 
                    showEditUser={showEditUser} 
                    setShowEditUser={setShowEditUser} 
                    editUserData={editUserData} 
                    setEditUserData={setEditUserData}
                    handleSave={handleSave}
                />
                <AdminEditShowUser 
                    showEditShowUser={showEditShowUser} 
                    setShowEditShowUser={setShowEditShowUser} 
                    editUserData={editUserData} 
                    setEditUserData={setEditUserData}
                    sections={sections}
                    handleSave={handleSave}
                />
            </tbody>
        </Table>
    );
};

export default AdminUsersPage;