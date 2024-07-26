import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import photo from '../MaxMiller.png'
import getApi from './utils/getApi';

import 'bootstrap/dist/css/bootstrap.css';

const WINDOW_LOCATION = getApi();

const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
});


const AboutPage = (props) => {

    return (
        <ThemeProvider theme={darkTheme}><section className="gradient-custom">
			<div className="container py-5 h-100" style={{width: "100%"}}>
				<div className="row d-flex justify-content-center align-items-center h-100" style={{width: "100%"}}>
					<div className="col-14 col-md-10 col-lg-8 col-xl-6">
						<div className="card bg-dark text-white" style={{borderRadius: '1rem', height: "80vh"}}>
							<div className="card-body p-5 text-center h-100">
                                <h2 className="fw-bold mb-2 text-uppercase">About</h2>
								<p className="text-white-50 mb-5">Dot Check Deck - Created by Max Miller</p>
								<div className="mt-md-4 pb-5 customCardBody" style={{height: "80%"}}>
                                    <div className="d-flex flex-row justify-content-between align-items-center" style={{width: "100%", minHeight: "70%"}}>
                                        <div className="d-flex flex-column justify-content-center align-items-center h-100" style={{width: "40%"}}>
                                            <img src={photo} alt="" width="100%"/>
                                        </div>
                                        <div className="d-flex flex-column justify-content-start align-items-start h-100" style={{width: "55%", textAlign:"start"}}>
                                            Hey! I'm Max Miller! I'm currently (as I'm writing this) a Senior at University High School in Normal, IL.
                                            I wrote this webapp because I saw a clear need for bringing drill reading into the 21st century. 
                                            This app aims at improving the drill reading and comprehension process, all at a significantly lower price than competition.
                                        </div>
                                    </div>
                                    <div className="d-flex flex-row justify-content-center align-items-center" style={{width: "100%", minHeight: "20%"}}>
                                        <a style={{color: "white"}}href="eula.pdf">End User License Agreement</a>
                                    </div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section></ThemeProvider>
    );
}

export default AboutPage;