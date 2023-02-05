import React, { useState, useEffect, useRef } from 'react';
import Table from 'react-bootstrap/Table';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";
const CELL_STYLE = "flex-row justify-content-center d-flex align-items-center adminTextAlignCenter";

const SORT_ID = 0;
const SORT_NAME = 1;
const SORT_COLOR = 2;

const SORT_UP = 1;
const SORT_DOWN = -1;

const AdminSectionsPage = (props) => {
    const {token, sections, ...rest} = props;

    const [sortBy, setSortBy] = useState(0);
    const [sortDirection, setSortDirection] = useState(SORT_UP);

    const openEditSection = (section) => {

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
        </Table>
    );
}

export default AdminSectionsPage;