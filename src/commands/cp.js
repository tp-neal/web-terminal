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
import { FSUtil } from "../fs-management/fs-util.js";

/*==================================================================================================
    Module Constants
==================================================================================================*/

const CP_ERRORS = {
    DIRECTORY_TO_FILE: "Cannot copy a directory to a file.",
    MULTIPLE_SOURCES_FILE_DEST: "Cannot copy multiple sources to a file destination.",
    MULTIPLE_SOURCES_NONEXISTENT_DEST: "Cannot copy multiple sources to a nonexistent destination.",
    RECURSIVE_COPY_REQUIRED: "Non-empty directories must be specified to be copied recursivly.",
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
    /* Supported:
     * - 'r' recursive directory copy
     */

    /* Constructor
     **********************************************************************************************/
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
     **********************************************************************************************/
    /**
     * @brief Copies files or directories from source(s) to target.
     * @param {string[]} args - Array of command arguments (switches, sources, target).
     * @return {Object} - Result object with type and output lines.
     * @property {string} return.type - 'output' (even if only errors), or 'ignore' on success.
     * @property {OutputLine[]} return.lines - Contains error messages or hints.
     */
    execute(args) {
        // --- 0. Variable Initialization ---
        const lines = []; // Container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return { type: "output", lines };
            }
        }

        if (params.length < 2) {
            lines.push(new OutputLine("error", ERROR_MESSAGES.TOO_FEW_ARGS));
            return { type: "output", lines };
        }

        const recursive = switches.includes("r");

        // --- 2. Separate Source(s) and Destination ---
        const destinationPath = params.pop();
        const sourcePaths = params;
        const sourceCount = sourcePaths.length;

        // --- 3. Resolve Destination Path ---
        const destResolution = this.filesystem.resolvePath(destinationPath, {
            createIntermediary: false, // cp doesn't create intermediate dirs for the target
            targetMustExist: false
        });
        const dest = {
            status: destResolution.status,
            node: destResolution.targetNode,
            parent: destResolution.parentNode,
            fullname: destResolution.targetName,
            errors: destResolution.errors,
        };

        // Error if destination path resolution failed
        if (
            dest.status !== RESOLUTION.FOUND &&
            dest.status !== RESOLUTION.PARENT_FOUND_TARGET_MISSING
        ) {
            lines.push(...dest.errors.map((e) => new OutputLine(e.type, e.content)));
            return { type: "output", lines };
        }


        // --- 4. Validate Source/Destination Combination ---
        if (sourceCount > 1 && dest.status !== RESOLUTION.FOUND) {
            // Cant copy multiple sources to a nonexistent destination
            lines.push(new OutputLine("error", CP_ERRORS.MULTIPLE_SOURCES_NONEXISTENT_DEST));
            return { type: "output", lines };
        }
        if (sourceCount > 1 && dest.node && !dest.node.isDirectory) {
            // Cant copy multiple sources to a file
            lines.push(new OutputLine("error", CP_ERRORS.MULTIPLE_SOURCES_FILE_DEST));
            return { type: "output", lines };
        }


        // --- 5. Process Each Source ---
        for (const sourcePath of sourcePaths) {
            
            // Resolve source path
            const sourceResolution = this.filesystem.resolvePath(sourcePath, {
                createIntermediary: false,
                targetMustExist: true
            });
            const source = {
                status: sourceResolution.status,
                node: sourceResolution.targetNode,
                parent: sourceResolution.parentNode,
                fullname: sourceResolution.targetName,
                errors: sourceResolution.errors,
            };

            if (source.status !== RESOLUTION.FOUND) {
                lines.push(...source.errors.map((e) => new OutputLine(e.type, e.content)));
                continue;
            }

            // --- 6. Handle Source Based on Type ---
            if (source.node.isDirectory) {
                this._handleDirectoryCopy(dest, source, lines, { recursive, sourceCount });
            } else {
                this._handleFileCopy(dest, source, lines, { recursive, sourceCount });
            }
        }

        // --- 7. Return Result ---
        return {
            type: lines.length > 0 ? "output" : "ignore", // Output if errors occurred, ignore otherwise
            lines,
        };
    }

    _handleDirectoryCopy(dest, source, lines, info = {}) {
        const { recursive } = info;

        // Recursive flag required for directories
        if (!recursive) {
            lines.push(new OutputLine("error", CP_ERRORS.RECURSIVE_COPY_REQUIRED));
            lines.push(new OutputLine("hint", CP_HINTS.RECURSIVE_COPY_REQUIRED));
            return; // skip this source
        }

        const copyToExistingDirectory = dest.node && dest.node.isDirectory;
        const copyToExistingFile = dest.node && !dest.node.isDirectory;
        const copyToNewDirectory =
            dest.status === RESOLUTION.PARENT_FOUND_TARGET_MISSING;

        if (copyToExistingDirectory) {
            // Try adding the copy as a child if that file doesnt alredy exist in directory
            try {
                dest.node.addChild(source.node.clone( { recursive: true }));
            } catch (childAlreadyExists) {
                lines.push(new OutputLine("error", childAlreadyExists.message));
            }

        } else if (copyToExistingFile) {
            // Can't copy directory to a file, produce error
            lines.push(new OutputLine("error", CP_ERRORS.DIRECTORY_TO_FILE));
            return;

        } else if (copyToNewDirectory) {
            // Create a clone of the source with the new name
            try {
                dest.parent.addChild(source.node.clone({ newName: dest.fullname, recursive: true }));
            } catch (childAlreadyExists) {
                lines.push(new OutputLine("error", childAlreadyExists.message));
            }
        }
    }

    _handleFileCopy(dest, source, lines, info) {
        const { sourceCount } = info;

        const copyToExistingDirectory = dest.node && dest.node.isDirectory;
        const copyToNewFile = dest.status === RESOLUTION.PARENT_FOUND_TARGET_MISSING && 
                              sourceCount === 1;
        const overwriteExistingFile = dest.node && !dest.node.isDirectory && sourceCount === 1;

        if (copyToExistingDirectory) {
            // Try adding copy of source file if that file doesnt alredy exist in directory
            try {
                dest.node.addChild(source.node.clone());
            } catch (childAlreadyExists) { 
                lines.push(new OutputLine("error", childAlreadyExists.message));
            }
        }
        else if (overwriteExistingFile) {
            // Remove the file to be overwritten, and add copy of source renamed to original dest
            dest.parent.removeChild(dest.node.getFullName());
            // We have to seperate name from extension as currently dest.fullname is concatenated
            const trimmed = FSUtil.parseNameAndExtension(dest.fullname);
            try {
                dest.parent.addChild(source.node.clone({ newName: trimmed.name }));
            } catch (childAlreadyExists) {
                lines.push(new OutputLine("error", childAlreadyExists.message));
            }
        }
        else if (copyToNewFile) {
            // We have to seperate name from extension as currently dest.fullname is concatenated
            const trimmed = FSUtil.parseNameAndExtension(dest.fullname);
            // Shouldn't have to catch errors since file doesnt already exist
            dest.parent.addChild(source.node.clone({ newName: trimmed.name }));
        }
    }
}
