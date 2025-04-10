/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: touch.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's touch command
==================================================================================================*/

import { ArgParser } from '../arg-parser.js';
import { Command } from '../command.js';
import { ERROR_MESSAGES } from '../config.js';
import { FSNode, RESOLUTION } from '../file-system.js';
import { FSUtil } from '../fs-util.js'
import { OutputLine } from '../output-line.js';

/* Class Definition
***************************************************************************************************/
/**
 * @class TouchCommand
 * @brief Command for creating directories
 */
export class TouchCommand extends Command {
    static commandName = 'touch';
    static description = 'Create new files';
    static usage = 'touch [switches] [file]...';
    static supportedArgs = [];

    /**
     * @brief Initializes a touch command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Creates new files
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

        // Make sure at least one file is provided
        if (params.length === 0) {
            lines.push(new OutputLine('error', ERROR_MESSAGES.TOO_FEW_ARGS));
            return {
                type: 'output',
                lines
            }
        }

        // Attempt to update/create each file
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

            // Make sure the path is valid
            if (status !== RESOLUTION.PARENT_FOUND_TARGET_MISSING &&
                status !== RESOLUTION.FOUND) {
                for (const error of errors) {
                    lines.push(new OutputLine(error.type, error.content));
                }
                continue;
            }

            // Case: File doesnt exists, create new
            if (!targetNode) {
                // Make sure file name is valid
                const { valid, reasons } = FSUtil.isValidFileName(targetName);
                if (!valid) {
                    console.warn(`${valid}, ${reasons}`)
                    lines.push(new OutputLine('error', ERROR_MESSAGES.INVALID_FILE_NAME(targetName)));
                    lines.push(new OutputLine('error', reasons));
                    return {
                        type: 'output',
                        lines
                    }
                }

                // Create the file
                const { name, extension } = FSUtil.trimExtension(targetName);
                const newFile = new FSNode(name, extension);
                parentNode.addChild(newFile);

            // Case: File already exists, update time
            } else {
                targetNode.updateModifiedTime();
            }
        }

        // If there are errors, print them, otherwise print nothing
        return {
            type: (lines.length > 0) ? 'output' : 'ignore',
            lines
        }
    }
}
