
/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: script.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
*
    We start by assuming there is a terminal list in the HTML file. We retrieve this dom element,
    as we will add individual list elements and the command line.
*
==================================================================================================*/

import { CommandRegistry, Command, ClearCommand, EchoCommand } from './commands.js';
import { DOMHelper, protectedKeyCombination } from './dom-helper.js';

/*==================================================================================================
    Configuration
==================================================================================================*/
export const ELEMENT_CLASSES = {
    wrapper: `terminal`,

    header_container: `terminal__header`,
    window_title: `terminal__title`,
    window_buttons_wrapper: `terminal__controls`,
    window_button: `terminal__button`,
    minimize_button: `terminal__button--minimize`,
    maximize_button: `terminal__button--maximize`,
    exit_button: `terminal__button--exit`,

    main_content: `terminal__window`,
    command_list: `terminal__list`,
    command_list_item: `terminal__line`,
};

const CONFIG = {
    CARET_SYMBOL: '█',
    CARET_BLINK_INTERVAL: 850,
    USER: `user@system:`,
    DEFAULT_DIRECTORY: `~`,
    SIGN: `$`,
    VERSION_INFO:   'Null-Terminal v0.1.0-alpha \\0\n' +
                    '© 2025 Fake Inc\n' +
                    'Build: 0x00FF-TERM-NULL\n' +
                    '"Where strings end, possibilities begin."\n' +
                    '------------------------------------------\n' +
                    'The terminal where commands terminate, but ideas don\'t.\n' +
                    'Running on NullOS kernel 3.14\n' +
                    'Type \'help\' to begin or \'about\' for more information.\n' +
                    '------------------------------------------\n\n'
};

const SUPPORTED_COMMANDS = {
    clear: ClearCommand,
    echo: EchoCommand,
}

/*==================================================================================================
    Class Definitions
==================================================================================================*/
class Caret {
    constructor() {
        this.sym = CONFIG.CARET_SYMBOL;
        this.pos = 0;
        this.visible = true;
    }
}

/*================================================================================================*/
class CommandLine {
    constructor(terminalElement, currentDirectory) {
        this.terminalElement = terminalElement;
        this.promptUser = CONFIG.USER;
        this.promptDirectory = currentDirectory;
        this.promptSign = CONFIG.SIGN;

        // Initialize command line text and append caret
        this.commandText = '';
        this.caret = new Caret();
        this.appendCaretToEnd();
        
        // Create DOM element
        this.element = this.createCommandLineElement();

        // Store reference to content span
        this.contentSpan = this.element.querySelector('.line__content');
        if (!this.contentSpan) console.error("CommandLine Error: Failed to find contentSpan during construction");
    }

    /*  DOM Manipulation
    ***********************************************************************************************/
    /**
     * @brief Creates a new command line DOM element
     * @returns DOM element for the command line
     */
    createCommandLineElement() {
        const { li, contentSpan } = DOMHelper.createBaseLineElement(
            `prompt`,
            {
                user: this.promptUser,
                directory: this.promptDirectory,
                sign: this.promptSign,
            },
            ''
        );

        // Set specific attributes
        li.tabIndex = 0;
        this.contentSpan = contentSpan;
        this.contentSpan.textContent = this.getCommandTextWithCaret();
        
        // Add event listener to capture keystrokes
        li.addEventListener('keydown', (event) => {
            if (this.onKeyDown) {
                this.onKeyDown(event);
            }
        });
        
        return li;
    }

    /**
     * @brief Removes the command line element from the DOM
     */
    removeFromDOM() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    /*  Text Return
    ***********************************************************************************************/
    /**
     * @brief Gets the command text with the caret inserted at the current position
     * @returns Command text with caret
     */
    getCommandTextWithCaret() {
        return this.commandText.substring(0, this.caret.pos) + 
               this.caret.sym + 
               this.commandText.substring(this.caret.pos);
    }

    /**
     * @brief Returns a copy of the command text without the caret attached.
     * @returns Pure command text without caret
     */
    getCommandTextWithoutCaret() {
        return this.commandText.substring(0, this.caret.pos) + 
               this.commandText.substring(this.caret.pos);
    }
    
    /*  Text Modification
    ***********************************************************************************************/
    /**
     * @brief Inserts a character into the current command line before the caret.
     * @param {char} key Character to insert
     */
    insertCharacter(key) {
        // Split the command text at the caret
        const left_text = this.commandText.substring(0, this.caret.pos);
        const right_text = this.commandText.substring(this.caret.pos);
        
        // Create new text with the character inserted
        this.updateCommandText(left_text + key + right_text);
        this.caret.pos++;
        this.showCaret();
    }

    /**
     * @brief Removes the character from the current command line before the caret.
     */
    removePreviousCharacter() {
        if (this.caret.pos === 0) return; // skip if nothing to remove
        
        // Split the command text at the caret
        const left_text = this.commandText.substring(0, this.caret.pos);
        const right_text = this.commandText.substring(this.caret.pos);
        
        // Create new command text with the character removed
        this.updateCommandText(left_text.substring(0, left_text.length-1) + right_text);
        this.caret.pos--;
        this.showCaret();
    }

    /**
     * @brief Removes the character from the current command line after the caret.
     */
    removeNextCharacter() {
        if (this.caret.pos === this.commandText.length) return;

        // Split the command text at the caret
        const left_text = this.commandText.substring(0, this.caret.pos);
        const right_text = this.commandText.substring(this.caret.pos);

        // Create new command text with the character removed
        this.updateCommandText(left_text + right_text.substring(1));
        this.showCaret();
    }

    /**
     * @brief Updates the stored command text and the DOM.
     */
    updateCommandText(commandText) {
        this.commandText = commandText; // Updates this objects copy of the text
        if (this.contentSpan) {
            this.contentSpan.textContent = this.getCommandTextWithCaret(); // Updates the DOM with caret
        }
    }

    /*  Caret Specific
    ***********************************************************************************************/
    /**
     * @brief Updates the position of the caret within the command text, moving it left or right.
     * @param {string} direction Direction of caret movement ("left" or "right")
     * @returns Early return if caret is at left or right border
     */
    moveCaret(direction) {
        if (direction === 'left') {
            if (this.caret.pos <= 0) return;
            this.caret.pos--;
        } else if (direction === 'right') {
            if (this.caret.pos >= this.commandText.length) return;
            this.caret.pos++;
        }

        this.showCaret();
    }

    /**
     * @brief Toggles caret visibility. Used with setInterval() to periodically blink the caret.
     */
    toggleCaret() {
        this.caret.visible ? this.hideCaret() : this.showCaret();
    }

    /**
     * @brief Used to hide the caret in the displayed command text.
     */
    hideCaret() {
        if (!this.contentSpan) return;
        const left_text = this.commandText.substring(0, this.caret.pos);
        const right_text = this.commandText.substring(this.caret.pos);
        this.contentSpan.textContent = left_text + ' ' + right_text;
        this.caret.visible = false;
    }

    /**
     * @brief Used to show the caret in the displayed command text.
     */
    showCaret() {
        if (!this.contentSpan) return;
        this.contentSpan.textContent = this.getCommandTextWithCaret();
        this.caret.visible = true;
    }

    /**
     * @brief Positions the caret at the end of the command text.
     */
    appendCaretToEnd() {
        this.caret.pos = this.commandText.length;
        this.showCaret();
    }
}

/*================================================================================================*/
class CommandHistory {
    constructor() {
        this.commands = [];
        this.commandBuffer = ``;
        this.iter = 0;
    }

    navigateCommandHistory(direction, commandLine) {
        if (!commandLine) console.error(`Command history naviagation failed: commandLine instance is null`);
        let retrievedCommand = '';

        if (direction === 'previous') {
            if (this.iter === this.size()) {
                this.commandBuffer = commandLine.getCommandTextWithoutCaret();
            }
            retrievedCommand = this.getPrevious();
        } else if (direction === 'next') {
            retrievedCommand = this.getNext();
        }

        // Update the command line with the retrieved command
        commandLine.updateCommandText(retrievedCommand);
        commandLine.appendCaretToEnd();
    }

    /**
     * @brief Adds a command to the history
     * @param {string} commandText Command to add
     */
    addToHistory(commandText) {
        this.commands.push(commandText);
        this.iter++;
    }

    /**
     * @brief Gets the previous command from history
     * @returns Previous command or empty string if at start
     */
    getPrevious() {
        if (this.iter > 0) this.iter--;
        return this.commands[this.iter];
    }

    /**
     * @brief Gets the next command from history
     * @returns Next command or command buffer if at end
     */
    getNext() {
        if (this.iter < this.commands.length) this.iter++;
        if (this.iter < this.commands.length) 
            return this.commands[this.iter];
        else 
            return this.commandBuffer;
    }

    /**
     * @brief Gets the number of commands in history
     * @returns Size of command history
     */
    size() {
        return this.commands.length;
    }
}

/*================================================================================================*/
export class Terminal { 
    constructor() {
        // Find terminal wrapper
        this.terminalElement = document.querySelector(`.` + ELEMENT_CLASSES.wrapper);
        if (!this.terminalElement) {
            console.error(`Terminal wrapper not found in the DOM`);
            return;
        }

        // Find terminal display list
        this.terminalDisplay = document.querySelector(`.` + ELEMENT_CLASSES.command_list);
        if (!this.terminalDisplay) {
            console.error('Terminal display list not found in the DOM');
            return;
        }

        // Initialize working directory
        this.currentDirectory = CONFIG.DEFAULT_DIRECTORY;

        // Initialize components
        this.commandHistory = new CommandHistory();
        this.caretBlinkInterval = CONFIG.CARET_BLINK_INTERVAL;
        this.commandLine = new CommandLine(this.terminalElement, this.currentDirectory);
        this.commandRegistry = new CommandRegistry(this, SUPPORTED_COMMANDS);

        // Setup commandline key handling
        this.handleKeydown = this.handleKeydown.bind(this);
        this.commandLine.onKeyDown = this.handleKeydown;

        // Add version info and commandline to DOM
        this.printVersionInfo();
        this.terminalDisplay.appendChild(this.commandLine.element);
    }

    /*  Initialization
    ***********************************************************************************************/
    init() {

        // Setup header buttons
        this.setupHeaderButtons();
        
        // Setup caret blinking
        this.startCaretBlink();
        
        // Return success
        return true;
    }

    /*  Event Handling
    ***********************************************************************************************/
    /**
     * @brief Initializes keystroke events
     * @param {*} event 
     */
    handleKeydown(event) {
        this.startCaretBlink();
        switch (event.key) {

            // Carret Shifting
            case 'ArrowRight':
                this.commandLine.moveCaret('right');
                break;
            case 'ArrowLeft':
                this.commandLine.moveCaret('left');
                break;
            
            // Command History
            case 'ArrowUp':
                this.commandHistory.navigateCommandHistory('previous', this.commandLine);
                break;
            case 'ArrowDown':
                this.commandHistory.navigateCommandHistory('next', this.commandLine);
                break;

            // Command Requesting
            case 'Enter':
                this.executeCommand();
                break;
            case 'Delete':
                this.commandLine.removeNextCharacter();
                break;
            case 'Backspace':
                this.commandLine.removePreviousCharacter();
                break;

            // Explicitly ignore special keys
            case 'Shift':
            case 'Control':
            case 'Alt':
            case 'CapsLock':
            case 'Tab':
            case 'Escape':
                break;

            // Default: append key to content if valid character
            default:
                if (event.key.length === 1)
                    this.commandLine.insertCharacter(event.key);
                break;
        }

        // Prevent default behavior if not protected combination
        if (!protectedKeyCombination(event))
            event.preventDefault();
    }
    
    /**
     * @brief Setup header button event listeners
     */
    setupHeaderButtons() {
        const buttons = [
            { id: ELEMENT_CLASSES.minimize_button,  handler: () => alert('Minimized terminal') },
            { id: ELEMENT_CLASSES.maximize_button,  handler: () => alert('Maximized terminal') },
            { id: ELEMENT_CLASSES.exit_button,      handler: () => alert('Exited terminal') }
        ];
        
        buttons.forEach(button => {
            const element = document.querySelector(`.` + button.id);
            if (element) {
                element.addEventListener('click', button.handler);
            }
        });
    }

    /**
     * @brief Resets and or starts the caret blinking process
     */
    startCaretBlink() {
        this.stopCaretBlink();

        this.caretBlinkIntervalID = setInterval(() => {
            if (this.commandLine) {
                this.commandLine.toggleCaret();
            }
        }, this.caretBlinkInterval);
    }

    /**
     * @brief Clears the caret blinking interval
     */
    stopCaretBlink() {
        if (this.caretBlinkIntervalID) {
            clearInterval(this.caretBlinkIntervalID);
            this.caretBlinkIntervalID = null;
        }
    }

    /*  Command Management
    ***********************************************************************************************/
    /**
     * @brief Executes the current command
     */
    executeCommand() {
        // Get command text without caret
        const commandText = this.commandLine.getCommandTextWithoutCaret();

        // Skip if nothing was typed
        if (commandText.length === 0) {
            this.createNewCommandLine();
            return;
        }

        // Tokenize the command
        const tokens = commandText.split(' ');
        const command = tokens[0].toLowerCase();
        const args = (tokens.length > 1) ? tokens[1].slice(1) : null;
        
        // Remove current command line from display
        this.commandLine.removeFromDOM();
        
        // Add command to display as completed line
        this.addLineToTerminal(
            `prompt`, 
            { 
                user: this.commandLine.promptUser,
                directory: this.commandLine.promptDirectory,
                sign: this.commandLine.promptSign 
            },
            commandText
        )

        // Add command to history
        this.commandHistory.addToHistory(commandText);

        // Execture the command
        const result = this.commandRegistry.execute(command, args);
        
        // Create new command line
        this.createNewCommandLine();
    }

    /*  Display Manipulation
    ***********************************************************************************************/
    /**
     * @brief Creates a new command line
     */
    createNewCommandLine() {
        // Create new command line
        this.commandLine = new CommandLine(this.terminalElement, this.currentDirectory);
        
        // Add command line to terminal display
        this.terminalDisplay.appendChild(this.commandLine.element);

        // Focus the element
        this.commandLine.element.focus();
        
        // Set up keydown handler
        this.commandLine.onKeyDown = this.handleKeydown;
    }

    /**
     * 
     */
    addLineToTerminal(type, promptInfo, content) {
        const { li } = DOMHelper.createBaseLineElement(type, promptInfo, content);
        this.terminalDisplay.appendChild(li);
    }

    /**
     * 
     */
    printVersionInfo() {
        this.addLineToTerminal('output', null, CONFIG.VERSION_INFO);
    }
}
