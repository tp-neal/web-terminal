/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: echo.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's echo command
==================================================================================================*/

import { Command } from "./command.js";
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
    execute(switches, params) {
        const lines = []; // Container for the output line

        // Join the parameters (text parts) with a space.
        // ArgParser in *Class Command* handles quoted segments as single parameters.
        const outputText = params.join(" ");
        lines.push(OutputLine.general(outputText));
        return { type: "output", lines };
    }
}
