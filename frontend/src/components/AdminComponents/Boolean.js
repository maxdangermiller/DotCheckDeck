import React, { useState, useEffect, useRef } from 'react';
import {ReactComponent as Check} from '../../icons/circle-check.svg';
import {ReactComponent as XMark} from '../../icons/circle-xmark.svg';

const Boolean = (props) => {
    const {state, ...rest} = props;
    
    if (state) {
        return (
            <i style={{height: "2rem", color: "green"}}>
                <Check height="100%" fill="currentColor"/>
            </i>
        );
    }

    return (
        <i style={{height: "2rem", color: "red"}}>
            <XMark height="100%" fill="currentColor"/>
        </i>
    );
}

export default Boolean;