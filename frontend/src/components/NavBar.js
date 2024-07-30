import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Nav.css';
import logo from '../icons/logo.svg';
import {Nav,  Navbar, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

const NavBar = (props) => {
    const { loggedIn, logout, isAdminAuthorized } = props

	const location = useLocation();
	const [ show, setShow ] = useState(true);

	useEffect(() => {
		console.log('Location changed');

		setShow(location.pathname.substring(0, 4) !== "/app")
	}, [location]);

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const isPWAAdded = window.matchMedia('(display-mode: standalone)').matches;

	if (!show || location.pathname.substring(0, 4) === "/app" || location.pathname.substring(0, 5) === "/beta"){
		return <></>
	}

	return (
		<Navbar bg="dark" variant="dark" style={{height: "8vh", minHeight: "36px", display: show}}>
			<Container fluid>
				<Nav className="ml-auto">
					<Navbar.Brand href={isMobile && isPWAAdded ? "/app" : "/"}>
						<img src={logo} alt="" height="30px" width="30px"/>
					</Navbar.Brand>
					{
						isAdminAuthorized() ?
						<>
							<Nav.Link href="/admin">Admin</Nav.Link>
						</>
						: null
					}
					<Nav.Link href="/about">About Us</Nav.Link>
				</Nav>
				<Nav className="mr-auto">
					{
						loggedIn
							? <Nav.Link onClick={logout} href="#logout">Logout</Nav.Link>
							: <>
								<Nav.Link href="/activate">Activate</Nav.Link>
								<Nav.Link href="/login">Login</Nav.Link>
							</>
					}
				</Nav>
			</Container>
		</Navbar>
	);


};

export default NavBar;