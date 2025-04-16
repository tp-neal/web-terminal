/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: todo.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's todo command
==================================================================================================*/

import { Command } from "./command.js";
import { CONFIG, ERROR_MESSAGES } from "../config.js"; // Import CONFIG and ERROR_MESSAGES
import { OutputLine } from "../util/output-line.js";
import { ArgParser } from "../util/arg-parser.js"; // Although unused, good practice

/*==================================================================================================
    Class Definition: [TodoCommand]
==================================================================================================*/

/**
 * @class TodoCommand
 * @brief Command for displaying the hardcoded TODO list from the config.
 */
export class TodoCommand extends Command {
    static commandName = "todo";
    static description = "Display the project TODO list";
    static usage = "todo";
    static supportedArgs = [];

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a todo command instance.
     * @param {Object} data - Object containing required dependencies (none needed for todo).
     */
    constructor(data) {
        super();
    }

    /* Public Methods
     **********************************************************************************************/
    /**
     * @brief Returns the configured TODO list string.
     * @param {string[]} args - Array of command arguments (should be empty).
     * @return {Object} - Result object with type and TODO content.
     * @property {string} return.type - Always 'output'.
     * @property {OutputLine[]} return.lines - Array containing a single OutputLine with the TODO list.
     */
    execute(args) {
        const lines = []; // Container for the output line

        // --- 1. Argument Parsing & Validation ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Check for any arguments (todo doesn't take any)
        if (switches.length > 0 || params.length > 0) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_MANY_ARGS));
            lines.push(new OutputLine("hint", `usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // --- 2. Get TODO List ---
        // Retrieve the TODO list string from the configuration
        const todoContent = CONFIG.TO_DO_LIST || "TODO list not configured."; // Fallback message
        lines.push(new OutputLine("general", todoContent));

        // --- 3. Return Output ---
        return { type: "output", lines };
    }
}
