import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import Boolean from './Boolean';
import AdminEditUser from './AdminEditUser';
import AdminEditShowUser from './AdminEditShowUser';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const AdminUsersPage = (props) => {

    const [showEditUser, setShowEditUser] = useState(false);
    const [showEditShowUser, setShowEditShowUser] = useState(false);
    const [editUserData, setEditUserData] = useState({});

    const {token, users, sections, ...rest} = props;

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

    }


    return(
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Labels</th>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Is Admin</th>
                    <th>Activated Date</th>
                    <th>Created Date</th>
                    <th>Last Updated</th>
                    <th>Edit</th>
                    <th>Edit Show Users</th>
                </tr>
            </thead>
            <tbody>
                {
                    users.map((user, index) => 
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