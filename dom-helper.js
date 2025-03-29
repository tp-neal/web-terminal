
/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: dom-helper.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
*
    We start by assuming there is a terminal list in the HTML file. We retrieve this dom element,
    as we will add individual list elements and the command line.
*
==================================================================================================*/

import { ELEMENT_CLASSES } from "./terminal.js";

/*================================================================================================*/
export class DOMHelper {
    static createOutputLineElement(type, content) {
        const li = document.createElement('li');
        li.className = `${ELEMENT_CLASSES.command_list_item} ${ELEMENT_CLASSES.command_list_item}--${type}`;

        // This is where all typed content will be entered ex. `cd path/to/dir/`
        const contentSpan = document.createElement('span');
        contentSpan.className = 'line__content';
        contentSpan.textContent = content || '';

        li.appendChild(contentSpan);
        return li;
    }
}

export function protectedKeyCombination(event) {
    // Developer Tools  ( F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C )
    if (event.key === 'F12' ||
        event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J' || event.key === 'C')) {
        return true;
    }

    // Common text operations ( Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+Y )
    if (event.ctrlKey && ['c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) {
        return true;
    }
    
    // Navigation 
    if (event.key === 'Tab' || event.key === 'Escape' || 
        (event.ctrlKey && (event.key === 'f' || event.key === 'r')) ||
        (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key))) {
        return true;
    }
    
    // Tab management
    if (event.ctrlKey && ['t', 'w'].includes(event.key.toLowerCase()) || 
        (event.ctrlKey && event.key === 'Tab')) {
        return true;
    }

    return false;
}
