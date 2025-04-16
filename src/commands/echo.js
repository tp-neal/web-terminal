/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: echo.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's echo command
==================================================================================================*/

import { ArgParser } from "../util/arg-parser.js";
import { Command } from "./command.js";
import { ERROR_MESSAGES } from "../config.js"; // Added for consistency
import { OutputLine } from "../util/output-line.js";

/*==================================================================================================
    Class Definition: [EchoCommand]
==================================================================================================*/

/**
 * @class EchoCommand
 * @brief Command for displaying text in the terminal.
 */
export class EchoCommand extends Command {
    static commandName = "echo";
    static description = "Display a line of text";
    static usage = "echo [switches] [text]...";
    static supportedArgs = [];

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes an echo command instance.
     * @param {Object} data - Object containing required dependencies
     */
    constructor(data) {
        super();
    }

    /* Public Methods
     **********************************************************************************************/
    /**
     * @brief Returns a string for the terminal to display based on provided arguments.
     * @param {string[]} args - Array of command arguments (switches and text parts).
     * @return {Object} - Result object with type and output text.
     * @property {string} return.type - Always 'output'.
     * @property {OutputLine[]} return.lines - Array containing a single OutputLine with the text.
     */
    execute(args) {
        const lines = []; // Container for the output line

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Validate switches if any are supported and implemented
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return { type: "output", lines };
            }
        }

        // --- 2. Construct Output ---
        // Join the parameters (text parts) with a space.
        // ArgParser handles quoted segments as single parameters.
        const outputText = params.join(" ");
        lines.push(new OutputLine("general", outputText));

        // --- 3. Return Output ---
        return { type: "output", lines };
    }
}
