import React, {useRef, useEffect, useState} from 'react'
import 'bootstrap/dist/css/bootstrap.css';

const SimpleCanvas = (props) => {
    const { 
        draw, setDimensions, curDimensions, 
        curSet, sets, loading, curPlayTime, 
        audioPlaying, userOptions, userData, ...rest 
    } = props;

    const [text, setText] = useState("NO DATA");

    const getHighlightedUserData = (data, userOptions) => {
        if (userOptions.highlightUser !== null) {
            for (let x = 0; x < data.length; x++) {
                const dot = data[x];

                if (userOptions.highlightUser.label === dot.userLabel) {
                    return dot;
                }
            }
        }

        return null;
    }

    const satisfyWidthRequirement = () => {
        const ARBITRARY_WIDTH = 800;
        const ARBITRARY_HEIGHT = 600;

        if (curDimensions["w"] !== ARBITRARY_WIDTH || curDimensions["h" !== ARBITRARY_HEIGHT]) {
            setDimensions({"w": ARBITRARY_WIDTH, "h": ARBITRARY_HEIGHT});
        }
    }

    useEffect(() => {
        satisfyWidthRequirement();
    }, []);

    const getUserDotData = () => {
        let _draw = draw();
        let data = _draw.data[curSet];
        console.log(_draw);
        if (data === undefined) {
            return null;
        }
        let highlightedUserData = getHighlightedUserData(data, userOptions);

        for(let i = 0; i < data.length; i++) {
            const dot = data[i];
            if (highlightedUserData !== null) {
                if (highlightedUserData.userLabel === dot.userLabel) {
                    return dot;
                }
            }
        }
        return null;
    }

    useEffect(() => {
        let userDot = getUserDotData();
        let output = "";

        if (userDot === null) {
            setText("No Data");
            return;
        }

        output += userDot["steps"] + " steps ";
        output += userDot["direction"] + " " + userDot["line"] + " side " + userDot["side"];

        if (userDot["steps"] !== 0) {
            output += userDot["steps"] + " steps ";
            output += userDot["direction"] + " " + userDot["line"] + " side " + userDot["side"];
        } else {
            output += "On " + userDot["line"] + ", on side " + userDot["side"] + "; "
        }

        if (userDot["fb_steps"] !== 0) {
            let fbDirection = userDot["fb_direction"] === "Front" ? "in front of" : userDot["fb_direction"];
            output += userDot["fb_steps"] + " steps " + fbDirection + " " + userDot["use_hash"];
        } else {
            output += "On " + userDot["use_hash"];
        }
        output += "for " + userDot["counts"] + " counts";

        setText(output);
    }, [curSet]);

    return (
        <div>
            {text}
        </div>
    );
};

export default SimpleCanvas;