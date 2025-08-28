/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: clear.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's clear command
==================================================================================================*/

import { Command } from "./command.js";
import { OutputLine } from "../util/output-line.js";
import { CommandErrors } from "../util/error_messages.js";

/*==================================================================================================
    Class Definition: [ClearCommand]
==================================================================================================*/

/**
 * @class ClearCommand
 * @brief Command for clearing the terminal screen display.
 */
export class ClearCommand extends Command {
    static commandName = "clear";
    static description = "Clear the terminal screen";
    static usage = "clear";
    

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a clear command instance.
     * @param {Object} data - Object containing required dependencies.
     */
    constructor(data) {
        super();
    }

    /* Public Methods
     **********************************************************************************************/
    /**
     * @brief Instructs the terminal to clear its display.
     * @param {string[]} args - Array of command arguments (should be empty).
     * @return {Object} - Result object indicating the clear action.
     * @property {string} return.type - Always 'clear'.
     * @property {OutputLine[]} return.lines - Always undefined or empty for 'clear'.
     */
    execute(switches, params) {
        const lines = []; // Container for all messages to print to the terminal

        // Check for any arguments - (clear doesn't take any)
        if (params.length > 0) {
            lines.push(OutputLine.error(CommandErrors.TOO_MANY_ARGS));
            lines.push(OutputLine.hint(`usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Return "clear" to tell terminal to clear display
        return { type: "clear" };
    }
}
