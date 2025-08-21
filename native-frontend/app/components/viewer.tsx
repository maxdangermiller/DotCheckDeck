import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import NavBar from './NavBar';

export default function AboutScreen() {
	/*
	useEffect(() => {
		Orientation.unlockAllOrientations(); // Unlocks all orientations when component mounts
		return () => {
			Orientation.lockToPortrait(); // Locks to portrait when component unmounts
		};
	}, []);
	*/

	return (
		<View style={styles.container}>
			<NavBar loggedIn={false} logout={() => {}} isAdminAuthorized={false}/>
			
			<Text style={styles.text}>Viewer</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#25292e',
		justifyContent: 'center',
		alignItems: 'center',
	},
	text: {
		color: '#fff',
	},
});