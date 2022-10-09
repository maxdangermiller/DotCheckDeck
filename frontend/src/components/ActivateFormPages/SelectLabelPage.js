import React, { useRef, useEffect, useState} from 'react';
import { Autocomplete, TextField } from '@mui/material';

const SelectLabelPage = (props) => {
    const sortLabels = (value) => {
        return value.sort(function(a, b) {
            let keyA = a["label"].match(/(\d+)/);
            let keyB = b["label"].match(/(\d+)/);
            let keyAPrefix = a["label"].replace(/[0-9]/g, '');
            let keyBPrefix = b["label"].replace(/[0-9]/g, '');

            // Compare the letter "prefixes" first
            if (keyAPrefix < keyBPrefix) return -1;
            if (keyAPrefix > keyBPrefix) return 1;

            // Compare the numbers
            if (parseInt(keyA) < parseInt(keyB)) return -1;
            if (parseInt(keyA) > parseInt(keyB)) return 1;

            return 0;
        });
          
    }

    return (
        <div>
            <Autocomplete
                disablePortal
                id="combo-box-demo"
                options={sortLabels(props.options)}
                sx={{ width: "100%" }}
                renderInput={(params) => <TextField {...params} label="Select Your Label" />}
            />
            <p>Don't see your label? Contact {props.email}</p>
        </div>
    );
};

export default SelectLabelPage;