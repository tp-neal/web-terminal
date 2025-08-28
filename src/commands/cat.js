/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cat.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's cat command
==================================================================================================*/

import { Command } from "./command.js";
import { CommandErrors } from "../util/error_messages.js";
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
    execute(switches, params) {
        const lines = []; // Container for all messages to print to the terminal

        // Check argument count - takes one or more sources to display output
        if (params.length === 0) {
            lines.push(OutputLine.error(CommandErrors.TOO_FEW_ARGS));
            lines.push(OutputLine.hint(`usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Process each filepath individually
        for (const filepath of params) {
            const {  // Attempt to resolve the path to the file
                status,
                targetNode,
                parentNode,
                targetName,
                errors,
            } = this.filesystem.resolvePath(filepath, {
                createIntermediary: false, // Don't create missing parts
                targetMustExist: true,     // To display contents of a file it must exist
            });

            // Handle critical errors (e.g. not found)
            if (status !== RESOLUTION.FOUND) {
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                continue; // Skip filepath
            }
            
            // Attempt to retrieve file content
            let fileContent;
            try { 
                fileContent = targetNode.getContent(); // if file, content will never be null/undef
            } catch (targetIsDirectory) {
                lines.push(OutputLine.error(targetIsDirectory.message));
                continue;
            }

            lines.push(OutputLine.general(fileContent));
        }

        return { type: "output", lines };
    }
}
