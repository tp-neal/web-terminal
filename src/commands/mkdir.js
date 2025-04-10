/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: mkdir.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's mkdir command
==================================================================================================*/

import { ArgParser } from '../arg-parser.js';
import { Command } from '../command.js';
import { ERROR_MESSAGES } from '../config.js';
import { FSNode } from '../file-system.js';
import { FSUtil } from '../fs-util.js'
import { OutputLine } from '../output-line.js';

const MKDIR_HINTS = {
    MKDIR_CREATE_PARENTS : "Try using the '-p' flag to create parent directories if they don't yet exist.",
}

/* Class Definition
***************************************************************************************************/
/**
 * @class MkdirCommand
 * @brief Command for creating directories
 */
export class MkdirCommand extends Command {
    static commandName = 'mkdir';
    static description = 'Create new directories';
    static usage = 'mkdir [switches] directory...';
    static supportedArgs = ['p'];

    /**
     * @brief Initializes a mkdir command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Creates new directories
     * @param {string[]} args Array of directory names to create
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        const lines = [] // container for all messages to print to the terminal

        // Split up the arguments
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Make sure switches are valid
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine('error', ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return {
                    type: 'output',
                    lines
                }
            }
        }

        // Make sure at least one directory is provided
        if (params.length === 0) {
            lines.push(new OutputLine('error', ERROR_MESSAGES.TOO_FEW_ARGS));
            return {
                type: 'output',
                lines
            }
        }

        // Set switch logic based on supplied switches
        const createIntermediary = switches.includes('p');

        // Attempt to delete each file/directory
        for (const path of params) {
            // Attempt to resolve path to file/directory
            const {
                status,
                targetNode,
                parentNode,
                targetName,
                errors
            } = this.filesystem.resolvePath(path, {
                createIntermediary,
                targetMustHaveType: null
            });

            // Make sure the path is valid, and the directory doesnt already exist
            if (status !== 'PARENT_FOUND_TARGET_MISSING') {
                for (const error of errors) {
                    lines.push(new OutputLine(error.type, error.content));
                }
                continue;
            }

            // Make sure directory name is valid
            const { valid, reasons } = FSUtil.isValidDirectoryName(targetName);
            if (!valid) {
                lines.push(new OutputLine('error', ERROR_MESSAGES.INVALID_DIR_NAME(targetName)));
                lines.push(new OutputLine('error', reasons));
                return {
                    type: 'output',
                    lines
                }
            }

            // Create the directory
            const newDirectory = new FSNode(targetName, 'dir');
            parentNode.addChild(newDirectory);
        }

        // If there are errors, print them, otherwise print nothing
        const errorsFound = (lines.filter(entry => entry.type === 'error').length > 0);
        return {
            type: (errorsFound) ? 'output' : 'ignore',
            lines
        }
    }
}
