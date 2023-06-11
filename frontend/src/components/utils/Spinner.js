import React from 'react'

const Spinner = (props) => {
    const {width, height} = props;

    return (
        <div className="spinner-border" style={{width: width, height: height}} role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    );
};

export default Spinner