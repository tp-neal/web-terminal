/**
 * @proj Web-Based Terminal
 * @file mv.js
 * @date 04/19/2025 // Note: Date kept as per original, consider updating if needed
 * @author Tyler Neal
 * @github github.com/tn-dev
 * @brief Contains implementation of the interpreter's 'mv' (move/rename) command.
 */

import { Command } from "./command.js";
import { CommandErrors, FilesystemErrors } from "../util/error_messages.js";
import { RESOLUTION } from "../fs-management/filesystem.js";
import { OutputLine } from "../util/output-line.js";
import { FSUtil } from "../fs-management/fs-util.js"; // Assuming FSUtil is needed

// --- Module Constants ---

// Error messages specific to 'mv'. Uses functions directly for messages needing params.
const MV_ERRORS = {
    // Static errors
    DIRECTORY_TO_FILE: "Cannot move directory onto non-directory.",
    MULTIPLE_SOURCES_FILE_DESTINATION: "Cannot move multiple sources to a file destination.",

    // Errors defined as functions taking parameters
    MUTLIPLE_SOURCES_NONEXISTANT_DESTINATION: (destPath) =>
        `Cannot move multiple sources to a non-existent destination '${destPath}'`,
    PARENT_TO_SUBDIRECTORY: (sourcePath, destPath) =>
        `Cannot move directory '${sourcePath}' into its own subdirectory '${destPath}'`,
    TARGET_EXISTS: (sourcePath, destPath) =>
        `Cannot move '${sourcePath}' to '${destPath}': Target already exists.`,
    MOVE_FAILED: (sourcePath, errorMsg) =>
        `Failed to move '${sourcePath}': ${errorMsg}`,
    INVALID_DESTINATION: (destPath) =>
        `Invalid target destination '${destPath}'.`,

    // Errors previously handled inline, now correctly defined as functions
    // accepting necessary path arguments.
    CANT_MOVE_CWD: (cwdPath) =>
        `Cannot move current working directory '${cwdPath}', skipping.`,
    CANT_MOVE_CWD_PARENT: (sourcePath, cwdPath) =>
        `Cannot move parent '${sourcePath}' of current working directory '${cwdPath}', skipping.`,
};


// --- Class Definition: MvCommand ---

/**
 * @class MvCommand
 * @brief Command for moving (renaming) files and directories.
 * @extends Command
 */
export class MvCommand extends Command {
    static commandName = "mv";
    static description = "Move (rename) files";
    static usage = "mv [switches] source... target";

    filesystem; // Reference to the Filesystem instance

    /**
     * @brief Initializes an mv command instance.
     * @param {{filesystem: Filesystem}} data - Object containing required dependencies.
     */
    constructor(data) {
        super();
        if (!data || !data.filesystem) {
            throw new Error("MvCommand requires a Filesystem instance.");
        }
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Executes the move/rename operation.
     * @param {string[]} _switches - Ignored for mv currently, but kept for signature consistency.
     * @param {string[]} params - Array of command parameters (sources..., target).
     * @return {{type: string, lines: OutputLine[]}} - Result object.
     * @property {string} return.type - 'output' (only if errors occur), or 'ignore' on success.
     * @property {OutputLine[]} return.lines - Contains error messages generated during execution.
     */
    execute(switches, params) {
        const lines = []; // Container for all messages to print to the terminal

        // Check argument count - requires at least one source and destination
        if (params.length < 2) {
            lines.push(OutputLine.error(CommandErrors.TOO_FEW_ARGS));
            lines.push(OutputLine.hint(`usage: ${MvCommand.usage}`));
            return { type: "output", lines };
        }

        const destinationPath = params.pop();
        const sourcePaths = params;
        const sourceCount = sourcePaths.length;

        // Resolve destination
        const destResolution = this.filesystem.resolvePath(destinationPath, {
            createIntermediary: false, // 'mv' doesn't create intermediate dirs
            targetMustExist: false     // Destination might be a new name/location
        });
        const dest = { // Package resolution results for clarity
            status: destResolution.status,
            node: destResolution.targetNode,
            parent: destResolution.parentNode,
            fullname: destResolution.targetName,
            errors: destResolution.errors,
        };

        // Handle critical destination path resolution errors (e.g. invalid path)
        if (dest.status !== RESOLUTION.FOUND && 
            dest.status !== RESOLUTION.PARENT_FOUND_TARGET_MISSING
        ) {
            lines.push(...dest.errors.map((e) => new OutputLine(e.type, e.content)));
            return { type: "output", lines };
        }

        // Handle multiple source errors
        if (sourceCount > 1) {
            // Cannot move multiple items to a non-existent target
            if (dest.status === RESOLUTION.PARENT_FOUND_TARGET_MISSING) {
                lines.push(OutputLine.error(MV_ERRORS.MUTLIPLE_SOURCES_NONEXISTANT_DESTINATION(destinationPath)));
                return { type: "output", lines };
            }
            // Cannot move multiple items onto an existing file
            if (dest.node && !dest.node.isDirectory) {
                lines.push(OutputLine.error(MV_ERRORS.MULTIPLE_SOURCES_FILE_DESTINATION));
                return { type: "output", lines };
            }
        }


        const cwdPath = this.filesystem.cwd.getFilePath();

        // Handle each source path individually
        for (const sourcePath of sourcePaths) {
            // Resolve source path - it must exist to be moved
            const sourceResolution = this.filesystem.resolvePath(sourcePath, {
                createIntermediary: false,
                targetMustExist: true
            });
            const source = { // Package resolution results for clarity
                status: sourceResolution.status,
                node: sourceResolution.targetNode,
                parent: sourceResolution.parentNode,
                fullname: sourceResolution.targetName,
                errors: sourceResolution.errors,
            };

            // Handle critical source resolution errors
            if (source.status !== RESOLUTION.FOUND) {
                lines.push(...source.errors.map((e) => new OutputLine(e.type, e.content)));
                continue; // Skip this source
            }

            const sourceFullPath = source.node.getFilePath();

            // Prevent moving essential directories
            if (source.node === this.filesystem.root) {
                lines.push(OutputLine.error(FilesystemErrors.PRESERVED_DIR(sourceFullPath)));
                continue;
            }
            // Prevent moving CWD - Call function from MV_ERRORS, passing cwdPath
            if (source.node === this.filesystem.cwd) {
                lines.push(OutputLine.error(MV_ERRORS.CANT_MOVE_CWD(cwdPath)));
                continue;
            }
            // Prevent moving an ancestor of CWD - Call function from MV_ERRORS, passing paths
            if (cwdPath.startsWith(sourceFullPath + (source.node.isDirectory ? "/" : ""))) {
                lines.push(OutputLine.error(MV_ERRORS.CANT_MOVE_CWD_PARENT(sourceFullPath, cwdPath)));
                continue;
            }
            // Prevent moving a directory into itself or a subdirectory
            if (dest.node && dest.node.getFilePath().startsWith(sourceFullPath + "/")) {
                 lines.push(OutputLine.error(MV_ERRORS.PARENT_TO_SUBDIRECTORY(sourceFullPath, dest.node.getFilePath())));
                 continue;
            }
            // Prevent moving item onto itself (different paths might resolve to same node)
            if (source.node === dest.node) {
                lines.push(OutputLine.error(`Cannot move '${sourcePath}' onto itself.`));
                continue;
            }


            // Move based on destination type
            try {
                // --- Scenario A: Target is an Existing Directory ---
                if (dest.node && dest.node.isDirectory) {
                    const targetNameInDest = source.node.getFullName();
                    if (dest.node.getChild(targetNameInDest)) {
                        // Target name already exists within the destination directory
                        const targetFilePath = dest.node.getFilePath() + "/" + targetNameInDest;
                        lines.push(OutputLine.error(MV_ERRORS.TARGET_EXISTS(sourcePath, targetFilePath)));
                        continue; // Skip this source
                    }
                    // Perform the move
                    source.parent.removeChild(source.node.getFullName());
                    dest.node.addChild(source.node); // addChild updates parent reference

                // --- Scenario B: Target is an Existing File (Overwrite) ---
                } else if (dest.node) {
                    if (sourceCount > 1) {
                        lines.push(OutputLine.error(MV_ERRORS.MULTIPLE_SOURCES_FILE_DESTINATION));
                        return { type: "output", lines }; // Stop processing further sources
                    }
                    if (source.node.isDirectory) {
                        lines.push(OutputLine.error(MV_ERRORS.DIRECTORY_TO_FILE));
                        continue; // Skip this source
                    }

                    // Parse destination name
                    const destNameDetails = FSUtil.parseNameAndExtension(dest.fullname);

                    // Perform overwrite
                    source.parent.removeChild(source.node.getFullName());
                    dest.parent.removeChild(dest.node.getFullName());
                    source.node.setName(destNameDetails.name); // Rename source before adding
                    dest.parent.addChild(source.node);

                // --- Scenario C: Target Does Not Exist (Rename/Move) ---
                } else if (dest.status === RESOLUTION.PARENT_FOUND_TARGET_MISSING) {
                    const destNameDetails = FSUtil.parseNameAndExtension(dest.fullname);

                    // Perform move/rename
                    source.parent.removeChild(source.node.getFullName());
                    source.node.setName(destNameDetails.name); // Rename source
                    dest.parent.addChild(source.node); // Add to destination parent

                } else {
                    // Should not be reachable due to initial checks, but included for safety.
                    console.error(`Unhandled destination state for '${destinationPath}'.`);
                    continue;
                }
            } catch (error) {
                 // Catch errors during removeChild, addChild, setName etc.
                 lines.push(OutputLine.error(MV_ERRORS.MOVE_FAILED(sourcePath, error.message || "Unknown error")));
                 continue; // Skip to next source on failure
            }

        } // End loop through sources

        // Output if errors encountered, otherwise ignore
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}