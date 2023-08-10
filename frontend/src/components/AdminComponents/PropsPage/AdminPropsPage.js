import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import getApi from '../../getApi';
import Boolean from '../Boolean';

const WINDOW_LOCATION = getApi();
const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const SORT_ID = 0;
const SORT_MEASURE = 1;
const SORT_COUNTS = 2;
const SORT_T_COUNTS = 3;
const SORT_S_TIME = 4;
const SORT_E_TIME = 5;

const SORT_UP = 1;
const SORT_DOWN = -1;

const AdminPropsPage = (_props) => {
    const {token, props, setProps, sets, ...rest} = _props;

    const [sortBy, setSortBy] = useState(0);
    const [sortDirection, setSortDirection] = useState(SORT_UP);
    const [showEdit, setShowEdit] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [curEdit, setCurEdit] = useState({});
    const [curNotes, setCurNotes] = useState("");

    const openEdit = (set) => {
        setCurEdit(set);
        setShowEdit(true);
    }
    
    const openNotes = (set) => {
        setCurNotes(set.notes);
        setShowNotes(true);
    }

    const getOnlyPropShowUsers = (users) => {
        console.log(users)

        return [];
    }
    
    const sort = (data) => {
        let useKey = "";

        if (sortBy === SORT_ID)     { useKey = "id";    }
        if (sortBy === SORT_MEASURE)   { useKey = "measure";  }
        if (sortBy === SORT_COUNTS)  { useKey = "counts";  }
        if (sortBy === SORT_T_COUNTS)  { useKey = "total_counts";  }
        if (sortBy === SORT_S_TIME)  { useKey = "start_time_code";  }
        if (sortBy === SORT_E_TIME)  { useKey = "end_time_code";  }

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

    return(
        <>
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th onClick={() => handelHeaderClick(0)}>#</th>
                    <th onClick={() => handelHeaderClick(1)}>Label</th>
                    <th onClick={() => handelHeaderClick(1)}>Is Locked</th>
                    <th onClick={() => handelHeaderClick(2)}>Is Stationary</th>
                    <th onClick={() => handelHeaderClick(2)}># Dots</th>
                    <th>Edit</th>
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
                            <td><div className={CELL_STYLE}>
                                <button className='btn btn-success' onClick={(e) => openEdit(prop)}>Edit</button> 
                            </div></td>
                        </tr> 
                )
                }
            </tbody>
        </Table>
        <button 
            className="btn btn-success" 
            style={{bottom: "1vh", left: "1vw", position: "absolute"}}
            onClick={() => window.location.href = "/admin-add-prop"}
        >Create Prop</button>
        </>
    );
}

export default AdminPropsPage;