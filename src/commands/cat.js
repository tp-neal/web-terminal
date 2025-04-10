/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cat.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's echo command
==================================================================================================*/

import { Command } from '../command.js';
import { ArgParser } from '../arg-parser.js';
import { OutputLine } from '../output-line.js';
import { RESOLUTION } from '../file-system.js';

const CAT_ERRORS = {
    CANNOT_READ_DIRECTORY: 'Cannot read the contents of a directory.',
}

/*==================================================================================================
    Class Definition: [CatCommand]
==================================================================================================*/
/**
 * @class CatCommand
 * @brief Command for displaying text in the terminal
 */
export class CatCommand extends Command {
    static commandName = 'cat';
    static description = 'Display contents of a file';
    static usage = 'cat [switches] [file]...';

    /*  Constructor
    ***********************************************************************************************/
    /**
     * @brief Initializes a cat command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /*  Public Methods
    ***********************************************************************************************/
    /**
     * @brief Lists contents of the current working directory.
     * @param {string[]} args - Array of provided command arguments.
     * @return {Object} - Result object with type and directory listing.
     * @property {string} return.type  - Description of type property (e.g., 'output' 'ignore').
     * @property {OutputLine[]} return.lines - Array of lines to be ouptput to the terminal.
     */
    execute(args) {
        const lines = [] // Container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // --- 2. Resk, ---
        for (const filepath of params) {
            // Attempt to resolve the path to the file
            const {
                status,
                targetNode,
                parentNode,
                targetName,
                errors
            } = this.filesystem.resolvePath(filepath, {
                createIntermediary: false,
                targetMustHaveType: null,
            });

            // If file/directory wasnt found, push errors returned from resolution
            if (status !== RESOLUTION.FOUND) {
                for (const error of errors) {
                    lines.push(new OutputLine(error.type, error.content)); // Changed to use OutputLine
                }
                continue;
            }

            // If the target is a directory, push an error message
            if (targetNode.isDirectory) {
                lines.push(new OutputLine('error', CAT_ERRORS.CANNOT_READ_DIRECTORY));
                continue;
            }

            // If the target is a file, push its contents to output
            const fileContent = targetNode.getContent();
            lines.push(new OutputLine('general', fileContent));

        }

        return { 
            type: 'output',
            lines 
        };
    }
}