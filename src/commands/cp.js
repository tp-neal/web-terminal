/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: cp.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of the interpreter's cp command
==================================================================================================*/

import { Command } from "./command.js";
import { CommandErrors } from "../util/error_messages.js";
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
    execute(switches, params) {
        const lines = []; // container for all messages to print to the terminal

        // Check argument count - takes one or more sources and exactly one destination
        if (params.length < 2) {
            lines.push(OutputLine.error(CommandErrors.TOO_FEW_ARGS));
            lines.push(OutputLine.hint(`usage: ${this.constructor.usage}`));
            return { type: "output", lines };
        }

        // Seperate sources from single destination
        const destinationPath = params.pop();
        const sourcePaths = params;
        const sourceCount = sourcePaths.length;

        // Set switch logic
        const recursive = switches.includes("r");

        // Resolve destination path - might not exist yet
        const destResolution = this.filesystem.resolvePath(destinationPath, {
            createIntermediary: false, // cp doesn't create intermediate dirs for the target
            targetMustExist: false
        });
        const dest = { // Package destination with renamed attributes for clarity
            status: destResolution.status,
            node: destResolution.targetNode,
            parent: destResolution.parentNode,
            fullname: destResolution.targetName,
            errors: destResolution.errors,
        };

        // Handle critical errors if path was invalid
        if (dest.status !== RESOLUTION.FOUND &&
            dest.status !== RESOLUTION.PARENT_FOUND_TARGET_MISSING) 
        {
            lines.push(...dest.errors.map((e) => new OutputLine(e.type, e.content)));
            return { type: "output", lines };
        }

        // Make sure multiple sources aren't being copied to nonexistent file
        // Note: Any nonexistent destination the cp command assumes is a file name and will create
        // a new file if necessary (it cannot create nonexistent directories)
        if (sourceCount > 1 && dest.status === RESOLUTION.PARENT_FOUND_TARGET_MISSING) {
            lines.push(OutputLine.error(CP_ERRORS.MULTIPLE_SOURCES_NONEXISTENT_DEST));
            return { type: "output", lines };
        }

        // Make sure multiple sources aren't being copied to a file
        if (sourceCount > 1 && dest.node && !dest.node.isDirectory) {
            // Cant copy multiple sources to a file
            lines.push(OutputLine.error(CP_ERRORS.MULTIPLE_SOURCES_FILE_DEST));
            return { type: "output", lines };
        }

        // Process each provided source individually
        for (const sourcePath of sourcePaths) {

            // Resolve the source path - it must exist to be copied
            const sourceResolution = this.filesystem.resolvePath(sourcePath, {
                createIntermediary: false,
                targetMustExist: true
            });
            const source = { // Package source with renamed attributes for clarity
                status: sourceResolution.status,
                node: sourceResolution.targetNode,
                parent: sourceResolution.parentNode,
                fullname: sourceResolution.targetName,
                errors: sourceResolution.errors,
            };

            // Handle critical resolution errors
            if (source.status !== RESOLUTION.FOUND) {
                lines.push(...source.errors.map((e) => new OutputLine(e.type, e.content)));
                continue;
            }

            // Delegate copying logic based on whether the source is a directory or file
            if (source.node.isDirectory) {
                this._handleDirectoryCopy(dest, source, lines, { recursive, sourceCount });
            } else {
                this._handleFileCopy(dest, source, lines, { recursive, sourceCount });
            }
        }

        // Return output if errors/hints were generated, otherwise ignore
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }

    /**
     * @brief Handles the logic for copying a source directory.
     * @param {object} dest - Resolved destination information.
     * @param {object} source - Resolved source information.
     * @param {OutputLine[]} lines - Array to push errors/hints to.
     * @param {{recursive: boolean, sourceCount: number}} options - Copy options.
     * @private
     */
    _handleDirectoryCopy(dest, source, lines, { recursive, sourceCount }) {
        // Directories require the recursive flag unless empty (check could be added to source.node.clone)
        if (!recursive && source.node.children.size > 0) { // Added check for non-empty
            lines.push(OutputLine.error(CP_ERRORS.RECURSIVE_COPY_REQUIRED));
            lines.push(OutputLine.hint(CP_HINTS.RECURSIVE_COPY_REQUIRED));
            return; // Skip this source
        }

        // Determine the copy scenario based on destination status
        const copyToExistingDirectory = dest.node && dest.node.isDirectory;
        const copyToExistingFile = dest.node && !dest.node.isDirectory;
        const copyToNewDirectory = dest.status === RESOLUTION.PARENT_FOUND_TARGET_MISSING;

        try {
            if (copyToExistingDirectory) {
                // Add a clone of the source directory as a child of the destination directory
                // clone() handles recursive copy; addchild checks for name conflicts.
                dest.node.addChild(source.node.clone({ recursive: true }));
            } else if (copyToExistingFile) {
                // This is an error condition
                lines.push(OutputLine.error(CP_ERRORS.DIRECTORY_TO_FILE));
                return;
            } else if (copyToNewDirectory) {
                // Create a clone of the source directory with the destination's name
                dest.parent.addChild(source.node.clone({ newName: dest.fullname, recursive: true }));
            }
        } catch (error) {
            // Catch errors from clone() or addChild() (e.g., name conflicts)
            lines.push(OutputLine.error(error.message || "Failed to copy directory."));
        }
    }

     /**
     * @brief Handles the logic for copying a source file.
     * @param {object} dest - Resolved destination information.
     * @param {object} source - Resolved source information.
     * @param {OutputLine[]} lines - Array to push errors/hints to.
     * @param {{sourceCount: number}} options - Copy options (sourceCount might be relevant for overwrite logic).
     * @private
     */
    _handleFileCopy(dest, source, lines, { sourceCount }) {
        // Determine the copy scenario based on destination status
        const copyToExistingDirectory = dest.node && dest.node.isDirectory;
        const copyToNewFile = dest.status === RESOLUTION.PARENT_FOUND_TARGET_MISSING;
        const overwriteExistingFile = dest.node && !dest.node.isDirectory;

        try {
             // Extract potential new name/extension once if needed.
             const newNameDetails = (copyToNewFile || overwriteExistingFile)
                ? FSUtil.parseNameAndExtension(dest.fullname)
                : null;

            if (copyToExistingDirectory) {
                // Add a clone of the source file into the destination directory.
                // addChild handles name conflicts.
                dest.node.addChild(source.node.clone());
            }
            else if (overwriteExistingFile) {
                // Overwriting: Remove existing destination file first.
                dest.parent.removeChild(dest.node.getFullName());
                // Add a clone of the source file, renamed to the destination name.
                dest.parent.addChild(source.node.clone({ newName: newNameDetails.name }));
            }
            else if (copyToNewFile) {
                // Add a clone of the source file to the parent directory, using the new destination name.
                dest.parent.addChild(source.node.clone({ newName: newNameDetails.name }));
            }
        } catch (error) {
            // Catch errors from clone(), removeChild(), or addChild()
             lines.push(OutputLine.error(error.message || "Failed to copy file."));
        }
    }
}
