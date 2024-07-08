import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import photo from '../MaxMiller.png'
import getApi from './utils/getApi';

import 'bootstrap/dist/css/bootstrap.css';

import logo from '../icons/logo.svg';

const WINDOW_LOCATION = getApi();

const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
});


const HomePage = (props) => {

    return (
        <div style={{width: "100vw"}}>
            <ThemeProvider theme={darkTheme}>
                <section className="gradient-custom" style={{height: "450px"}}>
                    <img src={logo} alt="" height="30px" width="30px"/>
                    Dot Check Deck
                </section>
            </ThemeProvider>

            <button className='btn btn-primary' onClick={(e) => {window.location.href = "/app"}}>Go To App</button>
        </div>
    );
}

export default HomePage;