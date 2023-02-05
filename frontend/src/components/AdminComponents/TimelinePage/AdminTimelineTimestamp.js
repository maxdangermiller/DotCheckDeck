import React, { useState, useEffect, useRef } from 'react';

const AdminTimelineTimestamp = (props) => {
    const {width, text, align, ...rest} = props;

    return (
        <div style={{
            width: width, minWidth: width, height: "100%", fontsize: "100%", 
            textAlign: align, justifyContent: "center"
        }}>
            {text}
        </div>
    );
};

export default AdminTimelineTimestamp;