/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cd.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's cd command
==================================================================================================*/

import { Command } from "./command.js";
import { OutputLine } from "../util/output-line.js";
import { ERROR_MESSAGES } from "../config.js";

/*==================================================================================================
    Class Definition: [CdCommand]
==================================================================================================*/

/**
 * @class CdCommand
 * @brief Command for changing the current working directory.
 */
export class CdCommand extends Command {
    static commandName = "cd";
    static description = "Change directory";
    static usage = "cd [directory]";

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a cd command instance.
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
     * @brief Navigates the filesystem's current working directory (cwd).
     * @param {string[]} args - Array containing the target directory path at args[0].
     * @return {Object} - Result object indicating success or failure.
     * @property {string} return.type - 'navigation' on success, 'output' on error.
     * @property {OutputLine[]} return.lines - Contains error messages if navigation fails.
     */
    execute(args) {
        const lines = []; // Container for potential error messages

        // --- 1. Argument Parsing & Validation ---
        // Check argument count - cd typically takes 0 or 1 argument (target directory)
        if (args.length > 1) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_MANY_ARGS));
            lines.push(new OutputLine("hint", `usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Extract target path (empty string signifies navigating home)
        const path = args.length > 0 ? args[0] : "~";

        // --- 2. Execute Navigation ---
        // Ask the file system to navigate the cwd to the specified directory
        const { success, errorInfo } = this.filesystem.navigateTo(path);

        // --- 3. Handle Result ---
        // If the navigation failed, the filesystem returns error info to print
        if (!success) {
            lines.push(new OutputLine("error", errorInfo));
        }

        // Return based on success
        return {
            type: success ? "navigation" : "output",
            lines, // Contains error message only if success is false
        };
    }
}
