/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cd.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's cd command
==================================================================================================*/

import { Command } from "./command.js";
import { OutputLine } from "../util/output-line.js";
import { CommandErrors } from "../util/error_messages.js";

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
    execute(switches, params) {
        const lines = []; // Container for potential error messages

        // Check argument count - takes 0 or 1 arguments (target directory)
        if (params.length > 1) {
            lines.push(OutputLine.error(CommandErrors.TOO_MANY_ARGS));
            lines.push(OutputLine.hint(`usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // If no path provided, default path to home directory '~'
        let path;
        if (params.length === 0) {
            path = '~';
        } else {
            path = params[0];
        }

        // Ask filesystem to attempt navigation
        // FIX: In the future, we should ask the filesystem to resolve the path but handle
        //      everything else with the terminal itself. The terminal should be responsible for
        //      keeping track of the current working directory, not the filesystem itself.
        const { success, errors } = this.filesystem.navigateTo(path);
        if (!success) {
            lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
        }

        // If navigation was successful, return "navigation" to terminal to signal to change \
        // prompt's current working directory
        return {
            type: success ? "navigation" : "output",
            lines
        };
    }
}
