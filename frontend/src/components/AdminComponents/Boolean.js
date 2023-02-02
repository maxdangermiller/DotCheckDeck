import React, { useState, useEffect, useRef } from 'react';

const Boolean = (props) => {
    const {state, ...rest} = props;
    
    if (state) {
        return (
            <i className="material-icons" style={{fontSize: "2rem", color: "green"}}>check_circle</i>
        );
    }

    return (
        <i className="material-icons" style={{fontSize: "2rem", color: "red"}}>cancel</i>
    );
}

export default Boolean;