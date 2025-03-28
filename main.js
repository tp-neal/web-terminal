
/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: main.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
*
    We start by assuming there is a terminal list in the HTML file. We retrieve this dom element,
    as we will add individual list elements and the command line.
*
==================================================================================================*/

import { Terminal } from './terminal.js';

/*==================================================================================================
    Invokation
==================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    const terminal = new Terminal();
    terminal.init();
});