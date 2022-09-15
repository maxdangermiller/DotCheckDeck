import React, { useRef, useEffect } from 'react'
import useCanvas from './useCanvas'

var lastOffsetSize = 0;

const Canvas = props => {

    const { draw, ...rest } = props
    // const { draw, postdraw=_postdraw, ...rest } = props
    // const canvasRef = useCanvas(draw, {predraw, postdraw})
    const canvasRef = useRef(null)

    useEffect(() => {

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let frameCount = 0
        let animationFrameId

        const drawLine = (x0, y0, x1, y1, color) => {
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.stroke();
            context.closePath();

            // const w = canvas.width;
            // const h = canvas.height;
        };

        const drawPoint = (x, y, color, userLabel) => {
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, 4, 0, 2 * Math.PI);
            context.fill();
            context.closePath();

            context.beginPath();
            context.font = '14px serif';
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(userLabel, x, y);
            context.closePath();
        };

        const clear = () => {
            // Clear everything
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // This draws the 5 yard lines up through the 50, from the left
            for (var x = 0; x < 11; x++) {
                var val = x * (canvas.width / 20);

                context.beginPath();
                context.moveTo(val, 0);
                context.lineTo(val, canvas.height);
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.stroke();
                context.closePath();

                context.beginPath();
                context.font = '16px serif';
                context.textBaseline = "middle";
                context.textAlign = "center";
                context.fillText(x * 5, val, canvas.height * 0.75);
                context.closePath();
            }

            // This draws the 5 year lines following the 50, from the left
            for (var x = 11; x < 21; x++) {
                var val = x * (canvas.width / 20);

                context.beginPath();
                context.moveTo(val, 0);
                context.lineTo(val, canvas.height);
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.stroke();
                context.closePath();

                context.beginPath();
                context.font = '16px serif';
                context.textBaseline = "middle";
                context.textAlign = "center";
                context.fillText((20 - x) * 5, val, canvas.height * 0.75);
                context.closePath();
            }

            // Draw the front HS Hash
            context.beginPath();
            context.moveTo(0, canvas.height * (1 / 3));
            context.lineTo(canvas.width, canvas.height * (1 / 3));
            context.strokeStyle = "black";
            context.lineWidth = 2;
            context.stroke();
            context.closePath();
            
            // Draw the back HS Hash
            context.beginPath();
            context.moveTo(0, canvas.height * (2 / 3));
            context.lineTo(canvas.width, canvas.height * (2 / 3));
            context.strokeStyle = "black";
            context.lineWidth = 2;
            context.stroke();
            context.closePath();
        };

        const render = ctx => {
            ctx.save()
            if (lastOffsetSize !== canvas.offsetWidth || lastOffsetSize !== canvas.offsetHeight) {
                let size = Math.min(canvas.offsetWidth, canvas.offsetHeight);
                lastOffsetSize = size;
                canvas.width  = size;
                canvas.height = size;
            }

            clear();
            
            // Calls a function provided in props that returns a dict of values
            var data = draw()

            /* 
            -- Draw Return Structure --
            {
                "lines": [ {"startX": 0, "startY": 0, "endX": 100, "endY": 100} ],
                "pts": [ { "x": 0, "y": 0, "r": 255, "g": 255, "b": 255 } ]
            }
            */
            console.log(data)
            if (data["lines"]) {
                for (var x = 0; x < data["lines"].length; x++) {
                    var line = data["lines"][x];
                    var color = "rgb(" + line["r"] + ", " + line["g"] + ", " + line["b"] + ")";
                    drawLine(line["startX"], line["startY"], line["endX"], line["endY"], color);
                }
            }

            if (data["pts"]) {
                for (var x = 0; x < data["pts"].length; x++) {
                    var dot = data["pts"][x];
                    var color = "rgb(" + dot["r"] + ", " + dot["g"] + ", " + dot["b"] + ")";
                    drawPoint(dot["x"], dot["y"], color, dot["userLabel"]);
                }
            }
            
            ctx.restore()

            frameCount++
            animationFrameId = requestAnimationFrame(() => render(ctx))
        }
        render(context)


        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [draw])

    return <canvas ref={canvasRef} style={{position: 'absolute', width: '100%', height: '100%'}}/>
}

export default Canvas