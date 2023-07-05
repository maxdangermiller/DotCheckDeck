import React, { useRef, useEffect, useState} from 'react';
import './Nav.css';
import logo from '../logo.svg';
import {Nav,  Navbar, NavDropdown, Container } from 'react-bootstrap';

const NavBar = (props) => {
    const { token, loggedIn, logout, isAdminAuthorized, isBasic, setIsBasic, ...rest } = props

	const getViewerOptions = () => {
		if (window.location.pathname !== "/") {
			return <></>
		}
		if (isBasic) {
			return <Nav.Link onClick={() => setIsBasic(!isBasic)} href="#basic">Normal</Nav.Link>;
		}
		return <Nav.Link onClick={() => setIsBasic(!isBasic)} href="#normal">Basic</Nav.Link>;
	}

	return (
		<Navbar bg="dark" variant="dark" style={{height: "8vh", minHeight: "36px"}}>
			<Container fluid>
				<Nav className="ml-auto">
					<Navbar.Brand href="/">
						<img src={logo} alt="" width="24" height="24" />
					</Navbar.Brand>
					{getViewerOptions()}
					{
						isAdminAuthorized() ?
						<>
							<Nav.Link href="/admin">Admin</Nav.Link>
							<Nav.Link href="/admin-timeline">Admin Timeline</Nav.Link>
							<Nav.Link href="/admin-join-code">Join Code</Nav.Link>
						</>
						: null
					}
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