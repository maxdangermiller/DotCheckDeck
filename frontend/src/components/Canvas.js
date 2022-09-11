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

        const drawLine = (x0, y0, x1, y1, color, emit) => {
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.stroke();
            context.closePath();

            if (!emit) { return; }
            const w = canvas.width;
            const h = canvas.height;

            socket.emit('drawing', {
                x0: x0 / w,
                y0: y0 / h,
                x1: x1 / w,
                y1: y1 / h,
                color,
            });
        };

        const drawPoint = (x, y, color, emit) => {
            context.beginPath();
            context.fillStyle = color;
            context.fillRect(x, y, 1, 1);
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

            var data = draw()
            if (data['type'] === "drawLine") {
                drawLine(data['startX'], data['startY'], data['endX'], data['endY'])
            } else if (data['type'] === "draw") {
                for (let i = 0; i < data['pts'].length; i++) {
                    const x = data['pts'][i]['x'] * (canvas.width / 512);
                    const y = data['pts'][i]['y'] * (canvas.width / 512);

                    const r = data['color']['r']
                    const g = data['color']['g']
                    const b = data['color']['b']

                    let color = "rgb(" + r + "," + g + "," + b +")"


                    drawPoint(x, y, color);
                }
            } else if (data['type'] === "clear") {
                clear();
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