import React, { useState, useEffect, useRef } from 'react';
import getApi from './getApi';
import axios from "axios";
import { AutoTextSize } from 'auto-text-size'

const WINDOW_LOCATION = getApi();

const BasicViewer = (props) => {
    const {token, schoolCode, ...rest} = props;

    const [data, setData] = useState(undefined);
    const [curDatabaseTimestamp, setCurDatabaseTimestamp] = useState(-1);
    const [curDatabaseSNTimestamp, setCurDatabaseSNTimestamp] = useState(-1);

    
    useEffect(() => {
        fetch(WINDOW_LOCATION + "/database-version?school_code=" + props.schoolCode + "&token=" + props.token)
			.then(res => res.json())
			.then(
				(result) => {
					console.log("(getDatabaseVersion) -> ", result.timestamp, result.set_name_timestamp)
					setCurDatabaseTimestamp(result.timestamp);
                    setCurDatabaseSNTimestamp(result.set_name_timestamp)
				},
				// Note: it's important to handle errors here
				// instead of a catch() block so that we don't swallow
				// exceptions from actual bugs in components.
				(error) => {
					console.log(error);
				}
		);
    }, []);


	const checkLocalData = () => {
		// Check if Saved
		let localData = localStorage.getItem("local-basic-data");
		try {
			if (localData !== "" && localData !== null) {
				let parsedData = JSON.parse(localData);
                console.log(parsedData);

				// Check version number
				for (let i = 0; i < parsedData.dots.length; i++) {
					let timestamp = parsedData.dots[i].timestamp;
					if (timestamp !== curDatabaseTimestamp) {
						// Start UPDATING THOSE SETS
						return false;
					}
                    // Check set name timestamp
                    let snTimestamp = parsedData.dots[i].set_name_timestamp;
                    if (snTimestamp !== curDatabaseSNTimestamp) {
                        return false;
                    }
				}

				// console.log("USING LOCAL DATA!");
				// console.log(parsedData);
				setData(parsedData);

				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	const saveLocalData = (newData) => {
		localStorage.setItem("local-basic-data", JSON.stringify(newData));
		localStorage.setItem("basic-database-timestamp", curDatabaseTimestamp);
		localStorage.setItem("basic-sn-database-timestamp", curDatabaseSNTimestamp);
	}


    useEffect(() => {
        if (!checkLocalData()) {
            const url = WINDOW_LOCATION + "/get-dots-user?school_code=" + schoolCode + "&token=" + token;
    
            axios({
                method: "GET",
                url:url,
            }).then((response) => {
                console.log(response.data);
                saveLocalData(response.data)
                setData(response.data)
            }).catch((error) => {
                console.log(error)
                if (error.response && error.response.status === 401 || error.response.status === 400) {
                    // window.location.href = "/login";
                }
            })
        }
    }, [curDatabaseTimestamp, curDatabaseSNTimestamp])

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
                {dot.fb_steps} steps {fbDirection} {dot.use_hash} (HS)
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
                    <li className="list-group-item flex-row justify-content-between d-flex align-items-center" key={index} style={{width:'100%', height:'180px'}}>
                        <div className='flex-column justify-content-center d-flex align-items-center' style={{width:'30%', height:'100%'}}>
                            <div style={{width:'100%', height:'60%'}} className='flex-column justify-content-center d-flex align-items-center'>
                                <AutoTextSize mode='box'>{dotData.set_numb}</AutoTextSize>
                            </div>
                            <div style={{width:'100%', height:'40%', textAlign:'center'}} className='flex-column justify-content-center d-flex align-items-center'>
                                <AutoTextSize mode='box'>{dotData.set_name}</AutoTextSize>
                            </div>
                        </div>
                        <div className='flex-column justify-content-center d-flex align-items-start' style={{width:'65%'}}>
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