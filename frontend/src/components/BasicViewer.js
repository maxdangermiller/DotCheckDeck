import React, { useState, useEffect, useRef } from 'react';
import getApi from './getApi';
import axios from "axios";
import { AutoTextSize } from 'auto-text-size'

const WINDOW_LOCATION = getApi();

const BasicViewer = (props) => {
    const {token, schoolCode, ...rest} = props;

    const [data, setData] = useState(undefined);


    useEffect(() => {
        const url = WINDOW_LOCATION + "/get-dots-user?school_code=" + schoolCode + "&token=" + token;

        axios({
            method: "GET",
            url:url,
        }).then((response) => {
            console.log(response.data);
            setData(response.data)
        }).catch((error) => {
            console.log(error)
            if (error.response && error.response.status === 401 || error.response.status === 400) {
                // window.location.href = "/login";
            }
		})
    }, [])

    if (data === undefined) {
        return (
            <div className="flex-row justify-content-center d-flex align-items-center ViewerFullScreen">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    const getDotText1 = (dot) => {
        if (dot.steps !== 0) {
            return (
                <strong>
                {dot.steps} steps {dot.direction} {dot.line}yd line, on side {dot.side}
                </strong>
            );
        }
        return (
            <strong>
            On {dot.line}yd line, on side {dot.side}
            </strong>
        );
    }

    const getDotText2 = (dot) => {
        if (dot.fb_steps !== 0) {
            let fbDirection = dot.fb_direction === "Front" ? "in front of" : dot.fb_direction;
            return (
                <strong>
                {dot.fb_steps} steps {fbDirection} {dot.use_hash}
                </strong>
            );
        }
        return (
            <strong>
            On {dot.use_hash}
            </strong>
        );
    }


    return (
        <div className="flex-column justify-content-center d-flex align-items-center ViewerFullScreen">
            <div className="overflow-auto" style={{height: '80vh', width:'min(100%, 800px'}}>
            <ul className="list-group">
            {
                data.dots.map((dotData, index) =>
                    <li className="list-group-item flex-row justify-content-between d-flex align-items-center" key={index} style={{width:'100%', height:'14vh'}}>
                        <div className='flex-column justify-content-center d-flex align-items-center' style={{width:'30%', height:'100%'}}>
                            <div style={{maxWidth:'100%', height:'60%'}} className='flex-column justify-content-center d-flex align-items-center'>
                                <AutoTextSize mode='box'>{dotData.set_numb}</AutoTextSize>
                            </div>
                            <div style={{maxWidth:'100%', height:'40%'}} className='flex-column justify-content-center d-flex align-items-center'>
                                <AutoTextSize mode='box'><strong>{dotData.set_name}</strong></AutoTextSize>
                            </div>
                        </div>
                        <div className='flex-column justify-content-center d-flex align-items-start' style={{width:'70%'}}>
                            <div className='mb-2'>{getDotText1(dotData.dot)}</div>
                            <div className='mb-2'>{getDotText2(dotData.dot)}</div>
                            <div className='mb-2'>For {dotData.counts} counts</div>
                            <div className='mb-2'>Measures: {dotData.measure}</div>
                        </div>
                    </li>

                )
            }
            </ul>
            </div>
		</div>
    );
}

export default BasicViewer;