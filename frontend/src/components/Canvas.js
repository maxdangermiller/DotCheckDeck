import React, {useRef, useEffect, useState} from 'react'

const FUTURE_DOT_COLOR = "rgb(255, 0, 0)"

const Canvas = props => {

    const { draw, setDimensions, curDimensions, ...rest } = props
    // const { draw, postdraw=_postdraw, ...rest } = props
    // const canvasRef = useCanvas(draw, {predraw, postdraw})
    const canvasRef = useRef(null)
    const [dots, setDots] = useState([]);
    const [hoverDot, setHoverDot] = useState({});

    var useWidth = 0;

    useEffect(() => {

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let frameCount = 0
        let animationFrameId

        const drawUserDialogue = (dotX, dotY, dot) => {
            // console.log("drawing dialogue: " + dot["userLabel"])
            const w = canvas.width * 0.075;
            const h = canvas.height * 0.075;
            const x = dotX + canvas.height * 0.01;
            const y = dotY - h - canvas.height * 0.01;
            const radius = 5;



            const r = x + w;
            const b = y + h;

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
            context.font = canvas.height * 0.03 + 'px serif';
            context.fillStyle = "black";
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(dot["userLabel"], x + w * 0.2, y + h * 0.25);

            if (dot["userName"] !== "None None") {
                context.font = canvas.height * 0.025 + 'px serif';

                context.fillText(dot["userName"], x + w * 0.5, y + h * 0.6);
                context.closePath();
            } else {
                context.font = canvas.height * 0.025 + 'px serif';
                context.fillStyle = "red";

                context.fillText("Unactivated", x + w * 0.5, y + h * 0.6);
                context.closePath();
            }
        }

        const drawLine = (x0, y0, x1, y1, color) => {
            // console.log("(" + x0, ", " + y0 + ") -> (" + x1 + ", " + y1 + ")");
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.stroke();
            context.closePath();

            drawPoint(x1, y1, FUTURE_DOT_COLOR, "");

            // const w = canvas.width;
            // const h = canvas.height;
        };

        const drawPoint = (x, y, color, userLabel) => {
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, canvas.height * 0.006, 0, 2 * Math.PI);
            context.fill();
            context.closePath();

            context.beginPath();
            context.font = canvas.height * 0.025 + 'px serif';
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillText(userLabel, x, y + canvas.height * 0.02);
            context.closePath();
        };

        const clear = () => {
            setDots([]);
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
                context.font = canvas.height * 0.05 + 'px serif';
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
                context.font = canvas.height * 0.05 + 'px serif';
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
            ctx.save();

            // Dynamic resizing!
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                // 15x8
                canvasRef.current.style.width = "100%";
                canvasRef.current.style.height = "100%";

                const heightRatio = canvas.offsetWidth * 8 / 15;
                const widthRatio = canvas.offsetHeight * 15 / 8;

                if (heightRatio > canvas.offsetHeight && widthRatio ) {
                    canvas.width  = widthRatio;
                    // canvas.height = canvas.offsetHeight;
                    canvas.height = canvas.offsetHeight;

                    useWidth = false;

                    canvasRef.current.style.width = "";
                    canvasRef.current.style.height = "100%";
                } else {
                    canvas.width  = canvas.offsetWidth;
                    // canvas.height = canvas.offsetHeight;
                    canvas.height = heightRatio;

                    useWidth = true;

                    canvasRef.current.style.width = "100%";
                    canvasRef.current.style.height = "";
                }
            }

            if (curDimensions["w"] !== canvas.width || curDimensions["h" !== canvas.height]) {
                setDimensions({"w": canvas.width, "h": canvas.height});
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
            // console.log(data)
            if (data["lines"]) {
                for (var x = 0; x < data["lines"].length; x++) {
                    const line = data["lines"][x];
                    const color = "rgb(" + line["r"] + ", " + line["g"] + ", " + line["b"] + ")";
                    drawLine(line["startX"], line["startY"], line["endX"], line["endY"], color);
                    // console.log(line);
                }
            }

            if (data["pts"]) {
                for (var x = 0; x < data["pts"].length; x++) {
                    const dot = data["pts"][x];
                    const color = "rgb(" + dot["r"] + ", " + dot["g"] + ", " + dot["b"] + ")";
                    drawPoint(dot["x"], dot["y"], color, dot["userLabel"]);
                    setDots(dots => [...dots, dot])
                }
            }

            if (data["sets"] && data["curSet"] !== null) {
                if (data["sets"][data["curSet"]] !== undefined) {
                    context.beginPath();
                    context.font = '36px serif';
                    context.fillStyle = "black";
                    context.textBaseline = "middle";
                    context.textAlign = "center";
                    context.fillText(data["sets"][data["curSet"]]["setNumb"], canvas.width * 0.025, canvas.height * 0.9);
                    context.closePath();
                }
            }

            if (hoverDot["x"] !== undefined) {
                drawUserDialogue(hoverDot["x"], hoverDot["y"], hoverDot);
            }
            ctx.restore()

            frameCount++
            animationFrameId = requestAnimationFrame(() => render(ctx))
        }
        render(context)


        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [draw, hoverDot])

    const canvasClick = (event) => {
        var x = event.pageX - (canvasRef.current.offsetLeft + canvasRef.current.clientLeft),
            y = event.pageY - (canvasRef.current.offsetTop + canvasRef.current.clientTop);

        const margin = canvasRef.current.height * 0.006;

        var wasOnDot = false;

        // Collision detection between clicked offset and element.
        dots.forEach(function(dot) {
            if (y > dot["y"] - margin && y < dot["y"] + margin  && x > dot["x"] - margin && x < dot["x"] + margin) {
                // alert('This is: ' + dot["userLabel"]);
                wasOnDot = true;
                setHoverDot(dot);
            }
        });

        if (!wasOnDot) {
            setHoverDot({});
        }
    }

    return <canvas ref={canvasRef} style={{position: 'absolute', width: '100%'}} onClick={(e) => canvasClick(e)} onMouseMove={(e) => canvasClick(e)}/>
}

export default Canvas