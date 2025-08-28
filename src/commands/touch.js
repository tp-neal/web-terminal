/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: touch.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's touch command
==================================================================================================*/

import { Command } from "./command.js";

import { RESOLUTION } from "../fs-management/filesystem.js";
import { FSNode } from "../fs-management/fs-node.js";
import { FSUtil } from "../fs-management/fs-util.js";
import { OutputLine } from "../util/output-line.js";
import { CommandErrors, FilesystemErrors } from "../util/error_messages.js";

/*==================================================================================================
    Class Definition: [TouchCommand]
==================================================================================================*/

/**
 * @class TouchCommand
 * @brief Command for creating new empty files or updating timestamps of existing files.
 */
export class TouchCommand extends Command {
    static commandName = "touch";
    static description = "Change file timestamps or create empty files";
    static usage = "touch [switches] file...";

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a touch command instance.
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
     * @brief Creates new files or updates timestamps for existing files.
     * @param {string[]} args - Array of command arguments (switches and file paths).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (only if errors occur), or 'ignore'.
     * @property {OutputLine[]} return.lines - Contains error messages.
     */
    execute(switches, params) {
        const lines = []; // container for all messages to print to the terminal

        // Check argument count - at least one file name must be provided
        if (params.length === 0) {
            lines.push(OutputLine.error(CommandErrors.TOO_FEW_ARGS));
            lines.push(OutputLine.hint(`usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Process each filepath
        for (const path of params) {
            const { // Resolve path
                status,
                targetNode, // The existing file/dir node, or null
                parentNode, // Parent directory where file should exist/be created
                targetName, // The final filename component
                errors,
            } = this.filesystem.resolvePath(path, {
                createIntermediary: false, // Touch doesn't create intermediate directories
                targetMustExist: false     // Touch creates new files if they don't yet exist
            });

            // Handle critical errors during path resolution
            if (status !== RESOLUTION.FOUND &&
                status !== RESOLUTION.PARENT_FOUND_TARGET_MISSING
            ) {
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                continue; // Skip to next path
            }

            // If the file exists, update timestamp, otherwise create a new file
            if (status === RESOLUTION.FOUND) {
                targetNode.updateModifiedTime(); // update accessed time
            } else {
                // Make sure the target name is valid for a file
                const { valid, reasons } = FSUtil.isValidFileName(targetName);
                if (!valid) {
                    // If its not valid, return the reasons to user
                    lines.push(
                        OutputLine.error(FilesystemErrors.INVALID_FILE_NAME(targetName))
                    );
                    if (reasons) lines.push(OutputLine.error(reasons));
                    continue; // Skip to next path
                }

                // Create the new empty file
                // Resolution name consists of both name and extension (e.g textfile.txt)
                // Therefore, we must seperate these sections
                const { name, extension } = FSUtil.parseNameAndExtension(targetName);
                // The FSNode constructor will default to 'txt' if no extension is provided
                const newFile = new FSNode(name, extension);
                parentNode.addChild(newFile);
            }
        } // End loop through paths

        // If errors were encountered, print them, otherwise print nothing
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
