/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: rm.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's rm command
==================================================================================================*/

import { ArgParser } from '../arg-parser.js';
import { Command } from '../command.js';
import { ERROR_MESSAGES } from '../config.js';
import { OutputLine } from '../output-line.js';

const RM_HINTS = {
    RM_DIR_NOT_EMPTY: "Try using the '-r' switch to remove directories and their contents recursively.",
}

/* Class Definition
***************************************************************************************************/
/**
 * @class RmCommand
 * @brief Command for removing files or directories
 */
export class RmCommand extends Command {
    static commandName = 'rm';
    static description = 'Remove files or directories';
    static usage = 'rm [switches] [file]...';
    static supportedArgs = ['r'];

    /**
     * @brief Initializes a rm command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Removes files or directories
     * @param {string[]} args Array of file/directory names to remove
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        const lines = [] // container for all messages of type *OutputLine* to be printed to terminal

        // Divide the switches and parameters
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Make sure at least one file is provided
        if (params.length === 0) {
            lines.push(new OutputLine('error', ERROR_MESSAGES.TOO_FEW_ARGS));
            return {
                type: 'output',
                lines
            }
        }

        // Make sure all supplied switches are supported
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine('error', ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return {
                    type: 'output',
                    lines
                }
            }
        }

        // Set switch logic based on supplied switches
        const recursiveDelete = switches.includes('r');

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
                createIntermediary: false,
                targetMustHaveType: null
            });

            // If file/directory wasnt found, push errors returned from resolution
            if (status !== 'FOUND') {
                for (const error of errors) {
                    lines.push(new OutputLine(error.type, error.content)); // Changed to use OutputLine
                }
                continue;
            }

            // Determine if the directory can be deleted
            if (targetNode.isDirectory) {
                // If recursive delete is not set, and directory is not empty, return error
                if (!recursiveDelete && targetNode.children.size > 0) {
                    lines.push(new OutputLine('error', ERROR_MESSAGES.DIRECTORY_NOT_EMPTY(targetName)));
                    lines.push(new OutputLine('hint', RM_HINTS.RM_DIR_NOT_EMPTY));
                    return {
                        type: 'output',
                        lines
                    }
                }

                // Prevent deletion of root directory
                if (targetNode === this.filesystem.root || !targetNode.parent) {
                    lines.push(new OutputLine('error', ERROR_MESSAGES.PRESERVED_DIR(targetName)));
                    continue;
                }

                // Prevent deletion of cwd and parent directory
                if (targetNode === this.filesystem.cwd || targetNode === this.filesystem.cwd.parent) {
                    lines.push(new OutputLine('error', ERROR_MESSAGES.PRESERVED_DIR(targetName)));
                    continue;
                }

                this.filesystem.deleteNode(targetNode, { recursive: recursiveDelete });

            // Target is a file, and was found durning resolution
            } else {
                this.filesystem.deleteNode(targetNode, { recursive: false });
            }
        }

        // If errors were encountered, we will print them, otherwise, dont print anything
        const errorsFound = (lines.length > 0);
        return {
            type: (errorsFound) ? 'output' : 'ignore',
            lines
        }
    }
}
