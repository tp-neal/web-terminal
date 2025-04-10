/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cd.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's cd command
==================================================================================================*/

import { Command } from '../command.js';
import { OutputLine } from '../output-line.js';
import { ERROR_MESSAGES } from '../config.js';

/*  Class Definition
***************************************************************************************************/
/**
 * @class CdCommand
 * @brief Command for changing the current directory
 */
export class CdCommand extends Command {
    static commandName = 'cd';
    static description = 'Change directory';
    static usage = 'cd [directory]';
    
    /**
     * @brief Initializes a cd command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Navigates to a specified relative or absolute directory if it exists
     * @param {string[]} args Array containing the path to navigate to at args[0]
     * @return {Object} Result object with type ('navigation' or 'error') and information
     */
    execute(args) {
        let lines = []; // Container for all messages to print to the terminal

        // Check argument count
        if (args && args.length > 1) {
            lines.push(new OutputLine('error', ERROR_MESSAGES.TOO_MANY_ARGS));
            return {
                type: 'output',
                lines
            };
        }
        
        // Extract path
        const path = (args && args.length > 0) ? args[0] : '';
        
        // Ask the file system to navigate the cwd to the specified directory
        const { success, errorInfo } = this.filesystem.navigateTo(path);

        // If the navigation failed, the filesystem will return error info to print
        if (!success) {
            lines.push(new OutputLine('error', errorInfo))
        }

        // If error, return an array with error info string for formatting in CommandRegistry
        return { 
            type: (success) ? 'navigation' : 'output', 
            lines
        }
    }
}
