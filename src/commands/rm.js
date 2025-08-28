/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: rm.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's rm command
==================================================================================================*/

import { Command } from "./command.js";
import { CommandErrors, FilesystemErrors } from "../util/error_messages.js";
import { RESOLUTION } from "../fs-management/filesystem.js";
import { OutputLine } from "../util/output-line.js";

/*==================================================================================================
    Module Constants
==================================================================================================*/

const RM_ERRORS = {
    CANT_REMOVE_CWD: "Cannot remove current working directory '.', skipping",
    CANT_REMOVE_CWD_PARENT: "Cannot remove current working directory's parent '..', skipping"
}

const RM_HINTS = {
    RM_DIR_NOT_EMPTY:
        "Try using the '-r' switch to remove directories and their contents recursively.",
};

/*==================================================================================================
    Class Definition: [RmCommand]
==================================================================================================*/

/**
 * @class RmCommand
 * @brief Command for removing (deleting) files or directories.
 */
export class RmCommand extends Command {
    static commandName = "rm";
    static description = "Remove files or directories";
    static usage = "rm [switches] file...";
    static supportedArgs = ["r"];
    /* Supported
     * 'r' - recursive removal
     */

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a rm command instance.
     * @param {Object} data - Object containing required dependencies.
     * @param {Filesystem} data.filesystem - Reference to the filesystem instance.
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /* Public Methods
     **********************************************************************************************/
    /**
     * @brief Removes files or directories specified in the arguments.
     * @param {string[]} args - Array of command arguments (switches and file/dir paths).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (only if errors occur), or 'ignore'.
     * @property {OutputLine[]} return.lines - Contains error messages or hints.
     */
    execute(switches, params) {
        const lines = []; // Container for all messages to print to the terminal

        // Check argument count - need at least a single target to be removed
        if (params.length === 0) {
            lines.push(OutputLine.error(CommandErrors.TOO_FEW_ARGS));
            return { type: "output", lines };
        }

        // Set switch logic
        const recursiveDelete = switches.includes("r");

        // Process each source path individually
        for (const path of params) {
            const { // Attempt to resolve path
                status,
                targetNode,
                parentNode, // Needed to check parent relative to cwd for safety
                targetName,
                errors,
            } = this.filesystem.resolvePath(path, {
                createIntermediary: false, // We do not create directories that dont already exist
                targetMustExist: true      // The target must exist for us to delete it
            });

            // If file/directory wasn't found, report error and continue
            if (status !== RESOLUTION.FOUND) {
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                continue; // Skip to the next path
            }

            // Prevent deletion of root directory
            if (targetNode === this.filesystem.root) {
                lines.push(OutputLine.error(FilesystemErrors.PRESERVED_DIR(targetName)));
                continue;
            }

            // Prevent deletion of current working directory
            if (targetNode === this.filesystem.cwd) {
                lines.push(OutputLine.error(RM_ERRORS.CANT_REMOVE_CWD)); // More specific error
                continue;
            }

            // Prevent deletion of cwd's parent directories
            // We check if the current working directory's path starts with the path to the node to
            // be deleted. So if the directory to delete is target:(/home/user) and we are in 
            // cwd:(/home/user/Documents) the action will be prevented as cwd: starts with target:
            if (this.filesystem.cwd.getFilePath().startsWith(targetNode.getFilePath())) {
                lines.push(OutputLine.error(RM_ERRORS.CANT_REMOVE_CWD_PARENT));
                continue;
            }

            // Make sure recursive delete is set for directories
            if (targetNode.isDirectory) {
                // If recursive delete is not set, and directory is not empty, return error
                if (!recursiveDelete && targetNode.children.size > 0) {
                    lines.push(
                        OutputLine.error(FilesystemErrors.DIRECTORY_NOT_EMPTY(targetName))
                    );
                    lines.push(OutputLine.hint(RM_HINTS.RM_DIR_NOT_EMPTY));
                    continue; // Skip to next path
                }
            }
            
            // Delete the file/directory
            this.filesystem.deleteNode(targetNode, { recursive: true }); // recursive is irrelevant for files
            
        } // End loop through paths

        // If there are errorts print them, otherwise ignore
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
