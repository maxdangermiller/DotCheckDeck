import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import AdminEditSetName from './AdminEditSetName';
import AdminCreateSetName from './AdminCreateSetName';
import getApi from '../../getApi';

const WINDOW_LOCATION = getApi();
const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const SORT_ID = 0;
const SORT_SET_NUMB = 1;
const SORT_NAME = 2;

const SORT_UP = 1;
const SORT_DOWN = -1;

const AdminSetNamePage = (props) => {
    const {token, sections, setSections, allData, ...rest} = props;

    const [sortBy, setSortBy] = useState(1);
    const [sortDirection, setSortDirection] = useState(SORT_UP);
    const [showEdit, setShowEdit] = useState(false);
    const [curEdit, setCurEdit] = useState({});
    const [showCreate, setShowCreate] = useState(false);
    const [curCreate, setCurCreate] = useState({});

    const openEdit = (item) => {
        setCurEdit(item);
        setShowEdit(true);
    }

    const openCreate = (section) => {
        let item = {
            "name": "",
            "set_id": allData.sets[0].id,
            "section_id": section.id,
            "school_id": section.school_id,
            "show_id": section.show_id
        };
        setCurCreate(item);
        setShowCreate(true);
    }

    const updateItem = (item) => {
        let newSections = JSON.parse(JSON.stringify(sections));

        for (let i = 0; i < newSections.length; i++) {
            let section = newSections[i];
            let foundSetName = false;

            if (section.id === item.section_id) {
                for (let ii = 0; ii < section.set_names.length; ii++) {
                    if (section.set_names[ii].id === item.id) {
                        foundSetName = true;
                        newSections[i].set_names[ii] = item;
                    }
                }
                if (!foundSetName) {
                    newSections[i].set_names[newSections[i].set_names.length] = item;
                }
                break;
            }

        }

        setSections(newSections);
    }

    const handleSave = (setName) => {
        
        fetch(WINDOW_LOCATION + '/update-set-name-admin', {
            method: 'POST',
            body: JSON.stringify(setName),
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

                    updateItem(setName);
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

    const handleCreate = (setName) => {
        
        fetch(WINDOW_LOCATION + '/update-set-name-admin', {
            method: 'POST',
            body: JSON.stringify(setName),
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

                    updateItem(setName);
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

    const sort = (data) => {
        let useKey = "";

        if (sortBy === SORT_ID)     { useKey = "id";    }
        if (sortBy === SORT_SET_NUMB)   { useKey = "set_id";  }
        if (sortBy === SORT_NAME)  { useKey = "name";  }

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

    const getSetNumb = (setNameObj) => {
        for(let i = 0; i < allData.sets.length; i++) {
            if (setNameObj.set_id === allData.sets[i].id) {
                // console.log(allData.sets[i]);
                return allData.sets[i].set_numb;
            }
        }
        return "ERROR FINDING SET";
    }

    return(
        <>
        {
            sections.map((section, index) => 
                <div key={index}>
                <h1>{section.name}</h1>

                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th onClick={() => handelHeaderClick(0)}>#</th>
                            <th onClick={() => handelHeaderClick(1)}>Set Number</th>
                            <th onClick={() => handelHeaderClick(2)}>Set Name</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            sort(section.set_names).map((setName, index2) => 
                                <tr key={index2}>
                                    <td><div className={CELL_STYLE}> {setName.id} </div></td>
                                    <td><div className={CELL_STYLE}> {getSetNumb(setName)} </div></td>
                                    <td><div className={CELL_STYLE}> {setName.name} </div></td>
                                    <td><div className={CELL_STYLE}>
                                        <button className='btn btn-success' onClick={(e) => openEdit(setName)}>Edit</button> 
                                    </div></td>
                                </tr> 
                            )
                        }
                    </tbody>
                </Table>    
                <button className='btn btn-success' onClick={(e) => openCreate(section)}>Add</button>
            </div>
        )}
            <AdminEditSetName
                show={showEdit}
                setShow={setShowEdit}
                editData={curEdit}
                setEditData={setCurEdit}
                handleSave={handleSave}
            />
            <AdminCreateSetName 
                show={showCreate}
                setShow={setShowCreate}
                editData={curCreate}
                setEditData={setCurCreate}
                handleSave={handleCreate}
                allData={allData}
            />
        </>
    );
}

export default AdminSetNamePage;