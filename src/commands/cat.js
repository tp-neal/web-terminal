/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cat.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's cat command
==================================================================================================*/

import { Command } from "./command.js";
import { ArgParser } from "../util/arg-parser.js";
import { ERROR_MESSAGES } from "../config.js"; // Added for consistency, though not used directly yet
import { OutputLine } from "../util/output-line.js";
import { RESOLUTION } from "../fs-management/filesystem.js";

/*==================================================================================================
    Module Constants
==================================================================================================*/

const CAT_ERRORS = {
    CANNOT_READ_DIRECTORY: "Cannot read the contents of a directory.",
};

/*==================================================================================================
    Class Definition: [CatCommand]
==================================================================================================*/

/**
 * @class CatCommand
 * @brief Command for displaying the contents of files.
 */
export class CatCommand extends Command {
    static commandName = "cat";
    static description = "Display contents of a file";
    static usage = "cat [switches] file...";
    static supportedArgs = [];

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a cat command instance.
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
     * @brief Displays the content of specified files.
     * @param {string[]} args - Array of command arguments (switches and file paths).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - Always 'output'.
     * @property {OutputLine[]} return.lines - Array of lines containing file content or errors.
     */
    execute(args) {
        const lines = []; // Container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Validate switches if any are supported and implemented
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return { type: "output", lines };
            }
        }

        // Ensure at least one file parameter is provided
        if (params.length === 0) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_FEW_ARGS));
            lines.push(new OutputLine("hint", `usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // --- 2. Process File Paths ---
        for (const filepath of params) {
            // Attempt to resolve the path to the file
            const {
                status,
                targetNode,
                parentNode, // Not directly used here but part of the standard return
                targetName, // Not directly used here but part of the standard return
                errors,
            } = this.filesystem.resolvePath(filepath, {
                createIntermediary: false, // Don't create missing parts
                targetMustHaveType: null, // Target can be anything initially
            });

            // --- 3. Handle Resolution Results ---
            // If file/directory wasn't found, push errors returned from resolution
            if (status !== RESOLUTION.FOUND) {
                for (const error of errors) {
                    lines.push(new OutputLine(error.type, error.content));
                }
                continue; // Move to the next filepath
            }

            // If the target is a directory, push a specific error message
            if (targetNode.isDirectory) {
                lines.push(new OutputLine("error", CAT_ERRORS.CANNOT_READ_DIRECTORY));
                continue; // Move to the next filepath
            }

            // If the target is a file, push its contents to output
            const fileContent = targetNode.getContent() || ""; // Handle null content
            lines.push(new OutputLine("general", fileContent));
        }

        // --- 4. Return Output ---
        return { type: "output", lines };
    }
}
