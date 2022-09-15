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

            if (!emit) { return; }
            // const w = canvas.width;
            // const h = canvas.height;
        };

        const drawPoint = (x, y, color) => {
            context.beginPath();
            context.fillStyle = color;
            context.fillCircle(x-1, y-1, 2, 2);
            context.fill();
        };

        const clear = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
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
            for (var x = 0; x < data["lines"].length; x++) {
                line = data["lines"][x];
                color = "rgb(" + line["r"] + ", " + line["g"] + ", " + line["b"] + ")";
                drawLine(line["startX"], line["startY"], line["endX"], line["endY"], color);
            }

            for (var x = 0; x < data["pts"].length; x++) {
                dot = data["pts"][x];
                color = "rgb(" + line["r"] + ", " + line["g"] + ", " + line["b"] + ")";
                drawPoint(line["x"], line["y"], color);
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