import React, { useRef, useEffect, useState} from 'react';
import { Autocomplete, TextField } from '@mui/material';

const SelectLabelPage = (props) => {
    return (
        <div>
            <Autocomplete
                disablePortal
                id="combo-box-demo"
                options={props.options}
                sx={{ width: "100%" }}
                renderInput={(params) => <TextField {...params} label="Select Your Label" />}
            />
            <p>Don't see your label? Contact {props.email}</p>
        </div>
    );
};

export default SelectLabelPage;