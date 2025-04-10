/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: command-line.js
* @date: 04/03/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of command line, which acts as the active line in the emulator.
*         Also contains implementation of caret class.
==================================================================================================*/

import { CONFIG } from './config.js'

/*  Caret Class Definition
***************************************************************************************************/
/**
 * @class Caret
 * @brief Represents the text cursor for the terminal interface
 */
class Caret {
    /**
     * @brief Constructor - initializes a caret with default properties
     */
    constructor() {
        this.sym = CONFIG.CARET_SYMBOL;
        this.pos = 0;
        this.visible = true;
    }
}

/*  CommandLine Class Definition
***************************************************************************************************/
/**
 * @class CommandLine
 * @brief Handles command input including text manipulation and caret position
 */
export class CommandLine {
    /**
     * @brief Constructor - creates a new command line instance
     * @param {Terminal} terminalInstance The terminal instance this command line belongs to
     * @param {Function} terminalKeydownHandler Function to handle keydown events
     */
    constructor(terminalInstance, terminalKeydownHandler) {
        // Get terminal reference
        this.terminal = terminalInstance;

        // Set up command line properties
        this.caret = new Caret();
        this.leftText = ''; // text left of caret
        this.rightText = ''; // text right of caret
        this.prompt = { 
            user: CONFIG.USER, 
            dir: terminalInstance.currentDirectory, 
            sign: CONFIG.SIGN 
        }
        
        // Create DOM element
        const elements = this.createCommandLineElement(); // create command line and get spans
        this.element = elements.li;
        this.leftTextSpan = elements.leftTextSpan;
        this.rightTextSpan = elements.rightTextSpan;
        this.caretSpan = elements.caretSpan;

        // Set up key capturing for the command line element just created
        this.handleKeydown = terminalKeydownHandler;
        this.enableKeyCapture();
    }

    /*  DOM Manipulation
    ***********************************************************************************************/
    /**
     * @brief Creates a new command line DOM element
     * @return {Object} Object containing the created DOM elements
     */
    createCommandLineElement() {
        // Create html list element
        const li = document.createElement('li');
        li.className = `terminal__line terminal__line--prompt`;

        // Create the prompt section
        const promptSpan = document.createElement('span');
        promptSpan.className = 'line__prompt';
        li.appendChild(promptSpan);

        const userSpan = document.createElement('span'); // ex. user@system
        userSpan.className = 'prompt__user';
        userSpan.textContent = this.prompt.user;
        promptSpan.appendChild(userSpan);

        const dirSpan = document.createElement('span'); // ex. dir/directory/
        dirSpan.className = 'prompt__dir';
        dirSpan.textContent = this.prompt.dir;
        promptSpan.appendChild(dirSpan);

        const signSpan = document.createElement('span'); // ex. $
        signSpan.className = 'prompt__sign';
        signSpan.textContent = this.prompt.sign;
        promptSpan.appendChild(signSpan);

        // Create the content section
        const contentSpan = document.createElement('span');
        contentSpan.className = 'line__content';
        li.appendChild(contentSpan);

        const leftTextSpan = document.createElement('span'); // (text before caret)
        leftTextSpan.className = 'content__left';
        contentSpan.appendChild(leftTextSpan);

        const caretSpan = document.createElement('span');
        caretSpan.className = 'content__caret';
        caretSpan.textContent = this.caret.sym;
        contentSpan.appendChild(caretSpan);

        const rightTextSpan = document.createElement('span'); // (text after caret)
        rightTextSpan.className = 'content__right';
        contentSpan.appendChild(rightTextSpan);

        // Set specific attributes
        li.tabIndex = 0;
        
        return { li, leftTextSpan, rightTextSpan, caretSpan};
    }

    /**
     * @brief Removes the command line element from the DOM
     */
    removeFromDOM() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    /*  Text Modification
    ***********************************************************************************************/
    /**
     * @brief Inserts a character into the current command line before the caret
     * @param {string} key Character to insert
     */
    insertCharacter(key) {
        this.leftText += key;
        this.caret.pos++;

        this.updateDomText();
    }

    /**
     * @brief Removes the character from the current command line before the caret
     */
    removePreviousCharacter() {
        if (this.caret.pos === 0) return; // skip if nothing to remove
        this.leftText = this.leftText.substring(0, this.leftText.length-1);
        this.caret.pos--;

        this.updateDomText();
    }

    /**
     * @brief Removes the character from the current command line after the caret
     */
    removeNextCharacter() {
        if (this.caret.pos === 0) return; // skip if nothing to remove
        this.rightText = this.rightText.substring(1);

        this.updateDomText();
    }

    /*  Caret Movement
    ***********************************************************************************************/
    /**
     * @brief Updates the position of the caret within the command text, moving it left or right
     * @param {string} direction Direction of caret movement ("left" or "right")
     * @return {boolean} Early return if caret is at left or right border
     */
    moveCaret(direction) {
        if (direction === 'left') {
            if (this.caret.pos <= 0) return;
            const movedText = this.leftText[this.leftText.length-1];
            this.leftText = this.leftText.substring(0, this.leftText.length-1);
            this.rightText = movedText + this.rightText;
            this.caret.pos--;
        } else if (direction === 'right') {
            if (this.caret.pos >= this.leftText.length + this.rightText.length) return;
            const movedText = this.rightText[0];
            this.rightText = this.rightText.substring(1);
            this.leftText += movedText;
            this.caret.pos++;
        }

        this.updateDomText();
    }

    /*  Caret Visibility
    ***********************************************************************************************/
    /**
     * @brief Toggles caret visibility. Used with setInterval() to periodically blink the caret
     */
    toggleCaret() {
        this.caret.visible ? this.hideCaret() : this.showCaret();
    }

    /**
     * @brief Hides the caret in the displayed command text
     */
    hideCaret() {
        this.caretSpan.classList.add('content__caret--hidden');
        this.caret.visible = false;
    }

    /**
     * @brief Shows the caret in the displayed command text
     */
    showCaret() {
        this.caretSpan.classList.remove('content__caret--hidden');
        this.caret.visible = true;
    }

    /*  Text Return
    ***********************************************************************************************/
    /**
     * @brief Gets the full text content of the command line
     * @return {string} Combined text from both sides of the caret
     */
    getFullText() {
        return this.leftText + this.rightText;
    }

    /*  Text Updating
    ***********************************************************************************************/
    /**
     * @brief Sets the text to the left of the caret in the command line
     * @param {string} left Text for the left side to be set to
     */
    setLeftText(left) {
        this.leftText = left || '';
    }

    /**
     * @brief Sets the text to the right of the caret in the command line
     * @param {string} right Text for the right side to be set to
     */
    setRightText(right) {
        this.rightText = right || '';
    }

    /**
     * @brief Updates the DOM text content of the command line element
     */
    updateDomText() {
        this.leftTextSpan.textContent = this.leftText;
        this.rightTextSpan.textContent = this.rightText;
    }

    /*  Event Listening
    ***********************************************************************************************/
    /**
     * @brief Defines and adds a key capture event listener to the command line element
     */
    enableKeyCapture() {
        this.keyDownHandlerID = (event) => {
            if (this.handleKeydown) {
                this.handleKeydown(event);
            }
        };
        this.element.addEventListener('keydown', this.keyDownHandlerID);
    }

    /**
     * @brief Removes the key capture event listener from the command line element
     */
    disableKeyCapture() {
        this.element.removeEventListener('keydown', this.keyDownHandlerID);
    }
}