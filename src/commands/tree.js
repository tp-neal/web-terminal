/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: tree.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's tree command
==================================================================================================*/

import { Command } from '../command.js';

/*  Class Definition
***************************************************************************************************/
/**
 * @class TreeCommand
 * @brief Command for displaying the filesystem tree structure
 */
export class TreeCommand extends Command {
    static commandName = 'tree';
    static description = 'Display file system tree';
    static usage = 'tree';

    /**
     * @brief Initializes a tree command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Returns a string representation of the filesystem tree
     * @param {string[]} args Array of command arguments (not used)
     * @return {Object} Result object with type ('output') and filesystem tree string
     */
    execute(args) {
        const lines = [] // container for all messages to be printed to terminal

        this.filesystem.getFSTree(this.filesystem.root, '', '', lines);

        // Return the tree stringified as a single entry
        return { 
            type: 'output', 
            lines
        };
    }
}