import React, { useRef, useEffect, useState} from 'react';
import './Nav.css';
import logo from '../logo.svg';

const Nav = (props) => {
    const { token, loggedIn, logout, isAdminAuthorized, ...rest } = props

	const goToEditor = () => {
		window.location.href = "/";
	}
	
	const goToAdmin = () => {
		window.location.href = "/admin";
	}
	
	const goToAdminTimeline = () => {
		window.location.href = "/admin-timeline";
	}

    return (
		<nav className="navbar navbar-expand-lg bg-dark navbar-dark customNavbar">
			<div className="d-flex flex-row align-items-center justify-content-between customULNav">
				<a className="navbar-brand" href="#">
					<img src={logo} alt="" width="24" height="24" />
				</a>
				<div className="d-flex flex-row align-items-center justify-content-start" style={{width: "55%", height: "100%"}}>
				{
					token !== "" && token !== undefined
						? <ul className="navbar-nav">
							<li className="nav-item">
								<a className="nav-link" onClick={goToEditor}>Home</a>
							</li>
							{
								isAdminAuthorized() ?
								<li className="nav-item">
									<a className="nav-link" onClick={goToAdmin}>Admin</a>
								</li>
								: null
							}
							{
								isAdminAuthorized() ?
								<li className="nav-item">
									<a className="nav-link" onClick={goToAdminTimeline}>Admin Timeline</a>
								</li>
								: null
							}
						</ul>
						: null
				}
				</div>
				<div className="d-flex flex-row align-items-center justify-content-end" style={{width: "40%", height: "100%"}}>
				<a className="nav-link" onClick={logout}>Logout</a>
				{
					loggedIn
						? <ul className="navbar-nav">
							<li className="nav-item">
								<a className="nav-link" onClick={logout}>Logout</a>
							</li>
						</ul>
						: <ul className="navbar-nav">
							<li className="nav-item">
								<a className="nav-link" href="/activate">Activate</a>
							</li>
							<li className="nav-item">
								<a className="nav-link" href="/login">Login</a>
							</li>
						</ul>
				}
				</div>
			</div>
		</nav>
	);

};

/*
<ul className="container-fluid d-flex flex-row justify-content-end customULNav">
				{
					loggedIn
						? <ul className="navbar-nav">
							<li className="nav-item">
								<a className="nav-link" onClick={logout}>Logout</a>
							</li>
						</ul>
						: <ul className="navbar-nav">
							<li className="nav-item">
								<a className="nav-link" href="/activate">Activate</a>
							</li>
							<li className="nav-item">
								<a className="nav-link" href="/login">Login</a>
							</li>
						</ul>
				}
			</ul>
*/

export default Nav;