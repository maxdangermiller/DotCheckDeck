/**
 * Converts a side 2 yard line to a left to right cord from 50 to 100
 * @param {int} line 0 - 50
 * @returns 100 - 50
 */
const side2Convert = (line) => {
    return 100 - line;
}

const hashConvert = (useHash) => {
    if (useHash === "Front side") {
        return 1;
    }
    if (useHash === "Front Hash") {
        return 2/3;
    }
    if (useHash === "Back Hash"){
        return 1/3;
    }
    return 0;
}

const convertDotToCords = (dot, width, height) => {
    const YARDS_IN_STEP = 0.625;
    const FT_IN_STEP = 1.875;

    let direction = dot.dot.direction;
    let line = dot.dot.line;
    let steps = dot.dot.steps;
    let side = dot.dot.side;
    let fbSteps = dot.dot.fb_steps;
    let fbDirection = dot.dot.fb_direction
    let useHash = dot.dot.use_hash;
    
    let dModifier = -1;
    let sModifier = 0;
    let fbdModifier = 1;

    if (direction === "Inside") {
        dModifier = 1;
    }
    else if (direction == "") {
        dModifier = 0;
    }

    if (line !== "ln") {
        // Side 1 is left
        if (side === 1) {
            line = parseInt(line);
            sModifier = 1;
        } else {
            line  = side2Convert(parseInt(line));
            sModifier = -1;
        }
    } else {
        line = 50;
        sModifier = 0;
    }

    let relX = line + (dModifier * sModifier * steps * YARDS_IN_STEP);
    // Round to 2 decimals
    let x = Math.round(relX * (width / 100) * 100) / 100;

    if (fbDirection === "Behind") {
        fbdModifier = -1;
    } else if (fbDirection === "") {
        fbdModifier = 0;
    }

    let hashY = hashConvert(useHash);

    let oneStep = height / 1920 * 22.5;
    let relY = (fbdModifier * fbSteps * oneStep);
    let y = Math.round((height * hashY + relY) * 100) / 100;

    return {x: x, y: y};
}

export default convertDotToCords;