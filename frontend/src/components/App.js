import React, { useState, useEffect } from 'react'
import logo from '../logo.svg';
import './App.css';
import Canvas from './Canvas'

function App() {
  const [dots, setDots] = useState([]);
  const [paths, setPaths] = useState([]);
  const [curSet, setCurSet]  = useState("1");
  const [width, setWidth]  = useState(1500);
  const [height, setHeight]  = useState(800);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/cords?set_numb=" + curSet + "&width=" + width + "&height=" + height)
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result)
          setDots(result);
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          console.log(error);
        }
    );
    fetch("http://127.0.0.1:5000/paths?set_numb_1=" + curSet + "&width=" + width + "&height=" + height)
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result)
          setPaths(result);
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          console.log(error);
        }
    );
  }, [])



  const draw = () => {
    /* 
    {
      "lines": [
        {
          "startX": 0
          "startY": 0
          "endX": 100
          "endY": 100
        }
      ],
      "pts": [
        {
          "x": 0,
          "y": 0,
          "r": 255,
          "g": 255,
          "b": 255
        }
      ]
    }
    */
    return {"dots": dots["dots"], "lines": paths["lines"], "paths": paths["paths"]};
  }

  const setDimensions = (width, height) => {
    setWidth(width);
    setHeight(height);
  }

  return (
    <Canvas draw={draw} setDimensions={setDimensions} />
  );
}

export default App;
