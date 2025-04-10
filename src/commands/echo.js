/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: echo.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's echo command
==================================================================================================*/

import { ArgParser } from '../arg-parser.js';
import { Command } from '../command.js';
import { OutputLine } from '../output-line.js';

/*  Class Definition
***************************************************************************************************/
/**
 * @class EchoCommand
 * @brief Command for displaying text in the terminal
 */
export class EchoCommand extends Command {
    static commandName = 'echo';
    static description = 'Display a line of text';
    static usage = 'echo [switches] [text]';

    /**
     * @brief Initializes an echo command instance
     * @param {Object} data Object containing required dependencies (none for this command)
     */
    constructor(data) {
        super();
    }

    /**
     * @brief Returns a string for the terminal to display based on provided arguments
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type ('output') and output text
     */
    execute(args) {
        const lines = [] // Container for all messages to print to the terminal

        // Split up the arguments
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Join the segments with a space (quote enclosed sequences are treated as one segment)
        lines.push(new OutputLine('general', params.join(' ')));

        return { 
            type: 'output',
            lines
        };
    }
}