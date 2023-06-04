import React, { useState, useEffect, useRef } from 'react';

const AdminShowPage = (props) => {
    const {token, shows, setShows, ...rest} = props;

    return (
        <div>
            {
                shows.map((show, index) => 
                    <div key={index}>
                        <h1 style={{fontSize: "8vh"}}><strong>{show.name}</strong></h1>
                        <div style={{fontSize: "6vh"}}><strong>Code: </strong>{show.code}</div>
                        <br></br>
                    </div>
                )
            }
        </div>
    );
}

export default AdminShowPage;