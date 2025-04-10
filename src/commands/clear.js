/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: clear.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's clear command
==================================================================================================*/

import { Command } from '../command.js';

/*  Class Definition
***************************************************************************************************/
/**
 * @class ClearCommand
 * @brief Command for clearing the terminal screen
 */
export class ClearCommand extends Command {
    static commandName = 'clear';
    static description = 'Clear the terminal screen';
    static usage = 'clear';

    /**
     * @brief Initializes a clear command instance
     * @param {Object} data Object containing required dependencies (none for this command)
     */
    constructor(data) {
        super();
    }

    /**
     * @brief Returns a clear command to the calling terminal
     * @param {string[]} args Array of command arguments (not used)
     * @return {Object} Structure containing handling type ('clear')
     */
    execute() {
        return { 
            type: 'clear'
        };
    }
}