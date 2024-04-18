const STEPS_TO_5_MAJOR = 2;
const STEPS_TO_5_MINOR = 8;

// Reversed because it draws top to bottom
const FRONT_HASH_RATIO = 2/3;
const BACK_HASH_RATIO = 1/3;
const FRONT_COLLAGE_HASH_RATIO = 10/16;
const BACK_COLLAGE_HASH_RATIO = 6/16;

const RELATIVE_HASH_HEIGHT = 0.01;
const RELATIVE_HASH_WIDTH = 0.005;

const GRID_MAJOR_DIVISION_COLOR = "rgba(100, 100, 255, 0.6)";
const GRID_MINOR_DIVISION_COLOR = "rgba(200, 200, 255, 0.4)";
const COLLAGE_HASH_COLOR = "rgb(100, 0, 0)";

/**
 * Draws the Yard Lines, hashes, and Grid Lines
 * @param {Canvas} canvas 
 * @param {CanvasRenderingContext2D} context 
 * @param {Object} userOptions 
 * @returns 
 */
function drawHashes(canvas, context, userOptions) {
    /**
     * Draw a Line 
     * @param {Float} x0 
     * @param {Float} y0 
     * @param {Float} x1 
     * @param {Float} y1 
     * @param {Color} color 
     * @param {Float} thickness 
     */
    const drawLine = (x0, y0, x1, y1, color, thickness) => {
        // console.log("(" + x0, ", " + y0 + ") -> (" + x1 + ", " + y1 + ")");
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = thickness;
        context.stroke();
        context.closePath();

        // const w = canvas.width;
        // const h = canvas.height;
    };
    

    /**
     * This draws a vertical grid line across the screen
     * @param {Float} x 
     * @param {Color} color 
     * @param {Integer} thickness 
     */
    const drawVerticalGirdLine = (x, color, thickness) => {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.strokeStyle = color;
        context.lineWidth = thickness;
        context.stroke();
        context.closePath();
    };

    /**
     * This draws a horizontal grid line across the screen
     * @param {Float} y 
     * @param {Color} color 
     * @param {Integer} thickness 
     */
    const drawHorizontalGirdLine = (y, color, thickness) => {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.strokeStyle = color;
        context.lineWidth = thickness;
        context.stroke();
        context.closePath();
    };

    /**
     * Draws the little hash marks
     * @param {Float} startX 
     * @param {Float} endX 
     * @param {Float} y 
     * @param {Color} color 
     */
    const drawHash = (startX, endX, y, color) => {
        // Draw little lines for each yard | There are 5 yards between each major yard line 
        for (let i = 0; i < 5; i++) {
            const x = ((endX - startX) / 5) * i + startX;

            drawLine(x, y - canvas.height * RELATIVE_HASH_HEIGHT, x, y + canvas.height * RELATIVE_HASH_HEIGHT, color, 1)
        }
    }

    /**
     * Draw all the Vertical grid lines
     * @param {Float} startX 
     * @param {Float} endX 
     * @param {Boolean} isMajor 
     */
    const drawVerticalGrid = (startX, endX, isMajor) => {
        for (let i = 1; i < STEPS_TO_5_MAJOR; i++) {
            const x = ((endX - startX) / STEPS_TO_5_MAJOR) * i + startX;

            if (isMajor) {
                drawVerticalGirdLine(x, GRID_MAJOR_DIVISION_COLOR, 1);
            } else {
                 // Draw all the minor division grid lines between the major divisions
                for (let ii = 1; ii < STEPS_TO_5_MINOR; ii++) {
                    const x2 = ((endX - startX) / STEPS_TO_5_MINOR) * ii + startX;

                    if (x2 !== x) {
                        drawVerticalGirdLine(x2, GRID_MINOR_DIVISION_COLOR, 1);
                    }
                
                }
            }
        
        }
        
    }

    /**
     * This draws all the Horizontal grid lines centered on the hashRatio
     * @param {Float} hashRatio ratio 0-1
     * @param {Boolean} isMajor 
     */
    const drawHorizontalGrid = (hashRatio, isMajor) => {
        const majorHashes = 8;
        const hashLocation = hashRatio * canvas.height;
        // height(px) -> ?height/1" 
        // 22.5" = 1 step
        // 90" = 4 steps
        // 1920" = 
        const oneStep = canvas.height / 1920 * 22.5;
        const hashDistance = oneStep * 16;
        const startY = hashLocation - hashDistance;
        const endY = hashLocation + hashDistance;
        // console.log(hashes);
        
        for (let i = 1; i < majorHashes; i++) {
            // const y = ((endY - startY) / (majorHashes + 1)) * i + startY;
            // const nextY = ((endY - startY) / (majorHashes + 1)) * (i + 1) + startY;
            const y = startY + oneStep * i * 4;
            const nextY = startY + oneStep * (i + 1) * 4;
            // console.log(y, nextY, oneStep);
            
            if (isMajor && y > 0 && y < canvas.height) {
                drawHorizontalGirdLine(y, GRID_MAJOR_DIVISION_COLOR, 1);
            }
            // Draw all the minor division grid lines between the major divisions
            else if (nextY <= endY) {
                for (let ii = 1; ii < (STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR); ii++) {
                    const y2 = ((nextY - y) /  (STEPS_TO_5_MINOR / STEPS_TO_5_MAJOR)) * ii + y;

                    if (y2 !== y && y2 !== nextY && y2 > 0 && y2 < canvas.height) {
                        drawHorizontalGirdLine(y2, GRID_MINOR_DIVISION_COLOR, 1);
                    }
                
                }
            }
            
        }
    }

    /**
     * This draws the Grid Lines
     */
    const drawGridLines = () => {
        drawHorizontalGrid(0, false);
        drawHorizontalGrid(FRONT_HASH_RATIO, false);
        drawHorizontalGrid(BACK_HASH_RATIO, false);
        drawHorizontalGrid(1, false);

        for (let x = 0; x < 21; x++) {
            let val = x * (canvas.width / 20);
            let nextVal = (x + 1) * (canvas.width / 20);

            if (nextVal <= canvas.width) {
                drawVerticalGrid(val, nextVal, false);
            }
        }

        drawHorizontalGrid(0, true);
        drawHorizontalGrid(FRONT_HASH_RATIO, true);
        drawHorizontalGrid(BACK_HASH_RATIO, true);
        drawHorizontalGrid(1, true);

        for (let x = 0; x < 21; x++) {
            let val = x * (canvas.width / 20);
            let nextVal = (x + 1) * (canvas.width / 20);

            if (nextVal <= canvas.width) {
                drawVerticalGrid(val, nextVal, true);
            }
        }
    }

    /**
     * This draws the Yard Lines, hashes, and Grid Lines
     */
    const drawGrid = () => {
        // Draw Grid Lines
        drawGridLines();

        // This draws the 5 yard lines up through the 50, from the left
        for (let x = 0; x < 21; x++) {
            let val = x * (canvas.width / 20);
            let nextVal = (x + 1) * (canvas.width / 20);

            drawVerticalGirdLine(val, "black", 2);
            
            
            if (nextVal <= canvas.width) {
                drawHash(val, nextVal, canvas.height * FRONT_HASH_RATIO, "black");
                drawHash(val, nextVal, canvas.height * BACK_HASH_RATIO, "black");
                if (userOptions.showCollegeHash) {
                    drawHash(val, nextVal, canvas.height * FRONT_COLLAGE_HASH_RATIO, COLLAGE_HASH_COLOR);
                    drawHash(val, nextVal, canvas.height * BACK_COLLAGE_HASH_RATIO, COLLAGE_HASH_COLOR);
                }
            }

            // Draw little lines on the hash marks | FRONT HASH
            drawLine(
                val - canvas.width * RELATIVE_HASH_WIDTH, 
                canvas.height * FRONT_HASH_RATIO, 
                val + canvas.width * RELATIVE_HASH_WIDTH, 
                canvas.height * FRONT_HASH_RATIO,
                "black", 1
            );
            // Draw little lines on the hash marks | BACK HASH
            drawLine(
                val - canvas.width * RELATIVE_HASH_WIDTH, 
                canvas.height * BACK_HASH_RATIO, 
                val + canvas.width * RELATIVE_HASH_WIDTH, 
                canvas.height * BACK_HASH_RATIO,
                "black", 1
            );
            
            if (userOptions.showCollegeHash) {
                // Draw little lines on the hash marks | FRONT COLLAGE HASH
                drawLine(
                    val - canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * FRONT_COLLAGE_HASH_RATIO, 
                    val + canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * FRONT_COLLAGE_HASH_RATIO,
                    COLLAGE_HASH_COLOR, 1
                );
                // Draw little lines on the hash marks | BACK COLLAGE HASH
                drawLine(
                    val - canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * BACK_COLLAGE_HASH_RATIO, 
                    val + canvas.width * RELATIVE_HASH_WIDTH, 
                    canvas.height * BACK_COLLAGE_HASH_RATIO,
                    COLLAGE_HASH_COLOR, 1
                );
            }
            
            context.beginPath();
            context.fillStyle = "black";
            context.font = canvas.height * 0.05 + 'px serif';
            context.textBaseline = "middle";
            context.textAlign = "center";

            if (x > 10 && x !== 20) {
                context.fillText((20 - x) * 5, val, canvas.height * 0.75);
            } else if (x !== 0 && x !== 20) {
                context.fillText(x * 5, val, canvas.height * 0.75);
            }
        
            context.closePath();
        }

        // Draw top and bottom borders
        drawHorizontalGirdLine(0, "black", 2);
        drawHorizontalGirdLine(canvas.height, "black", 2);
    }

    drawGrid();
}

export default drawHashes;