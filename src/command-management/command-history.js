/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: command-history.js
* @date: 04/03/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of command history class. This class is used to maintain and 
*         navigate through old commands.
==================================================================================================*/

/*  Class Definition
 **************************************************************************************************/
/**
 * @class CommandHistory
 * @brief Manages the command history for up/down arrow navigation
 * @todo Fix command history navigation
 */
export class CommandHistory {
    /**
     * @brief Constructor - initializes an empty command history
     */
    constructor(commandLine) {
        this.history = [];
        this.commandBuffer = ``;
        this.iter = 0;
        this.commandLine = commandLine; // current active commandline
    }

    /**
     * @brief Navigates the command history based on the direction specified
     * @param {string} direction Direction to navigate ('previous' or 'next')
     */
    navigateCommandHistory(direction) {
        if (!this.commandLine) {
            console.error(`Command History Naviagation Failed: CommandLine instance is null`);
        }

        let retrievedCommand = "";
        if (direction === "previous") {
            if (this.iter === this.history.length) {
                this.commandBuffer = this.commandLine.getFullText();
            }
            retrievedCommand = this.getPrevious();
        } else if (direction === "next") {
            retrievedCommand = this.getNext();
        }

        // If nothing was retrieved from the command buffer, ignore naviation
        if (retrievedCommand === undefined) return;

        // Update the command line with the retrieved command
        this.commandLine.setLeftText(retrievedCommand);
        this.commandLine.setRightText("");
        this.commandLine.caret.pos = retrievedCommand.length;
        this.commandLine.updateDomText();
    }

    /**
     * @brief Adds a command to the history
     * @param {string} commandText Command to add
     */
    addToHistory(commandText) {
        this.history.push(commandText);
        this.iter++;
    }

    /**
     * @brief Gets the previous command from history
     * @return {string} Previous command or empty string if at start
     */
    getPrevious() {
        // If history is empty, return undefined signaling do nothing.
        if (this.history.length === 0) return undefined;

        // If still in bounds, decrement iterator and return result
        if (this.iter > 0) this.iter--;

        return this.history[this.iter];
    }

    /**
     * @brief Gets the next command from history
     * @return {string} Next command or command buffer if at end
     */
    getNext() {
        // If history is empty, return undefined signaling do nothing.
        if (this.history.length === 0) return undefined;

        // If still in bounds, increment iterator and return result
        if (this.iter < this.history.length) this.iter++;

        // If history points to current command, return it, otherwise return history
        if (this.iter < this.history.length) return this.history[this.iter];
        else return this.commandBuffer;
    }

    /**
     * @brief Sets the new active command line, to know which line's text to manipulate/capture
     * @param {CommandLine} commandLine
     */
    setActiveLine(commandLine) {
        this.commandLine = commandLine;
    }
}
