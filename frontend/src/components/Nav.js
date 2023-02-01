import React, { useRef, useEffect, useState} from 'react';
import './Nav.css';

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
		<nav className="navbar navbar-expand-sm bg-dark navbar-dark customNavbar">
			<ul className="container-fluid justify-content-start customULNav">
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

			</ul>
			<ul className="container-fluid justify-content-end customULNav">
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
			
		</nav>
	);

};

export default Nav;