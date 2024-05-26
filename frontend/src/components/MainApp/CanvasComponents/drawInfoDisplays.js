import canvasConversions from './canvasConversions';

const HIGHLIGHT_USER_COLOR = "rgb(255, 0, 0)";

/**
 * Draws Info about selected users
 * Movement Brackets, User Dialog, and User Name
 * @param {Canvas} canvas 
 * @param {CanvasRenderingContext2D} context 
 * @param {Object} userOptions 
 * @param {Object} userData 
 * @param {Object} hoverUserInfo 
 * @param {Function} setHoverUserInfo 
 */
function drawInfoDisplays(canvas, context, userOptions, userData, hoverUserInfo, setHoverUserInfo) {
    const {
        steps_to_px,
        sideLineRatioConvert,
        hashRatioConvert,
        hashStepsCorrect
    } = canvasConversions(userOptions);

    /**
     * Draw Movement Bracket Text
     * @param {Float} x0
     * @param {Float} y0 
     * @param {Float} x1 
     * @param {Float} y1 
     * @param {Integer} xDirection direction to draw (-1, 0, or 1)
     * @param {Integer} yDirection direction to draw (-1, 0, or 1)
     * @param {String} text 
     * @param {Color} color color code
     */
    const drawMovementBracketText = (x0, y0, x1, y1, xDirection, yDirection, text, color) => {
        const MIN_CLEAR = 5;

        if (x0 !== x1 && y0 === y1 && xDirection !== 0 && yDirection === 0) {  
            context.fillStyle = color;
            context.textAlign = "center";

            if (xDirection === 1) {
                context.textBaseline = "top";
            } else if (xDirection === -1) {
                context.textBaseline = "bottom";
            }

            context.font = 24 + 'px ArialBlack';

            let centerX = (x0 - x1) / 2 + x1;
            let useY = y0 + (MIN_CLEAR * xDirection);

            context.fillText(text, centerX, useY);
        }
        else if (x0 === x1 && y0 !== y1 && xDirection === 0 && yDirection !== 0) {
            context.fillStyle = color;
            context.textBaseline = "middle";

            if (yDirection === 1) {
                context.textAlign = "left";
            } else if (yDirection === -1) {
                context.textAlign = "right";
            }

            context.font = 24 + 'px ArialBlack';

            let useX = x0 + (MIN_CLEAR * yDirection);
            let centerY = (y0 - y1) / 2 + y1;

            context.fillText(text, useX, centerY);
        }
    }

    /**
     * Draw Movement Brackets
     * @param {Float} x position
     * @param {Float} y position
     * @param {Dot} dot 
     */
    const drawMovementBrackets = (x, y, dot) => {
        if (dot === null) { return; }
        // Find the cords of the closest line and hash
        const lineRatio = sideLineRatioConvert( dot["side"], dot["line"] );
        const hashRatio = hashRatioConvert(dot["use_hash"], userOptions.useCollegeHash);
        const hashRatioHS = hashRatioConvert(dot["use_hash"], false);
        const lineX = lineRatio * canvas.width;
        const hashY = hashRatio * canvas.height;
        const hashY_HS = hashRatioHS * canvas.height;

        // console.log("Drawing Brackets: " + lineRatio + " : " + lineX)

        const DASH_LENGTH = 5;
        const BRACKET_SEPARATION = 10;
        // const TEXT_OFFSET = Math.min(canvas.width, canvas.height) * 0.04;         // Equivalent to max width/height
    

        context.beginPath();
        context.strokeStyle=HIGHLIGHT_USER_COLOR;
        context.lineWidth="2";
        
        if (x !== lineX) {
            const distanceFromHash = Math.abs(y - hashY) + BRACKET_SEPARATION;
            let useY = 0;
            let xDirection = 0;

            if (y - hashY <= 0) {
                useY = hashY - distanceFromHash
                xDirection = -1;
            } else {
                useY = hashY + distanceFromHash
                xDirection = 1;
            }

            // Draw the actual line to the line
            context.moveTo(lineX, useY); 
            context.lineTo(x, useY);

            // Draw Little dashes on the ends
            context.moveTo(lineX, useY - DASH_LENGTH);
            context.lineTo(lineX, useY + DASH_LENGTH);

            context.moveTo(x, useY - DASH_LENGTH);
            context.lineTo(x, useY + DASH_LENGTH);

            // Draw text
            drawMovementBracketText(lineX, useY, x, useY, xDirection, 0, dot.steps, HIGHLIGHT_USER_COLOR);
        }

        if (y !== hashY) {
            const distanceFromHash = Math.abs(x - lineX) + BRACKET_SEPARATION;
            let useX = 0;
            let yDirection = 0;

            if (x - lineX <= 0) {
                useX = lineX - distanceFromHash;
                yDirection = -1;
            } else {
                useX = lineX + distanceFromHash;
                yDirection = 1;
            }

            // Draw the actual line to the hash
            context.moveTo(useX, hashY);
            context.lineTo(useX, y);

            // Draw Little dashes on the ends
            context.moveTo(useX + DASH_LENGTH, hashY);
            context.lineTo(useX - DASH_LENGTH, hashY);

            context.moveTo(useX + DASH_LENGTH, y);
            context.lineTo(useX - DASH_LENGTH, y);

            let steps = hashStepsCorrect(dot.fb_steps, dot.use_hash, hashY_HS, hashY, y);

            // Draw text
            drawMovementBracketText(useX, hashY, useX, y, 0, yDirection, steps, HIGHLIGHT_USER_COLOR);
        }

        context.stroke();
        context.closePath();
    }

    /**
     * Draw User Dialogue
     * @param {Float} dotX 
     * @param {Float} dotY 
     * @param {Dot} dot 
     */
    const drawUserDialogue = (dotX, dotY, dot) => {
        // console.log("drawing dialogue: " + dot["userLabel"])
        const w = canvas.width * 0.075;
        const h = canvas.height * 0.075;
        const x = dotX + canvas.height * 0.01;
        const y = dotY - h - canvas.height * 0.01;
        const radius = 5;

        const r = x + w;
        const b = y + h;

        // Draw rounded rectangle
        context.beginPath();
        context.strokeStyle="black";
        context.fillStyle="rgb(240, 240, 240)";
        context.lineWidth="4";
        context.moveTo(x+radius, y);
        context.lineTo(r-radius, y);
        context.quadraticCurveTo(r, y, r, y+radius);
        context.lineTo(r, y+h-radius);
        context.quadraticCurveTo(r, b, r-radius, b);
        context.lineTo(x+radius, b);
        context.quadraticCurveTo(x, b, x, b-radius);
        context.lineTo(x, y+radius);
        context.quadraticCurveTo(x, y, x+radius, y);
        context.stroke();
        context.fill();
        context.closePath();

        context.beginPath();
        context.font = canvas.height * 0.02 + 'px ArialBlack';
        context.fillStyle = "black";
        context.textBaseline = "middle";
        context.textAlign = "center";

        let userLabel = dot["userLabel"];
        let isProp = dot["show_user"]["is_prop"];

        if (isProp === true) {
            userLabel = "Prop";
        }

        context.fillText(userLabel, x + w * 0.2, y + h * 0.25);

        if (dot["userName"] !== "None None" && dot["userName"] !== "") {
            context.font = canvas.height * 0.015 + 'px ArialBlack';

            const MAX_LENGTH = 12;
            if (dot["userName"].length > MAX_LENGTH) {
                let split = dot["userName"].split(" ");
                
                if (split.length < 2) {
                    console.log("PROBLEM WITH NAME!", dot);
                }

                let shortenedName = split[0] + " " + split[1][0] + "."

                if (shortenedName.length > MAX_LENGTH) {
                    shortenedName = shortenedName.substring(0, MAX_LENGTH - 1) + ".";
                }

                context.fillText(shortenedName, x + w * 0.65, y + h * 0.25);
                
            } else {
                context.fillText(dot["userName"], x + w * 0.65, y + h * 0.25);
            }

            context.closePath();
        } else if (isProp !== true) {
            context.font = canvas.height * 0.0125 + 'px ArialBlack';
            context.fillStyle = "red";

            context.fillText("Inactivated", x + w * 0.65, y + h * 0.25);
            context.closePath();
        }
        
        // {self.steps} {self.direction} {self.line} on {self.side}; {self.fbSteps} {self.fbDirection} {self.useHash}, for {self.counts} counts"
        context.beginPath();
        context.font = canvas.height * 0.0125 + 'px Arial Black';
        context.fillStyle = "black";

        const dotI = dot["dot"]
        // const dotStr = dotI["direction"] + " " + dotI["line"] + " on "+ dotI["side"] + "; " + 
        //         dotI["fbSteps"] + " " + dotI["dbDirection"] + " " + dotI["useHash"] + ", for " + dot["counts"] + " counts"

        if (dotI["steps"] !== 0) {
            const textStr = dotI["steps"] + " steps " + dotI["direction"] + " " + dotI["line"] + " side " + dotI["side"] + "; ";
            context.fillText(textStr, x + w * 0.5, y + h * 0.5, w * 0.9);
        } else {
            const textStr = "On " + dotI["line"] + ", on side " + dotI["side"] + "; "
            context.fillText(textStr, x + w * 0.5, y + h * 0.5, w * 0.9);
        }

        if (dotI["fb_steps"] !== 0) {
            const fbDirection = dotI["fb_direction"] === "Front" ? "in front of" : dotI["fb_direction"];
            const textStr = dotI["fb_steps"] + " steps " + fbDirection + " " + dotI["use_hash"];

            context.fillText(textStr, x + w * 0.5, y + h * 0.65, w * 0.9);
        } else {
            context.fillText("On " + dotI["use_hash"], x + w * 0.5, y + h * 0.65, w * 0.9);
        }
        context.fillText("for " + dot["counts"] + " counts", x + w * 0.5, y + h * 0.8, w * 0.9);
        // console.log(dot);
        context.closePath();
    }

    /**
     * Draw User Name by setting using setHoverUserInfo
     * @param {Dot} dot 
     */
    const drawUserName = (dot) => {
        if (hoverUserInfo.dot === null || hoverUserInfo.dot.dot.id !== dot.dot.id) {
            if (dot.userID !== userData.show_user_id) {
                setHoverUserInfo({show: true, dot: dot})
            } else {
                setHoverUserInfo({show: false, dot: dot})
            }
        }
    }

    return {
        drawMovementBrackets: drawMovementBrackets,
        drawUserDialogue: drawUserDialogue,
        drawUserName: drawUserName
    }
}

export default drawInfoDisplays;