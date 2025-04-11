/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: tree.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's tree command
==================================================================================================*/

import { Command } from "../command.js";
import { OutputLine } from "../output-line.js"; // Import OutputLine
import { ArgParser } from "../arg-parser.js"; // Although unused, good practice
import { ERROR_MESSAGES } from "../config.js"; // Added for consistency
import { RESOLUTION } from "../file-system.js"; // Import RESOLUTION if path resolution is added

/*==================================================================================================
    Class Definition: [TreeCommand]
==================================================================================================*/

/**
 * @class TreeCommand
 * @brief Command for displaying the filesystem structure as a tree.
 */
export class TreeCommand extends Command {
    static commandName = "tree";
    static description = "List contents of directories in a tree-like format"; // Standard description
    static usage = "tree [directory]"; // Can optionally take a starting directory
    static supportedArgs = [];

    /* Constructor
     ***********************************************************************************************/
    /**
     * @brief Initializes a tree command instance.
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
     * @brief Generates and returns a string representation of the filesystem tree.
     * @param {string[]} args - Array of command arguments (optional starting directory).
     * @return {Object} - Result object with type and the tree lines.
     * @property {string} return.type - Always 'output'.
     * @property {OutputLine[]} return.lines - Array of OutputLine objects representing the tree structure.
     */
    execute(args) {
        const lines = []; // Container for the tree output lines

        // --- 1. Argument Parsing & Validation ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Validate switches if any are implemented
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return { type: "output", lines };
            }
        }

        // Tree takes 0 or 1 argument (starting directory)
        if (params.length > 1) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_MANY_ARGS));
            lines.push(new OutputLine("hint", `usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Determine starting node
        let startNode = this.filesystem.cwd; // Default to current directory
        const targetPath = params[0] || ""; // Use param if provided

        if (targetPath) {
            const { status, targetNode, errors } = this.filesystem.resolvePath(targetPath, {
                createIntermediary: false,
                targetMustHaveType: "dir", // Tree usually starts from a directory
            });
            if (status !== RESOLUTION.FOUND) {
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                // You might want a specific error like "tree: path not found or not a directory"
                return { type: "output", lines };
            }
            startNode = targetNode;
        }

        // --- 2. Generate Tree ---
        this.filesystem.getFSTree(startNode, "", true, lines); // Pass startNode, initial prefix, isLast=true (for root level)

        // --- 3. Return Output ---
        return { type: "output", lines };
    }
}
