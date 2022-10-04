import React, { useState, useEffect, useRef } from 'react'
import './ViewerSideBar.css';
import OptionsDropDown from './ViewerSideBarComponents/OptionsDropDown';

// STILL WORKING ON THIS! NOT TESTED YET!

const ViewerSideBar = (props) => {
    const { curSetInfo, curSetNumb, setInput, curSet, sets, changeCurSet, loading, setCurSetNumb, changeCurSetNumb, ...rest } = props

    return (
        <div className="flex-column justify-content-between d-flex align-items-center sideBarClass">
            <div className='mb-2 flex-column justify-content-center d-flex align-items-center' style={{height: "30vh"}}>
                {
                    !loading ?
                    <h1 className='viewerSideBarHeader'>Current Set:</h1>
                    : null
                }
                {
                    !loading ?
                    <input 
                        ref={setInput} 
                        value={curSetNumb} 
                        className="invisibleInput" 
                        onChange={(e) => setCurSetNumb(e.target.value)} 
                        onKeyDown={(e) => changeCurSetNumb(e)}>
                    </input> :
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                }
                
                {
                    // Add Other conditions here
                    !loading && curSetInfo !== null ?
                    <div>
                        <h1 className='centerText'><strong>Name</strong></h1>
                        <h1 className='centerText'><strong>Measure:</strong> {curSetInfo["measure"]}</h1>
                        <h1 className='centerText'><strong>Total Counts:</strong> 0</h1>
                        <h1 className='centerText'><strong>Counts:</strong> {curSetInfo["counts"]}</h1>
                    </div>
                    : <div></div>
                }
                
            </div>
            <OptionsDropDown />
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
            </div>
        </div>
    );
};

export default ViewerSideBar;