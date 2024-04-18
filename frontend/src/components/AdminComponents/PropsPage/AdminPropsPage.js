import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import getApi from '../../utils/getApi';
import Boolean from '../Boolean';
import AdminAddProp from './AdminAddProp';
import AdminEditProp from './AdminEditProp';
import axios from "axios";

const WINDOW_LOCATION = getApi();
const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const SORT_ID = 0;
const SORT_LABEL = 1;
const SORT_IS_LOCKED = 2;
const SORT_IS_STATIONARY = 3;
const SORT_LOADED_DOTS = 4;

const SORT_UP = 1;
const SORT_DOWN = -1;

const AdminPropsPage = (_props) => {
    const {token, props, setProps, sets, showCode, ...rest} = _props;

    const [sortBy, setSortBy] = useState(0);
    const [sortDirection, setSortDirection] = useState(SORT_UP);
    const [showEdit, setShowEdit] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [curEdit, setCurEdit] = useState({});
    const [curNotes, setCurNotes] = useState("");

    const openEdit = (prop) => {
        setCurEdit(prop);
        setShowEdit(true);
    }
    
    const sort = (data) => {
        let useKey = "";

        if (sortBy === SORT_ID)     { useKey = "id";    }
        if (sortBy === SORT_LABEL)   { useKey = "label";  }
        if (sortBy === SORT_IS_LOCKED)  { useKey = "is_locked";  }
        if (sortBy === SORT_IS_STATIONARY)  { useKey = "is_stationary";  }
        if (sortBy === SORT_LOADED_DOTS)  { 
            return data.sort(function(a, b) {
                let keyA = convertIndicesListToRangeString(a.dots, sets);
                let keyB = convertIndicesListToRangeString(b.dots, sets);
    
                let oppDir = sortDirection === SORT_UP ? SORT_DOWN : SORT_UP;
    
                if (keyA < keyB) return oppDir;
                if (keyA > keyB) return sortDirection;
    
                return 0;
            });
        }

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

	const convertIndicesListToRangeString = (_dots, _sets) => {
		let curStartRange = -1;
		let string = "";

		for (let i = 0; i < _sets.length; i++) {
            let foundDot = false;
            for (let j = 0; j < _dots.length; j++) {
                if (_sets[i].id === _dots[j].set_id) {
                    if (curStartRange === -1) {
                        curStartRange = i;
                    }
                    foundDot = true;
                    break;
                }
            }

            if (!foundDot && curStartRange !== -1) {
                if (string === "") {
                    string = _sets[curStartRange].set_numb + "-" + _sets[i].set_numb;
                } else {
                    string = string + ", " + _sets[curStartRange].set_numb + "-" + _sets[i].set_numb;
                }
                curStartRange = -1;
            }
		} 

		if (curStartRange !== -1) {
			if (string === "") {
				string = _sets[curStartRange].set_numb + "-" + _sets[_sets.length - 1].set_numb;
			} else {
				string = string + ", " + _sets[curStartRange].set_numb + "-" + _sets[_sets.length - 1].set_numb;
			}
		}

		return string;
	}

    const expandToAllSets = (id) => {

        const formData = new FormData();

        formData.append('prop_id', id);

        axios({
            method: "POST",
            url: WINDOW_LOCATION + "/make-all-dots-for-prop-an-icon",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data",
                'Authorization': 'Bearer ' + token
            }
        }).then((response) => {
            window.location.reload();
        }).catch((error) => {
            if (error.response) {
                console.log(error.response)
                // console.log(error.response.status)
                // console.log(error.response.headers)
            }
        })
    }

    return(
        <>
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th onClick={() => handelHeaderClick(0)}>#</th>
                    <th onClick={() => handelHeaderClick(1)}>Label</th>
                    <th onClick={() => handelHeaderClick(2)}>Is Locked</th>
                    <th onClick={() => handelHeaderClick(3)}>Is Stationary</th>
                    <th onClick={() => handelHeaderClick(4)}># Dots</th>
                    <th onClick={() => handelHeaderClick(0)}>Image</th>
                    <th>Edit</th>
                    <th>Expand To All Sets</th>
                </tr>
            </thead>
            <tbody>
                {
                    sort(props).map((prop, index) => 
                        <tr key={index}>
                            <td><div className={CELL_STYLE}> {prop.id} </div></td>
                            <td><div className={CELL_STYLE}> {prop.label} </div></td>
                            <td><div className={CELL_STYLE}> <Boolean state={prop.is_locked}/> </div></td>
                            <td><div className={CELL_STYLE}> <Boolean state={prop.is_stationary}/> </div></td>
                            <td><div className={CELL_STYLE}> {convertIndicesListToRangeString(prop.dots, sets)} </div></td>
                            <td><div className={CELL_STYLE}> <img src={WINDOW_LOCATION + "/get-icon/" + prop.dots[0].dot_icon.id + "?token=" + token} alt="Image"  height={24}/> </div></td>
                            <td><div className={CELL_STYLE}>
                                {
                                    prop.is_stationary ?
                                    <button className='btn btn-success' onClick={(e) => openEdit(prop)}>Edit</button> 
                                    : null
                                }
                            </div></td>
                            <td><div className={CELL_STYLE}>
                                <button className='btn btn-success' onClick={(e) => expandToAllSets(prop.id)}>Expand</button> 
                            </div></td>
                        </tr> 
                )
                }
            </tbody>
        </Table>

        <AdminEditProp 
            show={showEdit}
            setShow={setShowEdit}
            token={token}
            prop={curEdit}
        />
        <AdminAddProp 
            show={showCreate}
            setShow={setShowCreate}
            token={token}
            showCode={showCode}
        />

        <button 
            className="btn btn-success" 
            style={{bottom: "1vh", left: "1vw", position: "absolute"}}
            onClick={() => setShowCreate(true)}
        >Create Prop</button>
        </>
    );
}

export default AdminPropsPage;