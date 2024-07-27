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

    const getBtnDivStyle = () => {
        const BUTTON_LOCATION = 300;
        const MIN_FROM_BOT = 150;
        const ABSOLUTE_MIN_FROM_BOT = 40;

        try { 
            let height = imageHeight;
            let width = imageWidth;
            
            let parentHeight = getDivHeight();

            let scale = height / 1000;
            let overlap = (height - parentHeight) / 2;

            let y = (BUTTON_LOCATION * scale) - overlap;

            // console.log(height, scale, overlap, BUTTON_LOCATION * scale - overlap)
            console.log("Updating Btn Pos: image height = ", height, ", scale=", scale, ", overlap=", overlap, " -> y=", y);
            
            // setButtonY(BUTTON_LOCATION * scale - overlap);

            if (y < MIN_FROM_BOT && parentHeight > MIN_FROM_BOT * 3) {
                y = MIN_FROM_BOT;
            }
            else if (y < ABSOLUTE_MIN_FROM_BOT) {
                y = ABSOLUTE_MIN_FROM_BOT;
            }

            return {width: getDivWidth(), bottom: y, left: "0px", position: "fixed"}
        
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
                style={{width: getDivWidth(), bottom: "0px", left: "0px", position: "fixed", color: "white"}}
            >   
                {
                    !isMobile ?
                    <span>Dot Check Deck Created By Max Miller; Graphic Design by Allison Kroesch</span>
                    : null
                }
                <span>© 2024, DotCheckDeck.com</span>
            </div>
        </div>
    );
}

export default HomePage;