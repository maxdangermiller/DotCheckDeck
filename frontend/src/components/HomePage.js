import React, { useCallback, useEffect, useState, useRef } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import photo from '../MaxMiller.png'
import getApi from './utils/getApi';

import 'bootstrap/dist/css/bootstrap.css';

import bannerLogo from '../icons/banner_logo.svg';


const HomePage = (props) => {

    const [imageWidth, setImageWidth] = useState(1000);
    const [imageHeight, setImageHeight] = useState(1000);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const getDivHeight = () => {
        return window.innerHeight * 0.92;
    }
    const getDivWidth = () => {
        return window.innerWidth;
    }

    const fixBannerImage = () => {
        const imgContainerHeight = getDivHeight();
        const imgContainerWidth = getDivWidth();

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
        
        let parentHeight = getDivHeight();

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

            return {width: getDivWidth(), bottom: bottomY, left: "0px", position: "fixed"}
        
        } catch (error) {
            console.log(error);
        }

        return {width: getDivWidth(), bottom: "0px", left: "0px", position: "fixed"}
    }

    useEffect(() => {
        const handleResize = () => {
            fixBannerImage();
        };

        handleResize();
 
        window.addEventListener('resize', handleResize);
 
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [])

    const canDisplayCredits = () => {
        const WIDTH_OF_CREDITS = 540;
        const HEIGHT_OF_CREDITS = 48;
        const SPACING_FROM_BTN = 20;

        const buttonBottom = getBtnBottom();

        if (buttonBottom >= HEIGHT_OF_CREDITS + SPACING_FROM_BTN && getDivWidth() >= WIDTH_OF_CREDITS) {
            return true;
        }
        return false;
    }

    return (
        <div className="d-flex justify-content-center align-items-center flex-column" style={{width: getDivWidth(), height: getDivHeight(), backgroundColor: "#212429"}}>
            <img src={bannerLogo} alt="" width={imageWidth} height={imageHeight}/>
            
            <div 
                className="d-flex justify-content-center align-items-center flex-column" 
                style={getBtnDivStyle()}
            >
                <button 
                    className='btn btn-lg btn-primary'
                    onClick={(e) => {window.location.href = "/app"}}
                >
                    Go To App
                </button>
            </div>
            <div 
                className="d-flex justify-content-center align-items-center flex-column" 
                style={{width: getDivWidth(), bottom: "0px", left: "0px", position: "absolute", color: "white"}}
            > 
                <div 
                    className='d-flex justify-content-center align-items-center flex-column'
                    style={{backgroundColor: "rgba(33, 36, 41, 0.6)"}}
                >
                    {
                        canDisplayCredits() ?
                        <span>Dot Check Deck Created By Max Miller; Graphic Design by Allison Kroesch</span>
                        : null
                    }
                    <span>© 2024, DotCheckDeck.com</span>
                </div>
            </div>
        </div>
    );
}

export default HomePage;