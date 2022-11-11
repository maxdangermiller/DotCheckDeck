import React, { useState, useEffect, useRef } from 'react'
import './ViewerSideBar.css';
import OptionsDropDown from './ViewerSideBarComponents/OptionsDropDown';
import Spinner from './utils/Spinner';

// STILL WORKING ON THIS! NOT TESTED YET!

const ViewerSideBar = (props) => {
    const { 
        curSetInfo, curSetNumb, setInput, 
        curSet, sets, changeCurSet, 
        loading, setCurSetNumb, changeCurSetNumb, 
        userOptions, setUserOptions, data, playMusic, ...rest 
    } = props;

    return (
        <div className="flex-column justify-content-between d-flex align-items-center sideBarClass">
            <div className='mb-2 flex-column justify-content-center d-flex align-items-center' style={{height: "30vh"}}>
                <h1 className='viewerSideBarHeader'>Current Set:</h1>
                {
                    !loading ?
                    <input 
                        ref={setInput} 
                        value={curSetNumb} 
                        className="invisibleInput" 
                        onChange={(e) => setCurSetNumb(e.target.value)} 
                        onKeyDown={(e) => changeCurSetNumb(e)}>
                    </input> :
                    <div className='d-flex flex-column justify-content-center align-items-center spinnerSuspender'>
                        <Spinner />
                    </div>
                }
                
                {
                    // Add Other conditions here
                    !loading && curSetInfo !== null ?
                    <div>
                        <h1 className='centerText'><strong>Name:</strong> {data.length > curSet && data[curSet] !== undefined ? data[curSet]["setName"] : ""}</h1>
                        <h1 className='centerText'><strong>Measure:</strong> {curSetInfo["measure"]}</h1>
                        <h1 className='centerText'><strong>Total Counts:</strong> 0</h1>
                        <h1 className='centerText'><strong>Counts:</strong> {curSetInfo["counts"]}</h1>
                    </div> :
                    <div>
                        <h1 className='centerText'><strong>Name:</strong></h1>
                        <h1 className='centerText'><strong>Measure:</strong></h1>
                        <h1 className='centerText'><strong>Total Counts:</strong></h1>
                        <h1 className='centerText'><strong>Counts:</strong></h1>
                    </div>
                }
                
            </div>
            <OptionsDropDown userOptions={userOptions} setUserOptions={setUserOptions} data={data} curSet={curSet}/>
            <div className='mb-2 buttonDiv flex-row justify-content-between d-flex align-items-center'>
                <button 
                    type="button" 
                    className="btn btn-warning" 
                    onClick={() => changeCurSet(curSet - 1)}
                    disabled={curSet > 0 ? false : true}
                >&#8592;</button>
                <button 
                    type="button" 
                    className="btn btn-success" 
                    onClick={() => changeCurSet(curSet + 1)}
                    disabled={curSet < sets.length - 1 ? false : true}
                >&#8594;</button>
                <button 
                    type="button" 
                    className="btn btn-success" 
                    onClick={() => playMusic()}
                    disabled={curSet < sets.length - 1 ? false : true}
                >&#8594;</button>
            </div>
        </div>
    );
};

export default ViewerSideBar;