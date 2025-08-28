/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: command.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Base class for commands to inherit from.
==================================================================================================*/

/*  Class Definition
 **************************************************************************************************/
/**
 * @class Command
 * @brief Base class for all terminal commands
 */
export class Command {
    static commandName = ""; // Name used to invoke command
    static description = ""; // Brief description of what the command does
    static usage = ""; // Notation: brackets "[]" means optional, "..." means multiple may be provided
    static supportedArgs = []; // This is used by commands that dont support switches so do not remove

    /**
     * @brief Base constructor for command classes
     */
    constructor() {
        // Base constructor
    }

    /**
     * @brief Execute method to be implemented by all subclasses
     * @param {string[]} switches Array of command switches
     * @param {string[]} params Array of arguments to pass to command
     * @return {Object} Result object with type and content
     */
    execute(switches, params) {
        // Base execution definintion
    }
}
