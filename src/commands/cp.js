/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cp.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's cp command
==================================================================================================*/

import { ArgParser } from '../arg-parser.js';
import { Command } from '../command.js';
import { ERROR_MESSAGES } from '../config.js';
import { FSNode, RESOLUTION } from '../file-system.js';
import { OutputLine } from '../output-line.js';

const CP_ERRORS = {
    DIRECTORY_TO_FILE: 'Cannot copy a directory to a file.',
    MULTIPLE_SOURCES: 'Cannot copy multiple sources to a nonexistent directory.',
    RECURSIVE_COPY_REQUIRED: 'Recursive copy required for copying directories.',
}

const CP_HINTS = {
    RECURSIVE_COPY_REQUIRED: 'Use the -r switch to copy directories recursively.',
}

/*  Class Definition
***************************************************************************************************/
/**
 * @class CpCommand
 * @brief Command for copying files and directories
 */
export class CpCommand extends Command {
    static commandName = 'cp';
    static description = 'Copy files and directories';
    static usage = 'cp [switches] source_file target_file';
    static supportedArgs = ['r'];

    /**
     * @brief Initializes a cp command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Copies files or directories
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
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

        // Set switch logic based on supplied switches
        const recursive = switches.includes('r');


        // --- 2. GATHER SOURCE INFORMATION ---
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

        // Return an error if the destination path is invalid
        if (destRes !== RESOLUTION.PARENT_FOUND_TARGET_MISSING &&
            destRes !== RESOLUTION.FOUND) {
            for (const error of destResErrors) {
                lines.push(new OutputLine(error.type, error.content));
            }
        }


        // --- 4. HANDLE SINGLE SOURCES ---
        if (sourceCount === 1) {
            const { // Gather information on the source path
                status: srcRes,
                targetNode: srcNode,
                parentNode: srcParent,
                targetName: srcName,
                errors: srcResErrors
            } = this.filesystem.resolvePath(sourcePaths[0], {
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

            // Case: Source is a Directory
            if (srcNode.isDirectory) {
                // Make sure recursive flag was set
                if (!recursive) {
                    lines.push(new OutputLine('error', CP_ERRORS.RECURSIVE_COPY_REQUIRED));
                    lines.push(new OutputLine('hint', CP_HINTS.RECURSIVE_COPY_REQUIRED));
                    return {
                        type: 'output',
                        lines
                    }
                }

                // Case: destNode exists - determine if its a file or directory
                if (destNode) {
                    // If destination is a file, we cannot copy directory contents to it
                    if (!destNode.isDirectory) {
                        lines.push(new OutputLine('error', CP_ERRORS.DIRECTORY_TO_FILE));
                        return {
                            type: 'output',
                            lines
                        }
                    }
                    
                    // Since the destination exists, and is a directory, copy entire source dir to it.
                    destNode.addChild(this.filesystem.copyNode(srcNode));

                // Case: destNode is null - create new directory to copy SOURCE CONTENTS
                } else {
                    const newDir = new FSNode(destName, 'dir');
                    destParent.addChild(newDir);
                    for (const [childName, childNode] of srcNode.children) {
                        newDir.addChild(this.filesystem.copyNode(childNode));
                    }
                }

            // Case: Source is a file
            } else {
                // Case: destNode exists - determine if its a file or directory
                if (destNode) {
                    // Case: destNode is a directory - copy file to it
                    if (destNode.isDirectory) {
                        destNode.addChild(this.filesystem.copyNode(srcNode));

                    // Case: destNode is a file - overwrite it
                    } else {
                        destParent.removeChild(destName);
                        destParent.addChild(this.filesystem.copyNode(srcNode, destName));
                    }

                // Case: destNode is null - create new file to copy contents to
                } else {
                    destParent.addChild(this.filesystem.copyNode(srcNode, destName));
                }
            }


        // --- 5. HANDLE MULTIPLE SOURCES
        } else if (sourceCount > 1) {
            // Validate destination
            if (!destNode || !destNode.isDirectory) {
                lines.push(new OutputLine('error', CP_ERRORS.MULTIPLE_SOURCES));
                return {
                    type: 'output',
                    lines
                }
            }

            // Iterate each source path
            for (const path of sourcePaths) {
                // Resolve the source path
                const {
                    status: srcRes,
                    targetNode: srcNode,
                    parentNode: srcParent,
                    targetName: srcName,
                    errors: srcResErrors
                } = this.filesystem.resolvePath(path, {
                    createIntermediary: false,  // We are looking for a currently existing file
                    targetMustHaveType: null    // Source can be a file or directory
                });

                // If the source wansn't found, push errors, and continue to next source
                if (srcRes !== 'FOUND') {
                    for (const error of srcRes.errors) {
                        lines.push(new OutputLine(error.type, error.content));
                    }
                    continue; // skip to next source
                }

                // Case: Source is a Directory
                if (srcNode.isDirectory) {
                    // Make sure recursive flag was set
                    if (!recursive) {
                        lines.push(new OutputLine('error', CP_ERRORS.RECURSIVE_COPY_REQUIRED));
                        lines.push(new OutputLine('hint', CP_HINTS.RECURSIVE_COPY_REQUIRED));
                        continue;
                    }

                    // Since the destination exists, and is a directory, copy the source dir to it.
                    destNode.addChild(this.filesystem.copyNode(srcNode, { recursive: true }));

                // Case: Source is a File
                } else {
                    // Copy file straight to destination directory
                    destNode.addChild(this.filesystem.copyNode(srcNode));
                }
            }
        }


        // --- 6. RETURN SUCCESSFULLY ---
        return {
            type: 'output',
            lines
        }
    }
}