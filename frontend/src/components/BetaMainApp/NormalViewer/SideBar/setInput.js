import React, { useState, useEffect } from "react";

const SetInput = (props) => {
    const {setInputRef, setCurSetNumb, curSetState, getCurSetNumb} = props;

    const [setNumInputValue, setSetNumInputValue] = useState(getCurSetNumb(curSetState));
    
    useEffect(
        () => {
            setSetNumInputValue(getCurSetNumb(curSetState));
        }
        , [curSetState]
    );

    const onInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            let result = setCurSetNumb(e.target.value);
            setSetNumInputValue(result);
        }
    }

    return (
        <input 
            ref={setInputRef} 
            value={setNumInputValue} 
            className="setNumberInput" 
            onChange={(e) => setSetNumInputValue(e.target.value)} 
            onKeyDown={(e) => onInputKeyDown(e)}>
        </input>
    );
}

export default SetInput;