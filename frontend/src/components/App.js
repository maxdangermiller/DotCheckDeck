import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css';
import Viewer from './Viewer';
import Activate from './Activate';


function App() {
	
	return (
		<Router>
			<Routes>
				<Route path="/" exact element={<Viewer />} />
				<Route path="/activate" exact element={<Activate />} />
				<Route path="*" element={<h1>404, you've been dumb</h1>} />
			</Routes>
		</Router>
	);
}

export default App;
