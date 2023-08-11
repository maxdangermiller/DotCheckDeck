import React, { useState, useEffect, useRef } from 'react'

const UserInfoDialogue = (props) => {
    const { displayUserInfo, canvasRef } = props

    if (!displayUserInfo.show) {
        return null;
    }

    let userName = displayUserInfo.dot.userName;
    let textColor = "black";
    if (userName === "") {
        userName = "Inactivated"
        textColor = "red";
    }

    let left = 0;
    let top = 0;
    if (canvasRef !== null) {
        top = canvasRef.current.offsetTop + 10;
        left = canvasRef.current.offsetLeft + 10;
    }
    

    return (
        <div 
            className='d-flex flex-column justify-content-center align-items-center'
            style={{
                position: "absolute", 
                top: top, 
                left: left, 
                backgroundColor: "lightgrey", 
                width: "20%", 
                aspectRatio:"2 / 1",
                borderRadius:"1rem",
                borderColor: "black",
                borderStyle: "solid",
                padding: 5
            }}
        >
            <h1 style={{fontFamily: "ArialBlack", fontSize: "100%"}}>{displayUserInfo.dot.userLabel}</h1>
            <h1 style={{fontFamily: "ArialBlack", fontSize: "100%", color: textColor}}>{userName}</h1>
        </div>
    );
}

export default UserInfoDialogue;