/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: pwd.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's pwd command
==================================================================================================*/

import { Command } from "./command.js";
import { OutputLine } from "../util/output-line.js";
import { CommandErrors } from "../util/error_messages.js";

/*==================================================================================================
    Class Definition: [PwdCommand]
==================================================================================================*/

/**
 * @class PwdCommand
 * @brief Command for printing the current working directory path.
 */
export class PwdCommand extends Command {
    static commandName = "pwd";
    static description = "Print name of current/working directory";
    static usage = "pwd";
    

    /* Constructor
     **********************************************************************************************/
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
     **********************************************************************************************/
    /**
     * @brief Retrieves and returns the full path of the current working directory.
     * @param {string[]} args - Array of command arguments (should be empty).
     * @return {Object} - Result object with type and the path.
     * @property {string} return.type - Always 'output'.
     * @property {OutputLine[]} return.lines - Array containing a single OutputLine with the path.
     */
    execute(switches, params) {
        const lines = []; // Container for the output line

        // Check argument count - takes no arguments
        if (params > 0) {
            lines.push(OutputLine.error(CommandErrors.TOO_MANY_ARGS));
            lines.push(OutputLine.hint(`usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        lines.push(OutputLine.general(this.filesystem.cwd.getFilePath()));
        return { type: "output", lines };
    }
}
