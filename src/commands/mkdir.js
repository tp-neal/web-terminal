/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: mkdir.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's mkdir command
==================================================================================================*/

import { Command } from "./command.js";
import { CommandErrors, FilesystemErrors } from "../util/error_messages.js";
import { RESOLUTION } from "../fs-management/filesystem.js";
import { FSNode } from "../fs-management/fs-node.js";
import { FSUtil } from "../fs-management/fs-util.js";
import { OutputLine } from "../util/output-line.js";

/*==================================================================================================
    Module Constants
==================================================================================================*/

const MKDIR_HINTS = {
    MKDIR_CREATE_PARENTS:
        "Try using the '-p' flag to create parent directories if they don't yet exist.",
};

/*==================================================================================================
    Class Definition: [MkdirCommand]
==================================================================================================*/

/**
 * @class MkdirCommand
 * @brief Command for creating new directories.
 */
export class MkdirCommand extends Command {
    static commandName = "mkdir";
    static description = "Create new directories";
    static usage = "mkdir [switches] directory...";
    static supportedArgs = ["p"];
    /* Supported
     * 'p' - parent directory creation
     */

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a mkdir command instance.
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
     * @brief Creates new directories specified in the arguments.
     * @param {string[]} args - Array of command arguments (switches and directory paths).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (only if errors occur), or 'ignore'.
     * @property {OutputLine[]} return.lines - Contains error messages or hints.
     */
    execute(switches, params) {
        const lines = []; // Container for all messages to print to the terminal

        // Check argument count - at least one directory must be provided
        if (params.length < 0) {
            lines.push(OutputLine.error(CommandErrors.TOO_FEW_ARGS));
            lines.push(OutputLine.hint(`usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Set switch logic
        const createIntermediary = switches.includes("p");

        // Proccess each directory path individually
        for (const path of params) {
            const { // Attempt to resolve path
                status,
                targetNode, // We use status instead of this to determine nodes existance
                parentNode,
                targetName,
                errors,
            } = this.filesystem.resolvePath(path, {
                createIntermediary: createIntermediary, // Pass the -p flag status
                targetMustExist: false // We dont want the target to exist as we are to create it
            });

            // Catch case that directory already exists for specific print
            if (status === RESOLUTION.FOUND) {
                lines.push(OutputLine.error(FilesystemErrors.FILE_OR_DIR_EXISTS(targetName)));
                continue; // Skip to next path
            }

            // Catch remaining error cases
            if (status !== RESOLUTION.PARENT_FOUND_TARGET_MISSING) {
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                if (!createIntermediary) {
                    lines.push(OutputLine.hint(MKDIR_HINTS.MKDIR_CREATE_PARENTS));
                }
                continue; // Skip to next path
            }

            // At this point, status must be PARENT_FOUND_TARGET_MISSING meaning the directory does
            // not yet exist, and the path to it is valid.

            // Make sure directory name is valid
            const { valid, reasons } = FSUtil.isValidDirectoryName(targetName);
            if (!valid) {
                // If the name is invalid, provided the reasons back to the user
                lines.push(OutputLine.error(FilesystemErrors.INVALID_DIR_NAME(targetName)));
                if (reasons) 
                    lines.push(...reasons.map((e) => OutputLine.error(e))); 
                continue; // Skip to next path
            }

            // Create the new directory 
            const newDirectory = new FSNode(targetName, "dir");
            parentNode.addChild(newDirectory);
        }

        // If there were errors/hints provided output, otherwise ignore
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
