import React from 'react';

/**
 * Is there motion between two sets in the show data?
 * 
 * @description
 * This function checks if there is any motion between two specified sets
 * in the provided show data. It compares the dot information of each user
 * for the two sets and returns true if any differences are found, indicating
 * motion.
 * 
 * @param {ShowData} data 
 * @param {Int} set_0_index 
 * @param {Int} set_1_index 
 * @returns 
 */
function is_set_motion(data, set_0_index, set_1_index) {
    // Loop through each show user in the data
    for (let i = 0; i < data.length; i++) {
        const show_user_data = data[i];

        const d1 = show_user_data.dot_links[set_0_index].cur_dot.dot_info;
        const d2 = show_user_data.dot_links[set_1_index].cur_dot.dot_info;

        if (d1 !== d2) {
            return true; // Motion detected between the two sets
        }
    }

    return false; // No motion detected between the two sets
}

export {is_set_motion};