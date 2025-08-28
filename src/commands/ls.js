/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: ls.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's ls command
==================================================================================================*/

import { ArgParser } from "../util/arg-parser.js";
import { Command } from "./command.js";

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
    /* Supported
     * 'a' - include hidden files and directories
     */

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
    execute(switches, params) {
        const lines = []; // container for all messages to print to the terminal

        const showHidden = switches.includes("a");

        // Determine and validate target path
        // Defaults to cwd if no path parameter is given
        const targetPath =
            params && params.length > 0 ? params[0] : this.filesystem.cwd.getFilePath();

        const targetResolution = this.filesystem.resolvePath(targetPath, {
            createIntermediary: false, // ls doesn't create missing directories
            targetMustExist: true      // target must exist to be listed
        });

        // Package results for easier access
        const target = {
            status: targetResolution.status,
            node: targetResolution.targetNode,
            parent: targetResolution.parentNode,
            fullname: targetResolution.targetName,
            errors: targetResolution.errors,
        };

        // Handle resolution errors (e.g. path not found)
        if (target.status !== RESOLUTION.FOUND) {
            lines.push(...target.errors.map((e) => new OutputLine(e.type, e.content)));
            return { type: "output", lines };
        }

        // Generate output based on whether target is a directory or a file
        if (target.node.isDirectory) {
            // List directory contents
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
        else {
            // List a single file
            lines.push(new OutputLine("file", target.node.getFullName()));
        }

        // Determine return type based on number of output lines
        return {
            type: lines.length > 0 ? "output" : "ignore",
            lines,
        };
    }
}
