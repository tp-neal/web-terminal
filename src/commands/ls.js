/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: ls.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's ls command
==================================================================================================*/

import { ArgParser } from "../util/arg-parser.js";
import { Command } from "./command.js";
import { ERROR_MESSAGES } from "../config.js";
import { RESOLUTION } from "../fs-management/filesystem.js";
import { OutputLine } from "../util/output-line.js";

/*==================================================================================================
    Class Definition: [LsCommand]
==================================================================================================*/

/**
 * @class LsCommand
 * @brief Command for listing directory contents
 */
export class LsCommand extends Command {
    static commandName = "ls";
    static description = "List directory contents";
    static usage = "ls [switches] [directory]";
    static supportedArgs = ["a"];

    /*  Constructor
     **********************************************************************************************/
    /**
     * @brief Initializes an ls command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /*  Public Methods
     **********************************************************************************************/
    /**
     * @brief Lists contents of the current working directory.
     * @param {string[]} args - Array of provided command arguments.
     * @return {Object} - Result object with type and directory listing.
     * @property {string} return.type  - Description of type property (e.g., 'output' 'ignore').
     * @property {OutputLine[]} return.lines - Array of lines to be ouptput to the terminal.
     */
    execute(args) {
        // --- 0. Variable Initialization ---
        const lines = []; // container for all messages to print to the terminal

        // --- 1. Argument Parsing ---
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Make sure switches are valid
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                lines.push(new OutputLine("error", ERROR_MESSAGES.INVALID_SWITCH(switchName)));
                return {
                    type: "output",
                    lines,
                };
            }
        }

        // Set switch logic
        const showHidden = switches.includes("a");

        // --- 2. Validate Source ---
        const targetPath =
            params && params.length > 0 ? params[0] : this.filesystem.cwd.getFilePath();

        const targetResolution = this.filesystem.resolvePath(targetPath, {
            createIntermediary: false, // cp doesn't create intermediate dirs for the target
            targetMustExist: false
        });
        const target = {
            status: targetResolution.status,
            node: targetResolution.targetNode,
            parent: targetResolution.parentNode,
            fullname: targetResolution.targetName,
            errors: targetResolution.errors,
        };

        // If the source wansn't found, push errors encounterd during traversal, and exit
        if (target.status !== RESOLUTION.FOUND) {
            lines.push(...target.errors.map((e) => new OutputLine(e.type, e.content)));
            return { type: "output", lines };
        }

        // --- 3. Handle target based on type ---
        if (target.node.isDirectory) {
            // Add each of the nodes children to output
            for (const [childName, childNode] of target.node.children) {
                if (!childNode.isHidden || showHidden) {
                    if (childNode.isDirectory) {
                        lines.push(new OutputLine("directory", childNode.getFullName()));
                    } else {
                        lines.push(new OutputLine("file", childNode.getFullName()));
                    }
                }
            }
        }
        // Scenario: target is a file
        else {
            // Just add the target file to output
            lines.push(new OutputLine("file", target.node.getFullName()));
        }

        // --- 4. Return Output ---
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
