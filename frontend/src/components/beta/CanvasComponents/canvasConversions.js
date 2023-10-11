// Reversed because it draws top to bottom
const FRONT_HASH_RATIO = 2/3;
const BACK_HASH_RATIO = 1/3;
const FRONT_COLLAGE_HASH_RATIO = 10/16;
const BACK_COLLAGE_HASH_RATIO = 6/16;

function canvasConversions(userOptions) {

    /**
     * Converts the marching steps unit to pixels via the height of window
     * @param {Float} steps Marching steps unit
     * @param {Integer} height Height of screen
     * @returns {Integer} pixels
     */
    const steps_to_px = (steps, height) => {
        let oneStep = height / 1920 * 22.5;
        return steps * oneStep;
    }        

    /**
     * Takes the side and line and give the percentage out of 100
     * Gives side to side ratio
     * @param {Integer} side either 1 or 2
     * @param {String} line yard line 
     * @returns {Float} 0-1 ratio
     */
    const sideLineRatioConvert = (side, line) => {
        if (side === 1) { return parseInt(line) / 100; }

        switch (line) {
            case "50":
                return 0.5;
            case "45":
                return 0.55;
            case "40":
                return 0.6;
            case "35":
                return 0.65;
            case "30":
                return 0.7;
            case "25":
                return 0.75;
            case "20":
                return 0.8;
            case "15":
                return 0.85;
            case "10":
                return 0.9;
            case "5":
                return 0.95;
            case "0":
                return 1;
        
            default:
                return -1;
        }
    };

    /**
     * Takes the string of the hash and converts it to a percentage 
     * Gives front to back ratio
     * @param {String} hash "Front Hash", "Back Hash", "Front side", or "Back side"
     * @param {Boolean} useCollegeHash Use College Hash
     * @returns {Float} 0-1 ratio
     */
    const hashRatioConvert = (hash, useCollegeHash) => {
        if (hash === "Front side") { return 1; }
        if (hash === "Front Hash") { 
            if (useCollegeHash) {
                return FRONT_COLLAGE_HASH_RATIO;
            }
            return FRONT_HASH_RATIO; 
        }
        if (hash === "Back Hash") {
            if (useCollegeHash) {
                return BACK_COLLAGE_HASH_RATIO;
            }
            return BACK_HASH_RATIO;
        }

        return 0;
    }

    /**
     * 
     * @param {Float} steps 
     * @param {String} hash "Front Hash", "Back Hash", "Front side", or "Back side"
     * @param {Float} hashY College Hash Position
     * @param {Float} altHashY High School Hash Position
     * @param {Float} y Y Position of dot 
     * @returns {Float} y position of hash
     */
    const hashStepsCorrect = (steps, hash, hashY, altHashY, y) => {
        if (!userOptions.useCollegeHash) { return steps; }

        // console.log(hashY, altHashY, y)

        if (hash === "Front Hash") { 
            // Past College Hash
            if (altHashY - y >= 0) {
                return Math.abs(steps - 4);
            }
            // Between College Hash and HS Hash
            if (hashY - y >= 0) {
                return 4 - steps;
            }
            // Before HS Hash
            return steps + 4;
        }
        if (hash === "Back Hash") {
            // Past HS Hash
            if (hashY - y >= 0) {
                return steps + 4;
            }
            // Between College Hash and HS Hash
            if (altHashY - y >= 0) {
                return 4 - steps;
            }
            // Before College Hash
            return steps - 4;
        }

        return steps;
    }

    return {
        steps_to_px: steps_to_px,
        sideLineRatioConvert: sideLineRatioConvert,
        hashRatioConvert: hashRatioConvert,
        hashStepsCorrect: hashStepsCorrect,
    };
}

export default canvasConversions;