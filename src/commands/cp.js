/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cp.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's cp command
==================================================================================================*/

import { ArgParser } from "../util/arg-parser.js";
import { Command } from "./command.js";
import { ERROR_MESSAGES } from "../config.js";
import { RESOLUTION } from "../fs-management/filesystem.js";
import { OutputLine } from "../util/output-line.js";

/*==================================================================================================
    Module Constants
==================================================================================================*/

const CP_ERRORS = {
    DIRECTORY_TO_FILE: "Cannot copy a directory to a file.",
    MULTIPLE_SOURCES_FILE_DEST: "Cannot copy multiple sources to a file destination.",
    MULTIPLE_SOURCES_NONEXISTENT_DEST: "Cannot copy multiple sources to a nonexistent destination.",
    RECURSIVE_COPY_REQUIRED: "Non empty directories must be specified to be copied recursivly.",
};

const CP_HINTS = {
    RECURSIVE_COPY_REQUIRED:
        "Try using the '-r' switch to copy directories and their contents recursively.",
};

/*==================================================================================================
    Class Definition: [CpCommand]
==================================================================================================*/

/**
 * @class CpCommand
 * @brief Command for copying files and directories.
 */
export class CpCommand extends Command {
    static commandName = "cp";
    static description = "Copy files and directories";
    static usage = "cp [switches] source... target";
    static supportedArgs = ["r"];
    /* Supported
     * 'r' - recursive directory copy
     */

    /* Constructor
     ***********************************************************************************************/
    /**
     * @brief Initializes a cp command instance.
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
     * @brief Copies files or directories from source(s) to target.
     * @param {string[]} args - Array of command arguments (switches, sources, target).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (even if only errors), or 'ignore' on perfect success with no output needed.
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

        // Ensure at least one source and one target are provided
        if (params.length < 2) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_FEW_ARGS));
            return { type: "output", lines };
        }

        // Set switch logic
        const recursive = switches.includes("r");

        // --- 2. Separate Source(s) and Destination ---
        const destinationPath = params.pop();
        const sourcePaths = params;
        const sourceCount = sourcePaths.length;

        // --- 3. Resolve Destination Path ---
        const {
            status: destRes,
            targetNode: destNode,
            parentNode: destParent,
            targetName: destName,
            errors: destResErrors,
        } = this.filesystem.resolvePath(destinationPath, {
            createIntermediary: false, // cp doesn't create intermediate dirs for the target
            targetMustHaveType: null, // Target can be file or dir initially
        });

        // Error if destination path resolution failed badly
        if (
            destRes === RESOLUTION.NOT_FOUND ||
            destRes === RESOLUTION.INVALID_PATH ||
            destRes === RESOLUTION.NOT_A_DIRECTORY
        ) {
            lines.push(...destResErrors.map((e) => new OutputLine(e.type, e.content)));
            return { type: "output", lines };
        }

        // --- 4. Validate Source/Destination Combination ---
        // Cannot copy multiple sources if destination isn't an existing directory
        if (sourceCount > 1 && destRes !== RESOLUTION.FOUND) {
            lines.push(new OutputLine("error", CP_ERRORS.MULTIPLE_SOURCES_NONEXISTENT_DEST));
            return { type: "output", lines };
        }
        if (sourceCount > 1 && destNode && !destNode.isDirectory) {
            lines.push(new OutputLine("error", CP_ERRORS.MULTIPLE_SOURCES_FILE_DEST));
            return { type: "output", lines };
        }

        // --- 5. Process Each Source ---
        for (const sourcePath of sourcePaths) {
            // Resolve the source path
            const {
                status: srcRes,
                targetNode: srcNode,
                parentNode: srcParent, // Not directly used here but part of the standard return
                targetName: srcName, // Not directly used here but part of the standard return
                errors: srcResErrors,
            } = this.filesystem.resolvePath(sourcePath, {
                createIntermediary: false,
                targetMustHaveType: null,
            });

            // If source doesn't exist, report error and skip to next source
            if (srcRes !== RESOLUTION.FOUND) {
                lines.push(...srcResErrors.map((e) => new OutputLine(e.type, e.content)));
                continue;
            }

            // --- 5a. Handle Source is Directory ---
            if (srcNode.isDirectory) {
                // Recursive flag required for directories
                if (!recursive) {
                    lines.push(new OutputLine("error", CP_ERRORS.RECURSIVE_COPY_REQUIRED));
                    lines.push(new OutputLine("hint", CP_HINTS.RECURSIVE_COPY_REQUIRED));
                    continue; // Skip this source
                }

                // Scenario: Copying dir INTO an existing directory destination
                if (destNode && destNode.isDirectory) {
                    // Check if source already exists in destination (optional: overwrite logic needed here if desired)
                    if (destNode.hasChild(srcNode.getFullName())) {
                        lines.push(
                            new OutputLine(
                                "error",
                                `cp: cannot copy '${sourcePath}', target '${destNode.getFilePath()}/${srcNode.getFullName()}' already exists.`
                            )
                        );
                        continue;
                    }
                    destNode.addChild(this.filesystem.copyNode(srcNode, { recursive: true }));
                }
                // Scenario: Copying dir TO a new name (dest doesn't exist, parent does)
                else if (destRes === RESOLUTION.PARENT_FOUND_TARGET_MISSING && sourceCount === 1) {
                    const newDir = this.filesystem.copyNode(srcNode, {
                        newName: destName,
                        recursive: true,
                    });
                    destParent.addChild(newDir);
                }
                // Scenario: Copying dir TO an existing file destination (Error)
                else if (destNode && !destNode.isDirectory) {
                    lines.push(
                        new OutputLine(
                            "error",
                            `cp: cannot overwrite non-directory '${destinationPath}' with directory '${sourcePath}'`
                        )
                    );
                    continue;
                }
                // Scenario: Multiple sources (handled earlier, dest must be existing dir)
            }
            // --- 5b. Handle Source is File ---
            else {
                // Scenario: Copying file INTO an existing directory destination
                if (destNode && destNode.isDirectory) {
                    // Check if file already exists in destination (optional: overwrite logic needed)
                    if (destNode.hasChild(srcNode.getFullName())) {
                        lines.push(
                            new OutputLine(
                                "error",
                                `cp: cannot copy '${sourcePath}', target '${destNode.getFilePath()}/${srcNode.getFullName()}' already exists.`
                            )
                        );
                        continue;
                    }
                    destNode.addChild(this.filesystem.copyNode(srcNode));
                }
                // Scenario: Copying file TO a new file name (dest doesn't exist, parent does)
                else if (destRes === RESOLUTION.PARENT_FOUND_TARGET_MISSING && sourceCount === 1) {
                    destParent.addChild(this.filesystem.copyNode(srcNode, { newName: destName }));
                }
                // Scenario: Copying file TO an existing file (Overwrite)
                else if (destNode && !destNode.isDirectory && sourceCount === 1) {
                    destParent.removeChild(destName); // Remove existing file
                    destParent.addChild(this.filesystem.copyNode(srcNode, { newName: destName })); // Add copy
                }
                // Scenario: Multiple sources (handled earlier, dest must be existing dir)
            }
        }

        // --- 6. Return Result ---
        return {
            type: lines.length > 0 ? "output" : "ignore", // Output if errors occurred, ignore otherwise
            lines,
        };
    }
}
