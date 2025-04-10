/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: ls.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's ls command
==================================================================================================*/

import { ArgParser } from '../arg-parser.js';
import { Command } from '../command.js';
import { ERROR_MESSAGES } from '../config.js';
import { RESOLUTION } from '../file-system.js';
import { OutputLine } from '../output-line.js';

/*==================================================================================================
    Class Definition: [LsCommand]
==================================================================================================*/

/**
 * @class LsCommand
 * @brief Command for listing directory contents
 */
export class LsCommand extends Command {
    static commandName = 'ls';
    static description = 'List directory contents';
    static usage = 'ls [switches] [directory](optional)';
    static supportedArgs = ['a'];

    /*  Constructor
    ***********************************************************************************************/
    /**
     * @brief Initializes an ls command instance
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
        const lines = [] // container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
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

        // Set switch logic based on supplied switches
        const showHidden = switches.includes('a');


        // --- 2. Gather Source Information ---
        const sourcePath = ( params && params.length > 0) ? params[0] : '';
        
        const { // gather information on the source path
            status: srcRes,
            targetNode: srcNode,
            parentNode: srcParent,
            targetName: srcName,
            errors: srcResErrors
        } = this.filesystem.resolvePath(sourcePath, {
            createIntermediary: false,  // we are looking for an existing file/directory
            targetMustHaveType: null    // source can be a file or directory
        });

        // If the source wansn't found, push errors encounterd during traversal, and exit
        if (srcRes !== RESOLUTION.FOUND) {
            for (const error of srcResErrors) {
                lines.push(new OutputLine(error.type, error.content));
            }
            return { // single source means we can return early
                type: 'output',
                lines
            }
        }


        // --- 3. Gather List Contents ---
        // Case: target is a directory
        if (srcNode.isDirectory) {
            // Add each of the nodes children to output
            for (const [childName, childNode] of srcNode.children) {
                if (!childNode.isHidden || showHidden) {
                    if (childNode.isDirectory) {
                        console.log(`Pushing 'directory' '${childNode.getFullName()}`)
                        lines.push(new OutputLine('directory', childNode.getFullName()));
                    } else {
                        console.log(`Pushing 'file' '${childNode.getFullName()}`)
                        lines.push(new OutputLine('file', childNode.getFullName()));
                    }
                }
            };
        
        // Case: target is a file
        } else {
            // Just add the target file to output
            lines.push(new OutputLine('file', srcNode.getFullName()));
        }
        
        // --- 4. Return Output ---
        return { 
            type: (lines.length > 0) ? 'output' : 'ignore',
            lines
        };
    }
}