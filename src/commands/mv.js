/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: mv.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's mv command
==================================================================================================*/

import { Command } from '../command.js';
import { ERROR_MESSAGES } from '../config.js';
import { RESOLUTION } from '../file-system.js';

const MV_ERRORS = {
    FOLDER_NOT_EMPTY: (destPath) => `Cannot move folder into new directory: ${destPath} already `+
                                    `exists, and is non empty`,
};

/*  Class Definition
***************************************************************************************************/
/**
 * @class MvCommand
 * @brief Command for moving/renaming files and directories
 */
export class MvCommand extends Command {
    static commandName = 'mv';
    static description = 'Move (rename) files';
    static usage = 'mv [switches] source target';
    static supportedArgs = [];

    /**
     * @brief Initializes a mv command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Moves or renames files and directories
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        // TODO: Implement mv functionality
        const lines = [] // container for all messages to print to the terminal
        
        // --- 1. ARGUMENT PARSING ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Make sure command has support for provided switches
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine('error', ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return {
                    type: 'output',
                    lines
                }
            }
        }

        // Make sure at least one source and destination is provided
        if (params.length < 2) {
            lines.push(new OutputLine('error', ERROR_MESSAGES.TOO_FEW_ARGS));
            return {
                type: 'output',
                lines
            }
        }


        // --- 2. GATHER PATH INFORMATION ---
        const destinationPath = params.pop();
        const sourcePaths = params;
        const sourceCount = sourcePaths.length;


        // --- 3. GATHER DESTINATION INFORMATION ---
        const { // Gather information on the destination path to make sure it exists
            status: destRes,
            targetNode: destNode,
            parentNode: destParent,
            targetName: destName,
            errors: destResErrors
        } = this.filesystem.resolvePath(destinationPath, {
            createIntermediary: false,  // don't create intermediary directories
            targetMustHaveType: null,   // copying can be done to files and directories
        });

        // Fail if destination path was invalid
        if (destRes !== RESOLUTION.PARENT_FOUND_TARGET_MISSING && destRes !== RESOLUTION.FOUND) {
            for (const error of destResErrors) {
                lines.push(new OutputLine(error.type, error.content));
            }
            return { // early return
                type: 'output',
                lines
            }
        }

        // Fail if multiple sources and destination is a file
        if (sourceCount > 1 && destNode.type !== 'dir') {
            lines.push(new OutputLine('error', MV_ERRORS.MULTIPLE_SOURCES_FILE_DESTINATION));
            return { // early return
                type: 'output',
                lines
            }
        }

        // Fail if destination doesn't yet exist, and there are multiple sources
        if (destRes === RESOLUTION.PARENT_FOUND_TARGET_MISSING && sourceCount > 1) {
            lines.push(new OutputLine('error', MV_ERRORS.MUTLIPLE_SOURCES_NONEXISTANT_DESTINATION));
            return { // early return
                type: 'output',
                lines
            }
        }


        // --- 4. ITERATE THROUGH THE SOURCES ---
        for (const sourcePath of sourcePaths) {
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

            // If the source wansn't found, push errors encounterd during traversal, and continue
            if (srcRes !== RESOLUTION.FOUND) {
                for (const error of srcResErrors) {
                    lines.push(new OutputLine(error.type, error.content));
                }
                continue;
            }

            // Case: Source is a Directory
            if (srcNode.type === 'dir') {
                // Case: Destination already exists
                if (destNode) {
                    // Make sure destination is not a file
                    if (destNode.type !== 'dir') {
                        lines.push(new OutputLine('error', MV_ERRORS.DIRECTORY_TO_FILE));
                        continue;
                    }

                    // Make sure destination doesnt already have src
                    const srcInDest = destNode.get(srcName); // Used to check if dest already has src
                    if (srcInDest && srcInDest.children.size > 0) {
                        lines.push(new OutputLine('error', MV_ERRORS.FOLDER_NOT_EMPTY(destinationPath)))
                    }

                    // Move source directory and its contents into destination directory
                    srcParent.removeChild(srcName);
                    destNode.addChild(srcNode);

                // Case: Destination doesnt yet exist
                } else {
                    // Move the child if necessary, and rename it
                    srcParent.removeChild(srcName);
                    srcNode.setName(destName);
                    destParent.addChild(srcNode);
                }

            // Case: Source is a File
            } else {
                // Case: Destination already exists
                if (destNode) {
                    // Case: Destination is a directory
                    if (destNode.type === 'dir') {

                        // Move source file inside destination directory
                        srcParent.removChild(srcNode);
                        destNode.addChild(srcNode);
                        
                    // Case: Destination is a file
                    } else  {

                        // Overwrite file with source file
                        srcParent.removeChild(srcNode);
                        destParent.removeChild(destName);
                        destParent.addChild(srcNode);

                    }

                // Case: Destination doesnt yet exist
                } else {
                    // Move the child if necessary, and rename it
                    srcParent.removeChild(srcName);
                    srcNode.setName(destName);
                    destParent.addChild(srcNode);
                }

            }
        }

        // --- 5. RETURN ---
        return {
            type: (errors.length > 0) ? 'output' : 'ignore',
            lines
        }
    }
}