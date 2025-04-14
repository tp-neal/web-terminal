/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: touch.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's touch command
==================================================================================================*/

import { ArgParser } from "../util/arg-parser.js";
import { Command } from "./command.js";
import { ERROR_MESSAGES } from "../config.js";
import { RESOLUTION } from "../fs-management/filesystem.js";
import { FSNode } from "../fs-management/fs-node.js";
import { FSUtil } from "../fs-management/fs-util.js";
import { OutputLine } from "../util/output-line.js";

/*==================================================================================================
    Class Definition: [TouchCommand]
==================================================================================================*/

/**
 * @class TouchCommand
 * @brief Command for creating new empty files or updating timestamps of existing files.
 */
export class TouchCommand extends Command {
    static commandName = "touch";
    static description = "Change file timestamps or create empty files"; // More standard desc
    static usage = "touch [switches] file...";
    static supportedArgs = [];

    /* Constructor
     ***********************************************************************************************/
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
     ***********************************************************************************************/
    /**
     * @brief Creates new files or updates timestamps for existing files.
     * @param {string[]} args - Array of command arguments (switches and file paths).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (only if errors occur), or 'ignore'.
     * @property {OutputLine[]} return.lines - Contains error messages.
     */
    execute(args) {
        const lines = []; // container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Validate switches
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return { type: "output", lines };
            }
        }

        // Ensure at least one file name is provided
        if (params.length === 0) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_FEW_ARGS));
            lines.push(new OutputLine("hint", `usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // --- 2. Process Each File Path ---
        for (const path of params) {
            // Attempt to resolve path
            const {
                status,
                targetNode, // The existing file/dir node, or null
                parentNode, // Parent directory where file should exist/be created
                targetName, // The final filename component
                errors,
            } = this.filesystem.resolvePath(path, {
                createIntermediary: false, // Touch doesn't create intermediate directories
                targetMustHaveType: null, // Target could be file or dir initially
            });

            // --- 3. Handle Resolution Results ---
            // If path resolution failed badly (not just missing or found)
            if (
                status === RESOLUTION.NOT_FOUND ||
                status === RESOLUTION.INVALID_PATH ||
                status === RESOLUTION.NOT_A_DIRECTORY
            ) {
                lines.push(...errors.map((e) => new OutputLine(e.type, e.content)));
                continue; // Skip to next path
            }

            // Scenario: File/Directory Exists (Update Timestamp)
            if (status === RESOLUTION.FOUND) {
                targetNode.updateModifiedTime(); // update accessed time
            }
            // Scenario: File Does Not Exist (Create New Empty File)
            else if (status === RESOLUTION.PARENT_FOUND_TARGET_MISSING) {
                // Make sure the target name is valid for a file
                const { valid, reasons } = FSUtil.isValidFileName(targetName);
                if (!valid) {
                    lines.push(
                        new OutputLine("error", ERROR_MESSAGES.INVALID_FILE_NAME(targetName))
                    );
                    if (reasons) lines.push(new OutputLine("error", reasons));
                    continue; // Skip to next path
                }

                // Create the new empty file
                const { name, extension } = FSUtil.parseNameAndExtension(targetName); // Use util to get base name and ext
                const newFile = new FSNode(name, extension || "txt"); // Default to .txt if no extension
                parentNode.addChild(newFile);
                // Successfully created, no output line needed on success
            }
        } // End loop through paths

        // --- 4. Return Result ---
        // If errors were encountered, print them, otherwise print nothing
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
