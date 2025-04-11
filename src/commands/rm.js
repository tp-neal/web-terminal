/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: rm.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's rm command
==================================================================================================*/

import { ArgParser } from "../arg-parser.js";
import { Command } from "../command.js";
import { ERROR_MESSAGES } from "../config.js";
import { RESOLUTION } from "../file-system.js"; // Import RESOLUTION
import { OutputLine } from "../output-line.js";

/*==================================================================================================
    Module Constants
==================================================================================================*/

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
    static supportedArgs = ["r"]; // Recursive flag (common: f - force)

    /* Constructor
     ***********************************************************************************************/
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
     ***********************************************************************************************/
    /**
     * @brief Removes files or directories specified in the arguments.
     * @param {string[]} args - Array of command arguments (switches and file/dir paths).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (only if errors occur), or 'ignore'.
     * @property {OutputLine[]} return.lines - Contains error messages or hints.
     */
    execute(args) {
        const lines = []; // Container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Validate switches
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return { type: "output", lines };
            }
        }

        // Ensure at least one file/directory name is provided
        if (params.length === 0) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_FEW_ARGS));
            return { type: "output", lines };
        }

        // Set switch logic
        const recursiveDelete = switches.includes("r");
        // const forceDelete = switches.includes('f'); // Example for future

        // --- 2. Process Each Path ---
        for (const path of params) {
            // Attempt to resolve path
            const {
                status,
                targetNode,
                parentNode, // Needed to check parent relative to cwd for safety
                targetName,
                errors,
            } = this.filesystem.resolvePath(path, {
                createIntermediary: false,
                targetMustHaveType: null,
            });

            // --- 3. Handle Resolution Results ---
            // If file/directory wasn't found, report error and continue
            if (status !== RESOLUTION.FOUND) {
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                continue; // Skip to the next path
            }

            // --- 4. Perform Safety Checks ---
            // Prevent deletion of root directory
            if (targetNode === this.filesystem.root) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.PRESERVED_DIR(targetName)));
                continue;
            }
            // Prevent deletion of current working directory
            if (targetNode === this.filesystem.cwd) {
                lines.push(new OutputLine("error", `Cannot remove '.', skipping`)); // More specific error
                continue;
            }
            // Prevent deletion of cwd's parent directory using '..' specifically
            if (path === ".." || targetNode === this.filesystem.cwd.parent) {
                // Check both path string and resolved node
                lines.push(new OutputLine("error", `Cannot remove '..', skipping`));
                continue;
            }

            // --- 5. Attempt Deletion ---
            // Case: Target is a Directory
            if (targetNode.isDirectory) {
                // If recursive delete is not set, and directory is not empty, return error
                if (!recursiveDelete && targetNode.children.size > 0) {
                    lines.push(
                        new OutputLine("error", ERROR_MESSAGES.DIRECTORY_NOT_EMPTY(targetName))
                    );
                    lines.push(new OutputLine("hint", RM_HINTS.RM_DIR_NOT_EMPTY));
                    // Unlike mkdir, rm might continue trying other targets after an error
                    continue; // Skip to next path
                }

                // Proceed with deletion (recursive or empty directory)
                const deleted = this.filesystem.deleteNode(targetNode, {
                    recursive: recursiveDelete,
                });
                if (!deleted) {
                    lines.push(
                        new OutputLine("error", `Failed to remove directory '${targetName}'`)
                    ); // Generic failure
                }

                // Case: Target is a File
            } else {
                const deleted = this.filesystem.deleteNode(targetNode, { recursive: false }); // Recursive is irrelevant for files
                if (!deleted) {
                    lines.push(new OutputLine("error", `Failed to remove file '${targetName}'`)); // Generic failure
                }
            }
        } // End loop through paths

        // --- 6. Return Result ---
        // If errors were encountered, print them, otherwise, don't print anything
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
