import React, { useState, useEffect, useRef } from 'react';
import getApi from './getApi';
import axios from "axios";
import { AutoTextSize } from 'auto-text-size'
import { Switch, FormControlLabel, Stack, Typography } from '@mui/material';
import SetNameModelBasic from './ViewerSideBarComponents/SetNameModelBasic';

const WINDOW_LOCATION = getApi();

const BasicViewer = (props) => {
    const {token, schoolCode, setIsBasic, userData, ...rest} = props;

    const [data, setData] = useState(undefined);
    const [curDatabaseTimestamp, setCurDatabaseTimestamp] = useState(-1);
    const [curDatabaseSNTimestamp, setCurDatabaseSNTimestamp] = useState(-1);
    const [useCollegeHash, setUseCollegeHash] = useState(false);
    const [showEditSetName, setShowEditSetName] = useState(false);
    const [tempCurSetInfo, setTempCurSetInfo] = useState({});

    
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

    const convertToCollegeHash = (dot) => {
        let hash = dot.use_hash;
        let steps = dot.fb_steps; 
        let direction = dot.fb_direction;   // "Behind" or "Front" or "On"

        
        if (hash == "Back Hash") {
            if (direction == "Behind") {
                return {...dot, fb_steps: dot.fb_steps + 4};
            }
            if (direction == "On") {
                return {...dot, fb_steps: 4, fb_direction: "Front"};
            }
            if (direction == "Front") {
                if (dot.fb_steps < 4) {
                    return {...dot, fb_steps: 4 - dot.fb_steps, fb_direction: "Front"};
                }
                return {...dot, fb_steps: dot.fb_steps - 4};
            }
        }
        if (hash == "Front Hash") { 
            if (direction == "Behind") {
                if (dot.fb_steps < 4) {
                    return {...dot, fb_steps: 4 - dot.fb_steps, fb_direction: "Front"};
                }
                return {...dot, fb_steps: dot.fb_steps - 4};
            }
            if (direction == "Front") {
                return {...dot, fb_steps: dot.fb_steps + 4};
            }
            if (direction == "On") {
                return {...dot, fb_steps: 4, fb_direction: "Front"};
            }
        }

        return dot;
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
        let useHash = "HS"
        if (useCollegeHash) {
            dot = convertToCollegeHash(dot)
            useHash = "College"
        }

        if (dot.fb_steps !== 0) {
            let fbDirection = dot.fb_direction === "Front" ? "in front of" : dot.fb_direction;
            return (
                <strong>
                {dot.fb_steps} steps {fbDirection} {dot.use_hash} ({useHash})
                </strong>
            );
        }
        return (
            <strong>
            On {dot.use_hash} ({useHash})
            </strong>
        );
    }

    const openEditSetName = (dotData) => {
        console.log(dotData)
        setShowEditSetName(true);
        setTempCurSetInfo(JSON.parse(JSON.stringify(dotData)));
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
                        {
                            userData.is_section_leader ?
                            <button className='btn btn-secondary' onClick={(e) => openEditSetName(dotData)} style={{right: "1rem", bottom: "1rem", position: "absolute"}}>Edit</button>
                            : null
                        }
                    </li>

                )
            }
            </ul>
            </div>
            <br />
            <div className='d-flex flex-row justify-content-between align-items-center' style={{width:"100%", padding:"1rem"}}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>High School</Typography>
                    <Switch
                        checked={useCollegeHash}
                        onChange={(e) => setUseCollegeHash(e.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                        size='xl'
                    />
                    <Typography>College</Typography>
                </Stack>

                <button className='btn btn-primary' onClick={(e) => setIsBasic(false)}>Open Normal</button>
            </div>
            

            <SetNameModelBasic 
                show = {showEditSetName}
                setShow = {setShowEditSetName}
                token = {token}
                curSetInfo={tempCurSetInfo}
                setCurSetInfo={setTempCurSetInfo}
                data={data}
                setData={setData}
            />
		</div>
    );
}

export default BasicViewer;