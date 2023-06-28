import React, { useState, useEffect, useRef } from 'react'
import {Modal, Button, ListGroup} from 'react-bootstrap/';
import DCD_Add_To_Home_Screen from '../DCD_Add_To_Home_Screen.gif';

const PWAInstructions = (props) => {
    const [show, setShow] = useState(true);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <Modal show={show} onHide={handleClose} fullscreen>
            <Modal.Header closeButton>
                <Modal.Title>Install Me!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex align-items-center justify-content-between flex-column" style={{width: "100%"}}>
                    <div 
                        className="d-flex align-items-start justify-content-center flex-column" 
                        style={{width: "100%"}}
                    >
                        <p><strong>We couldn't help but notice you're on a mobile device!</strong></p>
                        <p>
                            In order to have a better experience, it is recommended that you install this as a Progressive Web App. 
                            All this means is that this website will act and feel like a normal app on your phone, 
                            but it will actually be a web page. 
                            We know that sounds complicated, but long story short, it's just better. 
                        </p>
                    </div>
                    <div className='d-flex align-items-center justify-content-between flex-row' style={{width: "90%", minHeight: "220px"}}>
                        <div className="d-flex align-items-center justify-content-center flex-column mb-2" style={{width: "50%"}}>
                            <img src={DCD_Add_To_Home_Screen} alt="loading..." height="100%"/>
                        </div>
                        <div className='d-flex align-items-center justify-content-center flex-column mb-2' style={{width: "40%", textAlign: "center"}}>
                            We don't believe that Androids exist so there isn't an animation for one of those.
                        </div>
                    </div>
                    <div className="d-flex align-items-start justify-content-center flex-row" style={{width: "100%"}}>
                        <div style={{width:"30%", height:"100%"}}>
                            <strong>iPhone:</strong>
                            <ListGroup as="ol" numbered>
                                <ListGroup.Item as="li">
                                    Press <IOSShareIcon width="1rem" height="1rem"/>
                                </ListGroup.Item>
                                <ListGroup.Item as="li">Press "Add to Home Screen"</ListGroup.Item>
                                <ListGroup.Item as="li">Press "Add"</ListGroup.Item>
                            </ListGroup>
                        </div>
                        <div style={{width:"30%", height:"100%"}}>
                            <strong>Android:</strong>
                            <ListGroup as="ol">
                                <ListGroup.Item as="li">Open Google Chrome</ListGroup.Item>
                                <ListGroup.Item as="li">Press the 3 dots in the upper right corner</ListGroup.Item>
                                <ListGroup.Item as="li">Tap Add to Home Screen</ListGroup.Item>
                            </ListGroup>
                        </div>
                    </div>
                </div>
                
            </Modal.Body>
        </Modal>
    )
}

const IOSShareIcon = (props) => {
    const {width, height} = props;

    return(
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            height={height} 
            viewBox="0 0 24 24" 
            width={width}
        >
            <path 
                d="M0 0h24v24H0V0z" 
                fill="none"
            />
            <path 
                d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"
            />
        </svg>
    );
}

export default PWAInstructions;