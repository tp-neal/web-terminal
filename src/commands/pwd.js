/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: pwd.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's pwd command
==================================================================================================*/

import { Command } from "./command.js";
import { OutputLine } from "../util/output-line.js";
import { ArgParser } from "../util/arg-parser.js"; // Although unused, good practice
import { ERROR_MESSAGES } from "../config.js"; // Added for consistency

/*==================================================================================================
    Class Definition: [PwdCommand]
==================================================================================================*/

/**
 * @class PwdCommand
 * @brief Command for printing the current working directory path.
 */
export class PwdCommand extends Command {
    static commandName = "pwd";
    static description = "Print name of current/working directory"; // Slightly more standard description
    static usage = "pwd";

    /* Constructor
     ***********************************************************************************************/
    /**
     * @brief Initializes a pwd command instance.
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
     * @brief Retrieves and returns the full path of the current working directory.
     * @param {string[]} args - Array of command arguments (should be empty).
     * @return {Object} - Result object with type and the path.
     * @property {string} return.type - Always 'output'.
     * @property {OutputLine[]} return.lines - Array containing a single OutputLine with the path.
     */
    execute(args) {
        const lines = []; // Container for the output line

        // --- 1. Argument Parsing & Validation ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Check for any arguments (pwd doesn't take any)
        if (switches.length > 0 || params.length > 0) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_MANY_ARGS));
            return { type: "output", lines };
        }

        // --- 2. Get Current Path ---
        // Get the full path from the filesystem's current working directory node
        const currentPath = this.filesystem.cwd.getFilePath();
        lines.push(new OutputLine("general", currentPath));

        // --- 3. Return Output ---
        return { type: "output", lines };
    }
}
