import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import Boolean from './Boolean';
import AdminEditUser from './AdminEditUser';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const AdminUsersPage = (props) => {

    const [users, setUsers] = useState([]);
    const [show, setShow] = useState(false);
    const [editUserData, setEditUserData] = useState({});

    const {token, ...rest} = props;

    useEffect(() => {
		fetch(WINDOW_LOCATION + "/users/get-all?token=" + token)
			.then(res => res.json())
			.then(
				(result) => {
                    console.log(result);
                    setUsers(result);
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
	}, [])

    const dateTimeFormat = (dateTime) => {
        if (dateTime == null) { return ""; }
        let date = new Date(Date.parse(dateTime));

        return date.toDateString();
    }

    const showEditUser = (user) => {
        setEditUserData(user);
        setShow(true);
    }

    const showEditShowUser = (user) => {

    }

    const getAllShowUserLabels = (user) => {
        let out = "";

        for (let i = 0; i < user.show_users.length; i++) {
            out = out + user.show_users[i].label;
            if (i != user.show_users.length - 1) { out += ", " }
        }

        return out;
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
                                <button className='btn btn-success' onClick={(e) => showEditUser(user)}>Edit</button> 
                            </div></td>
                            <td><div className={CELL_STYLE}> 
                                <button className='btn btn-primary' onClick={(e) => showEditShowUser(user)}>Edit</button> 
                            </div></td>
                        </tr> 
                )
                }
                <AdminEditUser show={show} setShow={setShow} editUserData={editUserData} setEditUserData={setEditUserData}/>
            </tbody>
        </Table>
    );
};

export default AdminUsersPage;