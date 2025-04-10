/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: pwd.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's pwd command
==================================================================================================*/

import { Command } from '../command.js';
import { OutputLine } from '../output-line.js';

/*  Class Definition
***************************************************************************************************/
/**
 * @class PwdCommand
 * @brief Command for printing current working directory
 */
export class PwdCommand extends Command {
    static commandName = 'pwd';
    static description = 'Prints current working directory';
    static usage = 'pwd [switches]';
    static supportedArgs = [];

    /**
     * @brief Initializes a pwd command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Prints out current working directory
     * @param {string[]} args Array of command arguments 
     * @return {Object} Result object with type ('output') and cwd filepath
     */
    execute(args) {
        const lines = [] // container for all messages to print to the terminal

        // Add the stringified file system to entries
        lines.push(new OutputLine('general', this.filesystem.cwd.getFilePath()));
        
        return { 
            type: 'output', 
            lines
        };
    }
}