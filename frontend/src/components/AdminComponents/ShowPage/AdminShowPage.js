import React, { useState, useEffect, useRef } from 'react';
import AdminEditShow from './AdminEditShow';
import AdminAddPDF from './AdminAddPDF';
import getApi from '../../getApi';

const WINDOW_LOCATION = getApi();

const AdminShowPage = (props) => {
    const {token, shows, setShows, ...rest} = props;

    const [showEdit, setShowEdit] = useState(false);
    const [curEdit, setCurEdit] = useState({});
    const [showAddPDF, setShowAddPDF] = useState({});
    const [addPDFData, setAddPDFData] = useState({});

    const openEdit = (item) => {
        setCurEdit(item);
        setShowEdit(true);
    }

    const updateItem = (item) => {
        let newItems = JSON.parse(JSON.stringify(shows));

        for (let i = 0; i < newItems.length; i++) {
            let _item = newItems[i];

            if (_item.id === item.id) {
                newItems[i] = item;
                break;
            }

        }

        setShows(newItems);
    }

    const handleSave = (item) => {
        
        fetch(WINDOW_LOCATION + '/update-show', {
            method: 'POST',
            body: JSON.stringify(item),
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

                    updateItem(item);

                    alert(result)
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

    return (
        <div>
            {
                shows.map((show, index) => 
                    <div key={index}>
                        <h1 style={{fontSize: "8vh"}}><strong>{show.name}</strong></h1>
                        <div style={{fontSize: "6vh"}}><strong>Code: </strong>{show.code}</div>
                        <button className='btn btn-success' onClick={(e) => openEdit(show)}>Edit</button> 
                        <br></br>
                    </div>
                )
            }
            <AdminEditShow
                show={showEdit}
                setShow={setShowEdit}
                editData={curEdit}
                setEditData={setCurEdit}
                handleSave={handleSave}
                setShowAddPDF={setShowAddPDF}
                setAddPDFData={setAddPDFData}
            />
            <AdminAddPDF 
                show={showAddPDF}
                setShow={setShowAddPDF}
                editData={addPDFData}
                setEditData={setAddPDFData}
                token={token}
            />
            <button 
                className="btn btn-success" 
                style={{bottom: "1vh", left: "1vw", position: "absolute"}}
                onClick={() => {window.location.href = "/admin-create-show"}}
            >Create Show</button>
        </div>
    );
}

export default AdminShowPage;