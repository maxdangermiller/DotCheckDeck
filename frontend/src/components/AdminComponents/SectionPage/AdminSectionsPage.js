import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import AdminEditSection from './AdminEditSection';
import AdminCreateSection from './AdminCreateSection';
import getApi from '../../getApi';

const WINDOW_LOCATION = getApi();
const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const SORT_ID = 0;
const SORT_NAME = 1;
const SORT_COLOR = 2;

const SORT_UP = 1;
const SORT_DOWN = -1;

const AdminSectionsPage = (props) => {
    const {token, sections, setSections, ...rest} = props;

    const [sortBy, setSortBy] = useState(0);
    const [sortDirection, setSortDirection] = useState(SORT_UP);
    const [showEdit, setShowEdit] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [curEditSection, setCurEditSection] = useState({});

    const openEditSection = (section) => {
        setCurEditSection(section);
        setShowEdit(true);
    }

    const updateSection = (section) => {
        let newSections = JSON.parse(JSON.stringify(sections));
        let found = false;

        for (let i = 0; i < newSections.length; i++) {
            if (newSections[i].id === section.id) {
                for (const key in newSections[i]) {
                    newSections[i][key] = section[key];
                }
                found = true;
            }
        }

        if (!found) {
            newSections[newSections.length] = section;
        }

        setSections(newSections);
    }

    const handleSave = (section) => {
        fetch(WINDOW_LOCATION + '/update-section', {
            method: 'POST',
            body: JSON.stringify(section),
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

                    updateSection(section);
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

    const getColor = (section) => {
        return "rgb(" + section.color_r + "," + section.color_g + "," + section.color_b + ")";
    }


    const sort = (data) => {
        let useKey = "";

        if (sortBy === SORT_ID)     { useKey = "id";    }
        if (sortBy === SORT_NAME)   { useKey = "name";  }
        if (sortBy === SORT_COLOR)  { useKey = "name";  }

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
                    <th onClick={() => handelHeaderClick(1)}>Name</th>
                    <th onClick={() => handelHeaderClick(2)}>Color</th>
                    <th>Edit</th>
                </tr>
            </thead>
            <tbody>
                {
                    sort(sections).map((section, index) => 
                        <tr key={index}>
                            <td><div className={CELL_STYLE}> {section.id} </div></td>
                            <td><div className={CELL_STYLE}> {section.name} </div></td>
                            <td style={{backgroundColor: getColor(section)}}></td>
                            <td><div className={CELL_STYLE}>
                                <button className='btn btn-success' onClick={(e) => openEditSection(section)}>Edit</button> 
                            </div></td>
                        </tr> 
                )
                }
            </tbody>

            <AdminEditSection
                show={showEdit}
                setShow={setShowEdit}
                editData={curEditSection}
                setEditData={setCurEditSection}
                handleSave={handleSave}
            />
            <AdminCreateSection 
                show={showCreate}
                setShow={setShowCreate}
                token={token}
                handleSave={handleSave}
            />
        </Table>
        <button 
            className="btn btn-success" 
            style={{bottom: "1vh", left: "1vw", position: "absolute"}}
            onClick={() => setShowCreate(true)}
        >Create Section</button>
        </>
    );
}

export default AdminSectionsPage;