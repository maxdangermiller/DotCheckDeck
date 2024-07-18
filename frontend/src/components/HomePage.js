import React, { useCallback, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import photo from '../MaxMiller.png'
import getApi from './utils/getApi';

import 'bootstrap/dist/css/bootstrap.css';

import bannerLogo from '../icons/banner_logo.svg';


const HomePage = (props) => {

    const [buttonY, setButtonY] = useState(0);

    const getBannerImage = () => {
        // Landscape
        if (window.innerWidth > window.innerHeight) {
            return (
                <img src={bannerLogo} alt="" width="100%" ref={handleBanner}/>
            );
        }
        return (
            <img src={bannerLogo} alt="" height="80%" ref={handleBanner}/>
        );
    
    }

    const handleBanner = useCallback(node => {
        const BUTTON_LOCATION = 300;
        if (node === null) {
            return;
        }

        try { 
            console.log(node.getBoundingClientRect())
            let height = node.getBoundingClientRect().height;
            let width = node.getBoundingClientRect().width;

            // Benefits of a square logo
            // Doesn't load once it reconciles the missing dimension
            if (height === 0 && width !== 0) { height = width; }
            let windowHeight = window.innerHeight * 0.92;

            let scale = height / 1000;
            let overlap = (height - windowHeight) / 2;

            console.log(height, scale, overlap, BUTTON_LOCATION * scale - overlap)
            
            setButtonY(BUTTON_LOCATION * scale - overlap);
        
        } catch (error) {
            console.log(error);
        }
    }, []);

    return (
        <div className="d-flex justify-content-center align-items-center flex-column" style={{width: "100vw", height: "92vh", backgroundColor: "#212429"}}>
            {getBannerImage()}
            
            <div 
                className="d-flex justify-content-center align-items-center flex-column" 
                style={{width: "100vw", bottom: `${buttonY}px`, left: "0px", position: "absolute"}}
            >
                <button 
                    className='btn btn-lg btn-primary'
                    onClick={(e) => {window.location.href = "/app"}}
                >
                    Go To App
                </button>
            </div>
        </div>
    );
}

export default HomePage;