
/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: help.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's help command
==================================================================================================*/

import { Command } from "./command.js";
import { OutputLine } from "../util/output-line.js";
import { CommandRegistry } from "../command-management/command-registry.js";

/*==================================================================================================
    Class Definition: [CatCommand]
==================================================================================================*/

/**
 * @class CatCommand
 * @brief Command for displaying the contents of files.
 */
export class HelpCommand extends Command {
    static commandName = "help";
    static description = "Display usage of supported commands";
    static usage = "help";
    
    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a cat command instance.
     * @param {Object} data - Object containing required dependencies.
     * @param {Filesystem} data.filesystem - Reference to the filesystem instance.
     */
    constructor(data) {
        super();
        this.commandRegistry = data.commandRegistry;
    }

    /* Public Methods
     **********************************************************************************************/
    /**
     * @brief Displays the content of specified files.
     * @param {string[]} args - Array of command arguments (switches and file paths).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - Always 'output'.
     * @property {OutputLine[]} return.lines - Array of lines containing file content or errors.
     */
    execute(switches, params) {
        const lines = []; // Container for all messages to print to the terminal

        lines.push(new OutputLine("file", "GNU voidsh, version 0.0.0-release (x86_64)"));
        lines.push(
            OutputLine.general(
                "Notation: brackets '[]' means optional, '...' means multiple may be provided.\n\n"
            )
        )

        // Add usage for each command
        for (const [commandName, commandClass] of Object.entries(this.commandRegistry.commands)) {
            lines.push(OutputLine.general(commandClass.usage));
        }

        return {type: "output", lines };
    }
}
