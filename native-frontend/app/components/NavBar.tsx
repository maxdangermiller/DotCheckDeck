import React, { useEffect, useState } from 'react';
import { Text, View,  StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePathname, useRouter, Link } from 'expo-router';
import { Image } from 'expo-image';

//import './Nav.css';
// import {Nav,  Navbar, Container } from 'react-bootstrap';
// import 'bootstrap/dist/css/bootstrap.css';


const logo = require('@/assets/images/logo.svg');


const NavBar = (props: { loggedIn: any; logout: any; isAdminAuthorized: any; }) => {
	const { loggedIn, logout, isAdminAuthorized } = props

	const insets = useSafeAreaInsets();
	const location = usePathname();
	const router = useRouter();

	/*
	const [ show, setShow ] = useState(true);

	useEffect(() => {
		console.log('Location changed');

		setShow(location.substring(0, 4) !== "/app")
	}, [location]);
	*/

	/*
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const isPWAAdded = window.matchMedia('(display-mode: standalone)').matches;

	if (!show || location.substring(0, 4) === "/app" || location.substring(0, 5) === "/beta"){
		return <></>
	}
	*/

	const handleLogoPress = () => {
		console.log('Logo pressed');
        router.replace('/');
    };

	return <View style={{...styles.navBar, top: insets.top}}>
		<View style={styles.leftNav}>
			<TouchableOpacity onPress={handleLogoPress} style={styles.navBrand}>
				<Image
					style={styles.logo}
					source={logo}
				/>
			</TouchableOpacity>
			<Link href="/components/about" style={styles.text}>About Us</Link>
		</View>
		<View style={styles.rightNav}>
			<Link href="/components/auth/activate" style={styles.text}>Activate</Link>
			<Link href="/components/auth/login" style={styles.text}>Login</Link>
		</View>
	</View>

	/*
	return (
		<Navbar bg="dark" variant="dark" style={{height: "8vh", minHeight: "36px", display: show}}>
			<Container fluid>
				<Nav className="ml-auto">
					<Navbar.Brand href={isMobile && isPWAAdded ? "/app" : "/"}>
						<Image
							style={{height: 30, width: 30}}
							source={require('@expo/assets/logo.svg')}
						/>
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
	*/


};

const styles = StyleSheet.create({
	navBar: {
		position: 'absolute',
		flex:1,
		height: 48,
		marginLeft:8,
		marginRight:8,
		width: (Dimensions.get("window").width - 16),
		// top: 0,
		backgroundColor: 'rgba(33, 37, 41, 1)',
		flexWrap: 'nowrap',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		zIndex: 999,

  	},
	text: {
		padding:8,
		fontSize: 16,
		textDecorationStyle: 'solid',
		textDecorationLine: 'none',
		backgroundColor: 'transparent',
		

		color: 'rgba(255, 255, 255, 0.55)',
		textAlignVertical: 'center',
		height: 40,
	},
	logo: {
		height: 30,
		width: 30,
	},
	leftNav: {
		flexDirection: 'row',
	},
	rightNav: {
		flexDirection: 'row',
	},
	navBrand: {
		paddingTop: 5,
		paddingBottom: 5,
		marginRight: 16,
	},
});

export default NavBar;