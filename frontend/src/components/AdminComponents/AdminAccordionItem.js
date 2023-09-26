import React from 'react';
import { TextField } from '@mui/material';

const WINDOW_LOCATION = window.location.protocol + "//" + window.location.hostname + ":5000";

const AdminAccordionItem = (props) => {
    const { accordionItem, accordionState, index, setAccordionState, token } = props

    const setAccordionItem = () => {
        const newAccordionState = accordionState.map((value, i) => {
            if (i === index) {
              // Increment the clicked counter
              value.open = !value.open;
              return value;
            } else {
              // The rest haven't changed
              return value;
            }
        });

        setAccordionState(newAccordionState);
    }

    const MSToSecs = (string) => {
        const [minutes, seconds] = string.split(':');
        return parseInt(minutes) * 60 + parseInt(seconds);
    }

    const setAccordionItemInfo = (key, value) => {
        const newAccordionState = accordionState.map((_value, i) => {
            if (i === index) {
              // Increment the clicked counter
              _value[key] = value;
              return _value;
            } else {
              // The rest haven't changed
              return _value;
            }
        });

        setAccordionState(newAccordionState);
    }

    const setTimeCode = (key, value) => {
        if (value.split(':').length === 2) {
            setAccordionItemInfo(key, value);
        }
    }

    const saveData = () => {
        try {
            fetch(WINDOW_LOCATION + '/update-set', {
                method: 'POST',
                body: JSON.stringify({
                    id: accordionItem.id,
                    set_numb: accordionItem.setNumb,
                    measure: accordionItem.measure, 
                    counts: accordionItem.counts, 
                    start_time_code: MSToSecs(accordionItem.start_time_code), 
                    end_time_code: MSToSecs(accordionItem.end_time_code)
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + token
                }
                })
                .then(res => res.json())
                .then(
                    (result) => {
                        console.log(result);
                    },
                    // Note: it's important to handle errors here
                    // instead of a catch() block so that we don't swallow
                    // exceptions from actual bugs in components.
                    (error) => {
                        console.log(error);
                        alert(error)
                    }
                );
        } catch (error) {
            console.log("ERROR " + error);
        }
    }

    return (
        <div className="accordion-item">
            <h2 className="accordion-header">
                <button className="accordion-button" onClick={setAccordionItem} data-bs-toggle="collapse" aria-expanded={accordionItem.open} >
                    {accordionItem.setNumb} | {accordionItem.setName}
                </button>
            </h2>
            <div className={accordionItem.open ? "accordion-collapse collapse show": "accordion-collapse collapse"}>
                <div className="accordion-body">
                    <TextField
                        className="mb-3 customInput"
                        value={accordionItem["start_time_code"]}
                        onChange={e => setTimeCode("start_time_code", e.target.value)}
                        label="Start Time"
                        variant="outlined"
                    />
                    <TextField
                        className="mb-3 customInput"
                        value={accordionItem["end_time_code"]}
                        onChange={e => setTimeCode("end_time_code", e.target.value)}
                        label="End Time"
                        variant="outlined"
                    />
                    <button className="btn btn-outline-success btn-lg px-5" type="submit" onClick={e => saveData(e)}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default AdminAccordionItem;