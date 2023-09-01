import React, { useRef, useEffect, useState} from 'react';
import { TextField } from '@mui/material';

import 'bootstrap/dist/css/bootstrap.css';

const SchoolCodePage = (props) => {

    const [schoolCode, setSchoolCode] = useState(props.schoolCode ? props.schoolCode : "");

    const validateSchoolCode = (value) => {
        if (value.length <= 8) {
            setSchoolCode(value);
            props.setSchoolCode(value);
        }
    }

    return (
        <TextField
            className="mb-3 customInput"
            value={schoolCode}
            onChange={e => validateSchoolCode(e.target.value)}
            label="School Code"
            variant="outlined"
            style={{width: "100%"}}
        />
    );
} 

export default SchoolCodePage