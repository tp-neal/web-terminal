/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: command.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Base class for commands to inherit from.
==================================================================================================*/

/*  Class Definition
***************************************************************************************************/
/**
 * @class Command
 * @brief Base class for all terminal commands
 */
export class Command {
    static commandName = '';
    static description = '';
    static usage = '';
    static supportedArgs = [];
    
    /**
     * @brief Base constructor for command classes
     */
    constructor() {
        // Base constructor
    }
    
    /**
     * @brief Execute method to be implemented by all subclasses
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type and content
     */
    execute(args) {
        // Base execution definintion
    }
}