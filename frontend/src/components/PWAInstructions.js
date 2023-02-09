import React, { useState, useEffect, useRef } from 'react'
import {Modal, Button, ListGroup} from 'react-bootstrap/';

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
                <p><strong>We couldn't help but notice you're on a mobile device!</strong></p>
                <p>
                    In order to have a better experience, it is recommended that you install this as a Progressive Web App. 
                    All this means is that this website will act and feel like a normal app on your phone, but will actually be a web page.
                    We know that sounds complicated, but long story short, it's just better.
                </p>
                <ListGroup as="ol" numbered>
                    <ListGroup.Item as="li">Open in Safari</ListGroup.Item>
                    <ListGroup.Item as="li">
                        Press <IOSShareIcon width="1rem" height="1rem"/>
                    </ListGroup.Item>
                    <ListGroup.Item as="li">Cras justo odio</ListGroup.Item>
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    I'm Okay
                </Button>
            </Modal.Footer>
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