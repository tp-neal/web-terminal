/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: mv.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's mv command
==================================================================================================*/

import { ArgParser } from "../util/arg-parser.js"; // Import ArgParser
import { Command } from "./command.js";
import { ERROR_MESSAGES } from "../config.js";
import { RESOLUTION } from "../fs-management/filesystem.js"; // Import FSNode if needed, RESOLUTION
import { FSUtil } from "../fs-management/fs-util.js";
import { OutputLine } from "../util/output-line.js"; // Import OutputLine

/*==================================================================================================
    Module Constants
==================================================================================================*/

const MV_ERRORS = {
    // Specific errors for mv
    DIRECTORY_TO_FILE: "Cannot move directory onto non-directory.",
    MULTIPLE_SOURCES_FILE_DESTINATION: "Cannot move multiple sources to a file destination.",
    MUTLIPLE_SOURCES_NONEXISTANT_DESTINATION:
        "Cannot move multiple sources to a non-existent destination.",
};

/*==================================================================================================
    Class Definition: [MvCommand]
==================================================================================================*/

/**
 * @class MvCommand
 * @brief Command for moving (renaming) files and directories.
 */
export class MvCommand extends Command {
    static commandName = "mv";
    static description = "Move (rename) files";
    static usage = "mv [switches] source... target"; // Adjusted usage
    static supportedArgs = [];

    /* Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes a mv command instance.
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
     * @brief Moves or renames files and directories from source(s) to target.
     * @param {string[]} args - Array of command arguments (switches, sources, target).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (only if errors occur), or 'ignore'.
     * @property {OutputLine[]} return.lines - Contains error messages or hints.
     */
    execute(args) {
        const lines = []; // Container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Validate switches
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return { type: "output", lines };
            }
        }

        // Ensure at least one source and one target
        if (params.length < 2) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_FEW_ARGS));
            lines.push(new OutputLine("hint", `usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // --- 2. Separate Source(s) and Destination ---
        const destinationPath = params.pop();
        const sourcePaths = params;
        const sourceCount = sourcePaths.length;

        // --- 3. Resolve Destination Path ---
        const {
            status: destRes,
            targetNode: destNode, // Will be null if destination doesnt already exist
            parentNode: destParent, // Must exist to continue
            targetName: destName, // Full destination name, must trim for renaming
            errors: destResErrors,
        } = this.filesystem.resolvePath(destinationPath, {
            createIntermediary: false, // mv doesn't create intermediate dirs for the target
            targetMustHaveType: null,
        });
        const { name: trimmedDestName } = FSUtil.parseNameAndExtension(destName);

        // Error if destination path resolution failed badly
        if (
            destRes === RESOLUTION.INVALID_PATH ||
            (destRes === RESOLUTION.NOT_A_DIRECTORY && sourceCount === 1)
        ) {
            lines.push(...destResErrors.map((e) => new OutputLine(e.type, e.content)));
            return { type: "output", lines };
        }

        // --- 4. Validate Source/Destination Combination ---
        if (sourceCount > 1 && destRes !== RESOLUTION.FOUND) {
            lines.push(new OutputLine("error", MV_ERRORS.MUTLIPLE_SOURCES_NONEXISTANT_DESTINATION));
            return { type: "output", lines };
        }
        if (sourceCount > 1 && destNode && !destNode.isDirectory) {
            lines.push(new OutputLine("error", MV_ERRORS.MULTIPLE_SOURCES_FILE_DESTINATION));
            return { type: "output", lines };
        }

        // --- 5. Process Each Source ---
        for (const sourcePath of sourcePaths) {
            const {
                status: srcRes,
                targetNode: srcNode,
                parentNode: srcParent,
                targetName: srcName, // Full name of the source node itself
                errors: srcResErrors,
            } = this.filesystem.resolvePath(sourcePath, {
                createIntermediary: false,
                targetMustHaveType: null,
            });

            // If source doesn't exist, report error and skip
            if (srcRes !== RESOLUTION.FOUND) {
                lines.push(...srcResErrors.map((e) => new OutputLine(e.type, e.content)));
                continue;
            }

            // --- 4. Perform Safety Checks ---
            // Prevent moving of root directory
            if (srcNode === this.filesystem.root) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.PRESERVED_DIR(targetName)));
                continue;
            }
            // Prevent moving of current working directory
            if (srcNode === this.filesystem.cwd) {
                lines.push(new OutputLine("error", `Cannot move '.', skipping`)); // More specific error
                continue;
            }
            // Prevent moving of cwd's parent directory using '..' specifically
            if (sourcePath === ".." || srcNode === this.filesystem.cwd.parent) {
                // Check both path string and resolved node
                lines.push(new OutputLine("error", `Cannot move '..', skipping`));
                continue;
            }
            // Prevent moving a directory into itself or its own child
            if (destNode && destNode.getFilePath().startsWith(srcNode.getFilePath)) {
                lines.push(
                    new OutputLine(
                        "error",
                        `Cannot move '${sourcePath}' to '${targetPathInDest}': File exists`
                    )
                );
            }

            // --- 5a. Scenario: Target is an Existing Directory ---
            if (destNode && destNode.isDirectory) {
                const targetPathInDest = `${destinationPath}/${srcNode.getFullName()}`;
                const existingNodeInDest = destNode.getChild(srcNode.getFullName());

                // Check if target already exists in destination directory
                if (existingNodeInDest) {
                    lines.push(
                        new OutputLine(
                            "error",
                            `Cannot move '${sourcePath}' to '${targetPathInDest}': File exists`
                        )
                    );
                    continue;
                }

                // Move source node into destination directory
                srcParent.removeChild(srcNode.getFullName());
                destNode.addChild(srcNode); // addChild handles setting the parent

                // --- 5b. Scenario: Target is an Existing File (Only valid for single source) ---
            } else if (destNode && !destNode.isDirectory) {
                if (sourceCount > 1) {
                    // Should have been caught earlier, but double-check
                    lines.push(
                        new OutputLine("error", MV_ERRORS.MULTIPLE_SOURCES_FILE_DESTINATION)
                    );
                    // No need to continue loop if this happens
                    return { type: "output", lines };
                }
                if (srcNode.isDirectory) {
                    lines.push(new OutputLine("error", MV_ERRORS.DIRECTORY_TO_FILE));
                    continue; // Skip this source
                }
                // Overwrite destination file with source file
                srcParent.removeChild(srcNode.getFullName()); // Remove source from original location
                destParent.removeChild(destName); // Remove original destination file
                srcNode.setName(trimmedDestName); // Rename source node to destination name before adding
                destParent.addChild(srcNode); // Add source node (now renamed) to destination parent

                // --- 5c. Scenario: Target Does Not Exist (Rename/Move) ---
            } else if (destRes === RESOLUTION.PARENT_FOUND_TARGET_MISSING) {
                // Move and rename the source node
                srcParent.removeChild(srcNode.getFullName());
                srcNode.setName(trimmedDestName); // Rename source node
                destParent.addChild(srcNode); // Add to the target's parent directory

                // --- 5d. Scenario: Invalid Destination (e.g., component isn't a directory) ---
            } else {
                lines.push(
                    new OutputLine("error", `Invalid target destination '${destinationPath}'`)
                );
                lines.push(...destResErrors.map((e) => new OutputLine(e.type, e.content))); // Add details
                continue; // Skip this source
            }
        } // End loop through sources

        // --- 6. Return Result ---
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
