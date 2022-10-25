import React, { useRef, useEffect, useState} from 'react';
import './Nav.css';

const Nav = (props) => {
    const { token, loggedIn, logout, ...rest } = props

    return (
		<nav className="navbar navbar-expand-sm bg-dark navbar-dark customNavbar">
			<ul className="container-fluid justify-content-start customULNav">
				{
					token !== "" && token !== undefined
						? <ul className="navbar-nav">
							
							<li className="nav-item dropdown">
								<a className="nav-link dropdown-toggle" id="navbarScrollingDropdown" role="button"
								   data-bs-toggle="dropdown" aria-expanded="false">
									Code
								</a>
								<ul className="dropdown-menu" aria-labelledby="navbarScrollingDropdown">
									<li><a className="dropdown-item" >Package Manager</a></li>
								</ul>
							</li>
						</ul>
						: props.token !== "" && props.token !== undefined
							?<ul className="navbar-nav">
								<li className="nav-item">
									<a className="nav-link" >Open Editor</a>
								</li>
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