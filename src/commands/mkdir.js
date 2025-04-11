/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: mkdir.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's mkdir command
==================================================================================================*/

import { ArgParser } from "../arg-parser.js";
import { Command } from "../command.js";
import { ERROR_MESSAGES } from "../config.js";
import { FSNode, RESOLUTION } from "../file-system.js";
import { FSUtil } from "../fs-util.js";
import { OutputLine } from "../output-line.js";

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

        // Ensure at least one directory name is provided
        if (params.length === 0) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_FEW_ARGS));
            lines.push(new OutputLine("hint", `usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Set switch logic
        const createIntermediary = switches.includes("p");

        // --- 2. Process Each Directory Path ---
        for (const path of params) {
            // Attempt to resolve path
            const {
                status,
                targetNode, // Will be null if target is missing, but we will use the status instead
                parentNode, // The directory where the new dir should be created
                targetName, // The name of the final directory in the path
                errors,
            } = this.filesystem.resolvePath(path, {
                createIntermediary: createIntermediary, // Pass the -p flag status
                targetMustHaveType: null, // Doesn't matter, will handle existant and nonexistant
            });

            // --- 3. Handle Resolution Results ---
            // If path resolved successfully and target already exists
            if (status === RESOLUTION.FOUND) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.FILE_EXISTS(targetName)));
                continue; // Skip to next path
            }

            // If resolution failed for reasons other than the target simply missing
            if (status !== RESOLUTION.PARENT_FOUND_TARGET_MISSING) {
                // Add specific errors from resolution attempt
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                if (status === RESOLUTION.NOT_FOUND && !createIntermediary) {
                    lines.push(new OutputLine("hint", MKDIR_HINTS.MKDIR_CREATE_PARENTS));
                }
                continue; // Skip to next path
            }

            // At this point, status must be PARENT_FOUND_TARGET_MISSING

            // Make sure directory name is valid
            const { valid, reasons } = FSUtil.isValidDirectoryName(targetName);
            if (!valid) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_DIR_NAME(targetName)));
                if (reasons) lines.push(new OutputLine("error", reasons)); // Add specific reasons if available
                continue; // Skip to next path
            }

            // --- 4. Create Directory ---
            const newDirectory = new FSNode(targetName, "dir");
            parentNode.addChild(newDirectory);
            // Successfully created, no output line needed
        }

        // --- 5. Return Result ---
        // If there are errors, print them, otherwise print nothing
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
