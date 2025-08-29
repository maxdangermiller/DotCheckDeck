import React from 'react';
import './AppNavBar.css';
import logo from '../../../icons/logo.svg';
import {Nav,  Navbar, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

const AppNavBar = (props) => {
    const { token, loggedIn, logout, data, curSet, isOffline, userData, showSetInfo } = props;

    /**
     * Get Current Measure
     * @returns current measure
     */
    const getCurrentMeasure = () => {
        let setData = data[curSet];
        try {
            let measure = setData["measure"];
            if (measure !== null) {
                return measure;
            }
            return "0";
        } catch (error) {
            return "0";
        }
    }

    /**
     * Get Current Counts
     * @returns current counts
     */
    const getCurrentCounts = () => {
        let setData = data[curSet];
        try {
            let counts = setData["counts"];
            if (counts !== null) {
                return counts;
            }
            return "0";
        } catch (error) {
            return "0";
        }
    }

    /**
     * Get Viewer Options
     * @returns HTML
     */
	const getViewerOptions = () => {
        if (!isBasicSafe()) {
            return <></>;
        }
		if (window.location.pathname === "/app/basic") {
			return <Nav.Link href="/app">Normal</Nav.Link>;
		}
		if (window.location.pathname === "/app") {
			return <Nav.Link href="/app/basic">Basic</Nav.Link>;
		}
		return <></>;
	}

    const isAdminAuthorized = () => {
		if (token === "" || token === undefined || isOffline) {
			return false;
		}

		if (userData !== undefined && userData["is_admin"] !== undefined) {
			return userData["is_admin"];
		}
		return false;
	}

    const isBasicSafe = () => {
        // const admin = isAdminAuthorized();
        if (userData["show_users"].length === 0) {
            return false;
        }
        
        /*
        TODO: CHECK IF SHOW USER IS VALID
        for (let i = 0; i < userData["show_users"].length; i++) {
            if (userData["show_users"][i][""])
        }
        */

        return true;
    }

    const getAppInfoDisplay = () => {
        if (!showSetInfo) {
            return (
                null
            );
        }
        
        // Normal
        return (
            <Nav className="ml-auto">
                <div className='customNavbarText'>Measure: {getCurrentMeasure()}</div>
                <div className='customNavbarText'>Counts: {getCurrentCounts()}</div>
            </Nav>
        );
    }

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); 
    const isPWAAdded = window.matchMedia('(display-mode: standalone)').matches;

	return (
		<Navbar bg="dark" variant="dark" style={{height: "8vh", minHeight: "36px"}} className="customNavbar">
			<Container fluid>
				<Nav className="ml-auto">
                    <Navbar.Brand href={isMobile && isPWAAdded ? "/app" : "/"} className="d-flex flex-column justify-content-center align-items-center">
                        <img src={logo} alt="" height="30px" width="30px"/>
                    </Navbar.Brand>

                    {getViewerOptions()}

                    {isAdminAuthorized() ? <Nav.Link href="/admin">Admin</Nav.Link> : null}

                    <Nav.Link href="/beta/app">Beta</Nav.Link>

                    <Navbar.Text style={{fontWeight: "bold", paddingRight: "12px"}}>|</Navbar.Text>
				</Nav>
                
                {getAppInfoDisplay()}

				<Nav className="mr-auto">
                    <Navbar.Text style={{fontWeight: "bold", paddingRight: "12px"}}>|</Navbar.Text>
                    <Nav.Link onClick={logout} href="#logout">Logout</Nav.Link>
				</Nav>
			</Container>
		</Navbar>
	);


};

export default AppNavBar;