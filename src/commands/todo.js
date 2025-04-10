/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: todo.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's todo command
==================================================================================================*/

import { Command } from '../command.js';
import { CONFIG } from '../config.js';
import { OutputLine } from '../output-line.js';

/*  Class Definition
***************************************************************************************************/
/**
 * @class TodoCommand
 * @brief Command for displaying the TODO list
 */
export class TodoCommand extends Command {
    static commandName = 'todo';
    static description = 'Display the TODO list';
    static usage = 'todo';

    /**
     * @brief Initializes a todo command instance
     * @param {Object} data Object containing required dependencies (none for this command)
     */
    constructor(data) {
        super();
    }

    /**
     * @brief Returns the configured TODO list
     * @param {string[]} args Array of command arguments (not used)
     * @return {Object} Result object with type ('output') and TODO content
     */
    execute(args) {
        const lines = [] // Container for all messages to print to the terminal

        // Add the stringified file system to entries
        lines.push(new OutputLine('general', CONFIG.TO_DO_LIST));

        return {
            type: 'output',
            lines
        }
    }
}