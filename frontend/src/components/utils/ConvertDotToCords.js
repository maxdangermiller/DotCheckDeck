/**
 * Converts a side 2 yard line to a left to right cord from 50 to 100
 * @param {int} line 0 - 50
 * @returns 100 - 50
 */
const side2Convert = (line) => {
    return 100 - line;
}

/**
 * Convert Dot Object to Coordinates
 * @param {Object} dot 
 * @param {float} width 
 * @param {float} height 
 * @returns 
 */
const convertDotToCords = (dot, width, height) => {
    // Point to the new method
    return posFromBits(dot.dot_pos, width, height, dot.dot, dot.userLabel);
}

// NEW CONVERSIONS


const roundToGoodNum = (num) => {
    let integer = parseInt(num);
    let deci = Math.round((num % 1) * 100);
    
    // 0
    if (deci === 0) {
        return integer + 0;
    }

    // 0-0.1
    if (deci <= 10) {
        return integer + 0.1;
    }

    // 0.1-0.2
    if (deci <= 20) {
        return integer + 0.2;
    }

    // 0.2-0.25
    if (deci <= 25) {
        return integer + 0.25;
    }

    // 0.25-0.3
    if (deci <= 30) {
        return integer + 0.3;
    }

    // 0.3-0.4
    if (deci <= 40) {
        return integer + 0.4;
    }
    
    // 0.4-0.5
    if (deci <= 50) {
        return integer + 0.5;
    }

    // 0.5-0.6
    if (deci <= 60) {
        return integer + 0.6;
    }

    // 0.6-0.7
    if (deci <= 70) {
        return integer + 0.7;
    }

    // 0.7-0.75
    if (deci <= 75) {
        return integer + 0.75;
    }

    // 0.75-0.8
    if (deci <= 80) {
        return integer + 0.8;
    }

    // 0.8-0.9
    if (deci <= 90) {
        return integer + 0.9;
    }

    return integer + 1;
} 


const cordsToDot = (x, y, width, height, baseDot) => {
    // Find what line its closest to
    const NUM_LINES = 20;
    const YARDS_BETWEEN_LINES = 5;
    const STEPS_BETWEEN_LINES = 8;

    const RATIO_BETWEEN_HASHES = 1/3;
    
    // Output Info
    let dir = "";
    let line = -1;
    let steps = 0;
    let side = -1;
    let fbSteps = 1;
    let fbDir = "";
    let hash = "";

    let pxBetweenLines = width / NUM_LINES;
    let pxPerStep = pxBetweenLines / STEPS_BETWEEN_LINES;

    // Find the closest line
    line = Math.round(x / pxBetweenLines);
    let xOfLine = line * pxBetweenLines;
    
    // If its on or before the 50 on side 1, then just multiply
    if (line <= 10) {
        line = line * YARDS_BETWEEN_LINES;
        side = 1;
    }
    // Otherwise it's on side 2
    else {
        line = 50 - (line - 10) * YARDS_BETWEEN_LINES;
        side = 2;
    }
    // console.log(line);


    // If the x pos is really close to the line
    if (Math.abs(xOfLine - x) <= 0.01) {
        dir = "On";
    }
    // If the x pos is to the LEFT of the line
    else if (x < xOfLine) {
        // Side 1: OUTSIDE
        if (side === 1) {
            dir = "Outside";
        }
        // Side 2: INSIDE
        if (side === 2) {
            dir = "Inside";
        }
    }
    // If the x pos is to the RIGHT of the line
    else {
        // Side 1: INSIDE
        if (side === 1) {
            dir = "Inside";
        }
        // Side 2: OUTSIDE
        if (side === 2) {
            dir = "Outside";
        }
    }

    steps = roundToGoodNum(Math.round(Math.abs(xOfLine - x) / pxPerStep * 100) / 100);
    // console.log(xOfLine, x, Math.abs(xOfLine - x), pxPerStep, steps);
    // console.log(steps + " steps " + dir + " the " + line + " yd line")

    let pxBetweenHashes = RATIO_BETWEEN_HASHES * height;
    let hashNum = Math.round(y / pxBetweenHashes);
    let yOfHash = hashNum * pxBetweenHashes;

    // Follows the same pattern as the hash
    hash = hashFromBits(3 - hashNum);

    fbSteps = roundToGoodNum(Math.round(Math.abs(yOfHash - y) / pxPerStep * 100) / 100);
    fbSteps = Math.round((fbSteps + Number.EPSILON) * 100) / 100

    // If the x pos is really close to the line
    if (Math.abs(yOfHash - y) <= 0.01) {
        dir = "On";
    }
    // If the x pos is to the LEFT of the line
    else if (x < xOfLine) {
        fbDir = "Behind";
    }
    // If the x pos is to the RIGHT of the line
    else {
        fbDir = "Front";
    }

    return {
        ...baseDot,
        "direction": dir,
        "line": line.toString(),
        "steps": steps,
        "side": side,
        "fb_steps": fbSteps,
        "fb_direction": fbDir,
        "use_hash": hash,
    }
}


/**
 * Position from bits
 * @param {int} binary - binary 29 bits representing the position information
 * @param {int} width
 * @param {int} height
 * @return cords in px
 */
const posFromBits = (binary, width, height, dot, dot_label) => {
    let bDir 		= parseInt(binary >>> 27);
    // let dir         = directionFromBits(bDir);

    let bLine 		= parseInt(binary % Math.pow(2, 27)) >>> 23;
    let line        = lineFromBits(bLine);

    let bSteps	 	= parseInt(binary % Math.pow(2, 23)) >>> 15;
    let steps       = stepsFromBits(bSteps);

    let bSide 		= parseInt(binary % Math.pow(2, 15)) >>> 14;
    let side        = sideFromBits(bSide);


    let bFBSteps	= parseInt(binary % Math.pow(2, 14)) >>> 4;
    let fbSteps     = stepsFromBits(bFBSteps);

    let bFBDir 		= parseInt(binary % Math.pow(2, 4)) >>> 2;
    // let fbDir       = fbDirFromBits(bFBDir);


    let bHash 		= parseInt(binary % Math.pow(2, 2));
    // let hash        = hashFromBits(bHash);

    /*
    if (dir != dot.direction || line != dot.line || steps != dot.steps || side != dot.side || fbSteps != dot.fb_steps || fbDir != dot.fb_direction || hash != dot.use_hash) {
        console.log("\r\nProblem with dot (" + dot.show_user_id + ") ");

        console.log(dir + " : " + dot.direction);
        console.log(line + " : " + dot.line);
        console.log(steps + " : " + dot.steps);
        console.log(side + " : " + dot.side);
        console.log(fbSteps + " : " + dot.fb_steps);
        console.log(fbDir + " : " + dot.fb_direction);
        console.log(hash + " : " + dot.use_hash);
        return {x: 0, y: 0};
    }
    */

    const YARDS_IN_STEP = 0.625;
    // const FT_IN_STEP = 1.875;

    // Default Direction Modifier to "OUTSIDE"
    let dModifier = -1;
    let sModifier = 0;
    let fbdModifier = 1;

    // "INSIDE"
    if (bDir === 1) {
        dModifier = 1;
    }
    // "ON"
    else if (bDir === 0) {
        dModifier = 0;
    }

    // Side 1 (left side)
    if (side === 1) {
        sModifier = 1;
    }
    // Side 2 (right side)
    else {
        line  = side2Convert(line);
        sModifier = -1;
    }

    // NOT UPDATED!!!
    // 0-100 yd    100 yd        width        1
    // -------- * --------   *   -----   *  ----- = Number between 0 and width
    //            100 width        1         100
    
    // 0-100
    let relX = line + (dModifier * sModifier * steps * YARDS_IN_STEP);
    // Round to 2 decimals
    let x = Math.round(relX * (width / 100) * 100) / 100;

    // "BEHIND"
    if (bFBDir === 2) {
        fbdModifier = -1;
    } 
    // "ON"
    else if (bFBDir === 0) {
        fbdModifier = 0;
    }

    let hashY = bHashConvert(bHash);

    let oneStep = height / 1920 * 22.5;
    let relY = (fbdModifier * fbSteps * oneStep);
    let y = Math.round((height * hashY + relY) * 100) / 100;

    return {x: x, y: y};
}

/**
 * 
 * @param {int} bits 0-2
 * @returns direction string
 */
const directionFromBits = (bits) => {

    if (bits === 0) {
        return "On";
    }

    if (bits === 1) {
        return "Inside";
    }

    return "Outside";


}

/**
 * Line From Bits
 * @param {int} bits 0-10
 * @returns line (ie 5, 10..., 50)
 */
const lineFromBits = (bits) => {
    return bits * 5;
}

/**
 * Steps from bits
 * @param {int} binarySteps 8-10 bits, generated by stepsToBits() in backend
 * @returns steps
 */
const stepsFromBits = (binarySteps) => {
    let integer = binarySteps >>> 4;
    let decimal = binarySteps % 16;

    if (decimal === 1)
        return integer + 0.1;

    if (decimal === 2)
        return integer + 0.2;

    if (decimal === 3)
        return integer + 0.25;

    if (decimal === 4)
        return integer + 0.3;

    if (decimal === 5)
        return integer + 0.4;

    if (decimal === 6)
        return integer + 0.5;

    if (decimal === 7)
        return integer + 0.6;

    if (decimal === 8)
        return integer + 0.7;

    if (decimal === 9)
        return integer + 0.75;

    if (decimal === 10)
        return integer + 0.8;

    if (decimal === 11)
        return integer + 0.9;

    return integer;
}


/**
 * Side From Bits
 * @param {int} bits 0-1
 * @returns side 1-2
 */
const sideFromBits = (bits) => {
    return bits + 1;
}

/**
 * Forward-Backward Direction From Bits
 * @param {int} bits 0-3
 * @returns fb direction string
 */
const fbDirFromBits = (bits) => {
    if (bits === 0)
        return "On";
    
    if (bits === 1)
        return "Front";
    
    return "Behind";
}


/**
 * Hash From Bits
 * @param {int} bits 0-3
 * @returns hash string
 */
const hashFromBits = (bits) => {
    if (bits === 0)
        return "Front Side";
    
    if (bits === 1)
        return "Front Hash";
    
    if (bits === 2)
        return "Back Hash";
    
    return "Back Side";
}

/**
 * Binary Hash Convert
 * @param {int} bits 0-3
 * @returns 
 */
const bHashConvert = (bits) => {
    if (bits === 0) {
        return 1;
    }
    if (bits === 1) {
        return 2/3;
    }
    if (bits === 2){
        return 1/3;
    }
    return 0;
}


export {convertDotToCords, cordsToDot};
export default convertDotToCords;