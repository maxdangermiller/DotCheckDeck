import React, { useState, useEffect } from 'react'
import logo from '../logo.svg';
import './App.css';
import Canvas from './Canvas'

function App() {
  const {dots, setDots} = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/dots?set_numb=1")
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
      )
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
    return {"lines": [], "pts": []}
  }

  return (
    <Canvas draw={draw}/>
  );
}

export default App;
