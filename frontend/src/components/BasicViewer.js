import React, { useState, useEffect, useRef } from 'react';
import getApi from './getApi';
import axios from "axios";

const WINDOW_LOCATION = getApi();

const BasicViewer = (props) => {
    const {token, schoolCode, ...rest} = props;


    useState(() => {
        const url = WINDOW_LOCATION + "/get-dots-user?school_code=" + schoolCode + "&token=" + token;

        axios({
            method: "GET",
            url:url,
        }).then((response) => {
            console.log(response);
        }).catch((error) => {
            console.log(error)
            if (error.response && error.response.status === 401 || error.response.status === 400) {
                // window.location.href = "/login";
            }
		})
    }, [])



    return (
        <div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">

		</div>
    );
}

export default BasicViewer;