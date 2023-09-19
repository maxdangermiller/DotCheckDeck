import React, { useRef, useEffect, useState} from 'react';
import './Nav.css';
import logo from '../logo.svg';
import {Nav,  Navbar, NavDropdown, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

const NavBar = (props) => {
    const { token, loggedIn, logout, isAdminAuthorized, ...rest } = props

	const getViewerOptions = () => {
		if (window.location.pathname === "/basic") {
			return <Nav.Link href="/">Normal</Nav.Link>;
		}
		if (window.location.pathname === "/") {
			return <Nav.Link href="/basic">Basic</Nav.Link>;
		}
		return <></>;
	}

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	return (
		<Navbar bg="dark" variant="dark" style={{height: "8vh", minHeight: "36px"}}>
			<Container fluid>
				<Nav className="ml-auto">
					<Navbar.Brand href="/">
						<img src={logo} alt="" height="30px" width="30px"/>
					</Navbar.Brand>
					<Nav.Link href="/beta">Beta</Nav.Link>

					{getViewerOptions()}
					{
						isAdminAuthorized() ?
						<>
							<Nav.Link href="/admin">Admin</Nav.Link>
							{
								!isMobile ? 
								<Nav.Link href="/admin-timeline">Admin Timeline</Nav.Link>
								: null
							}
							<Nav.Link href="/admin-join-code">Join Code</Nav.Link>
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