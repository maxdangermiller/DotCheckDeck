import React, { useRef, useEffect, useState} from 'react';

import { FormControlLabel, Checkbox } from '@mui/material/';

import 'bootstrap/dist/css/bootstrap.css';

const TermsPage = (props) => {
    const { agreedToTerms, setAgreedToTerms } = props;

    return (
        <div>
            <div>
                <a style={{color: "white"}} href="eula.pdf" target="_blank">End User License Agreement</a>
            </div>
            <br />
            <div>
                <FormControlLabel control={
                    <Checkbox value={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                } label="I affirm that I have read, and agree to the above terms" />
            </div>
        </div>
    );
};

export default TermsPage;