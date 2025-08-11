import React from 'react';
import getApi from "../../../utils/getApi";


const WINDOW_LOCATION = getApi();

/**
 * Get Loaded Icon, or load the icon if it is not already loaded.
 * @param {Integer} icon_id 
 * @param {Array} loadedIcons
 * @param {function} setLoadedIcons 
 * @param {string} token provided from App>BetaViewer>NormalViewer>ShowDisplay
 * @returns {Image} Image object of the icon
 * @description This function checks if the icon is already loaded in the `loadedIcons` array.
 * If it is, it returns the icon. If not, it creates a new Image object, sets its `src` to the icon URL,
 * and adds it to the `loadedIcons` array once it has loaded successfully.
 * If the image fails to load, it logs an error message to the console.
 * @example
 * // Usage example
 * const icon = getLoadedIcon(123, setLoadedIcons);
import { WINDOW_LOCATION, token } from '../../../utils/constants';
import { useState } from 'react';
import { loadedIcons } from '../../../utils/loadedIcons';
 */
const getLoadedIcon = (icon_id, loadedIcons, setLoadedIcons, token) => {
    for (let i = 0; i < loadedIcons.length; i++) {
        if (loadedIcons[i]["id"] == icon_id) {
            return loadedIcons[i]["icon"];
        }
    }

    let img = new Image();

    img.onerror = function() { 
        console.log("Failed to get image")
        // window.location.href = "/error?message=Your login token is expired. Press 'Go Back' to return to login&return=/login";
    };
    img.onabort = function() { 
        console.log("Failed to get image");
        // window.location.href = "/error?message=Your login token is expired. Press 'Go Back' to return to login&return=/login";
    };

    img.src = WINDOW_LOCATION + '/get-icon/' + icon_id + "?token=" + token;

    img.onload = () => {
        setLoadedIcons([...loadedIcons, {"id": icon_id, "icon": img}]);
    }

    return img;
}

export default {getLoadedIcon};