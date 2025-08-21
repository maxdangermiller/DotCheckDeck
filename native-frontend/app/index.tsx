import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Text, View,  StyleSheet, Image, LayoutChangeEvent, Button, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import NavBar from './components/NavBar';


const bannerImg = require('@/assets/images/banner_logo.svg');


const Index = () => {

	const [viewLayout, setViewLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [imageWidth, setImageWidth] = useState(1000);
	const [imageHeight, setImageHeight] = useState(1000);

	const ref = useRef(null);
	const router = useRouter();

	const fixBannerImage = (event:LayoutChangeEvent) => {
		const { x, y, width, height } = event.nativeEvent.layout;
    	setViewLayout({ x, y, width, height });

		const imgContainerHeight = width;
		const imgContainerWidth = height;

		// Landscape
		if (imgContainerWidth > imgContainerHeight * 0.8) {
			setImageWidth(imgContainerWidth);
			setImageHeight(imgContainerWidth);
		}

		else {
			setImageWidth(imgContainerHeight * 0.8);
			setImageHeight(imgContainerHeight * 0.8);
		}
	}

	const getBtnBottom = () => {
		const BUTTON_LOCATION = 300;
		const MIN_FROM_BOT = 150;
		const ABSOLUTE_MIN_FROM_BOT = 40;

		let height = imageHeight;
		// let width = imageWidth;
		
		let parentHeight = viewLayout.height;

		let scale = height / 1000;
		let overlap = (height - parentHeight) / 2;

		let y = (BUTTON_LOCATION * scale) - overlap;

		if (y < MIN_FROM_BOT && parentHeight > MIN_FROM_BOT * 3) {
			y = MIN_FROM_BOT;
		}
		else if (y < ABSOLUTE_MIN_FROM_BOT) {
			y = ABSOLUTE_MIN_FROM_BOT;
		}

		console.log("Getting Btn Pos: image height = ", height, ", scale=", scale, ", overlap=", overlap, " -> y=", y);

		return y;
	}

	const getBtnDivStyle = () => {
		try { 
			let bottomY = getBtnBottom();

			return {width: viewLayout.width, bottom: bottomY, left: 0, position: "fixed"}
		
		} catch (error) {
			console.log(error);
		}

		return {width: viewLayout.width, bottom: 0, left: 0, position: "fixed"}
	}

	const canDisplayCredits = () => {
		const WIDTH_OF_CREDITS = 540;
		const HEIGHT_OF_CREDITS = 48;
		const SPACING_FROM_BTN = 20;

		const buttonBottom = getBtnBottom();

		if (buttonBottom >= HEIGHT_OF_CREDITS + SPACING_FROM_BTN && viewLayout.width >= WIDTH_OF_CREDITS) {
			return true;
		}
		return false;
	}


	return (
		<SafeAreaProvider>
			<SafeAreaView onLayout={fixBannerImage} style={styles.container} ref={ref}>
				<NavBar loggedIn={false} logout={() => {}} isAdminAuthorized={false}/>
				
				<Image
					width={imageWidth}
					height={imageHeight}
					resizeMode='cover'
					style={{width: imageWidth, height: imageHeight}}
					source={bannerImg}
				/>

				<View style={{...styles.btnView, ...getBtnDivStyle()}}>
					<TouchableOpacity 
						style={styles.btn} 
						onPress={() => {router.replace('/components/viewer');}}
					>
						<Text style={styles.text}>Go To App</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

export default Index;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(33, 37, 41, 1)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		fontSize:20,
		fontWeight:600,
		color:'rgb(255,255,255)',
		textAlign:"center",
		textDecorationLine: 'none',
	},
	btnView: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'column',
		display:'flex',

	},
	btn: {
		paddingHorizontal:16,
		paddingVertical:8,
		lineHeight:1.5,
		verticalAlign:'middle',
		borderColor: '#0d6efd',
		borderWidth:1,
		borderStyle:'solid',
		borderRadius: 8,
		backgroundColor: '#0d6efd'
	}
});
