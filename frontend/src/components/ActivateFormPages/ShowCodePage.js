import React, { useRef, useEffect, useState} from 'react';
import { TextField } from '@mui/material';

import 'bootstrap/dist/css/bootstrap.css';

const ShowCodePage = (props) => {
    const {showCode, setShowCode} = props;

    const [internalShowCode, setInternalShowCode] = useState(showCode ? showCode : "");

    const validateShowCode = (value) => {
        if (value.length <= 8) {
            setInternalShowCode(value);
            setShowCode(value);
        }
    }

    return (
        <TextField
            className="mb-3 customInput"
            value={internalShowCode}
            onChange={e => validateShowCode(e.target.value)}
            label="Show Code"
            variant="outlined"
            style={{width: "100%"}}
        />
    );
} 

export default ShowCodePage