import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';
import getApi from '../../utils/getApi';

import AdminViewSetNotes from './AdminViewSetNotes';
import AdminEditSet from './AdminEditSet';

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

const AdminSetsPage = (props) => {
    const {token, sets, setSets} = props;

    const [sortBy, setSortBy] = useState(0);
    const [sortDirection, setSortDirection] = useState(SORT_UP);
    const [showEdit, setShowEdit] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
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

    const updateSet = (set) => {
        let newSets = JSON.parse(JSON.stringify(sets));
        let found = false;

        for (let i = 0; i < newSets.length; i++) {
            if (newSets[i].id === set.id) {
                for (const key in newSets[i]) {
                    newSets[i][key] = set[key];
                }
                found = true;
            }
        }

        if (!found) {
            newSets[newSets.length] = set;
        }

        setSets(newSets);
    }

    const handleSave = (set) => {
        try {
            fetch(WINDOW_LOCATION + '/update-set', {
                method: 'POST',
                body: JSON.stringify(set),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + token
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        console.log(result)
                        setShowEdit(false);
    
                        updateSet(set);
                    },
                    // Note: it's important to handle errors here
                    // instead of a catch() block so that we don't swallow
                    // exceptions from actual bugs in components.
                    (error) => {
                        console.log(error);
                        alert(error)
                    }
                );
        } catch (error) {
            console.log("ERROR " + error);
        }
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

    return(
        <>
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th onClick={() => handelHeaderClick(0)}>#</th>
                    <th onClick={() => handelHeaderClick(1)}>Measure</th>
                    <th onClick={() => handelHeaderClick(2)}>Counts</th>
                    <th onClick={() => handelHeaderClick(3)}>Total Counts</th>
                    <th onClick={() => handelHeaderClick(4)}>Start Time</th>
                    <th onClick={() => handelHeaderClick(5)}>End Time</th>
                    <th>Notes</th>
                    <th>Edit</th>
                </tr>
            </thead>
            <tbody>
                {
                    sort(sets).map((set, index) => 
                        <tr key={index}>
                            <td><div className={CELL_STYLE}> {set.set_numb} </div></td>
                            <td><div className={CELL_STYLE}> {set.measure} </div></td>
                            <td><div className={CELL_STYLE}> {set.counts} </div></td>
                            <td><div className={CELL_STYLE}> {set.total_counts} </div></td>
                            <td><div className={CELL_STYLE}> {set.start_time_code} </div></td>
                            <td><div className={CELL_STYLE}> {set.end_time_code} </div></td>
                            <td><div className={CELL_STYLE}>
                                <button className='btn btn-primary' onClick={(e) => openNotes(set)} disabled={set.notes === null || set.notes === ""}>Open</button> 
                            </div></td>
                            <td><div className={CELL_STYLE}>
                                <button className='btn btn-success' onClick={(e) => openEdit(set)}>Edit</button> 
                            </div></td>
                        </tr> 
                )
                }
            </tbody>

            <AdminViewSetNotes 
                show={showNotes}
                setShow={setShowNotes}
                notes={curNotes}
            />
            <AdminEditSet 
                show={showEdit}
                setShow={setShowEdit}
                editData={curEdit}
                setEditData={setCurEdit}
                handleSave={handleSave}
            />
        </Table>
        </>
    );
}

export default AdminSetsPage;