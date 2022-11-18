import React, { useState, useEffect, useRef } from 'react';

const AdminAccordionItem = (props) => {
    const { accordionItem, accordionState, index, setAccordionState, ...rest } = props

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

    return (
        <div className="accordion-item">
            <h2 className="accordion-header">
                <button className="accordion-button" onClick={setAccordionItem} data-bs-toggle="collapse" aria-expanded={accordionItem.open} >
                    {accordionItem.setNumb} | {accordionItem.setName}
                </button>
            </h2>
            <div className={accordionItem.open ? "accordion-collapse collapse show": "accordion-collapse collapse"}>
                <div className="accordion-body">
                    Hello 123
                </div>
            </div>
        </div>
    );
};

export default AdminAccordionItem;