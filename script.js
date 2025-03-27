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

/*==================================================================================================
    Configuration
==================================================================================================*/
const ELEMENT_CLASSES = {
    wrapper: `terminal`,

    header_container: `terminal__header`,
    window_title: `terminal__title`,
    window_buttons_wrapper: `terminal__controls`,
    window_button: `terminal__button`,
    minimize_button: `terminal__button--minimize`,
    maximize_button: `terminal__button--maximize`,
    exit_button: `terminal__button--exit`,

    main_content: `terminal__window`,
    command_list: `terminal__list`
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

/*==================================================================================================
    Caret Class
==================================================================================================*/
class Caret {
    constructor() {
        this.sym = CONFIG.CARET_SYMBOL;
        this.pos = 0;
        this.visible = true;
    }
}

/*==================================================================================================
    Command Line Class
==================================================================================================*/
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
        return this.commandText;
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
        if (this.contentSpan) {
            this.contentSpan.textContent = this.commandText;
        }
        this.caret.visible = false;
    }

    /**
     * @brief Used to show the caret in the displayed command text.
     */
    showCaret() {
        if (this.contentSpan) {
            this.contentSpan.textContent = this.getCommandTextWithCaret();
        }
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

/*==================================================================================================
    Command History Class
==================================================================================================*/
class CommandHistory {
    constructor() {
        this.commands = [];
        this.commandBuffer = ``;
        this.iter = 0;
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

/*==================================================================================================
    Terminal Class
==================================================================================================*/
class Terminal { 
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
        
        // Printout version information
        this.printVersionInfo();

        // Initialize components
        this.commandHistory = new CommandHistory();
        this.caretBlinkInterval = CONFIG.CARET_BLINK_INTERVAL;
        this.commandLine = new CommandLine(this.terminalElement, this.currentDirectory);

        // Setup command line key handling
        this.handleKeydown = this.handleKeydown.bind(this);
        this.commandLine.onKeyDown = this.handleKeydown;

        // Add command line to list
        this.terminalDisplay.appendChild(this.commandLine.element);
    }

    init() {

        // Setup header buttons
        this.setupHeaderButtons();
        
        // Setup caret blinking
        this.caretBlinkInterval = setInterval(() => {
            if (this.commandLine) {
                this.commandLine.toggleCaret();
            }
        }, this.caretBlinkInterval);
        
        // Return success
        return true;
    }

    /*  Event Handling
    ***********************************************************************************************/
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
     * @brief Initializes keystroke events
     * @param {*} event 
     */
    handleKeydown(event) {
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
                this.navigateCommandHistory('previous');
                break;
            case 'ArrowDown':
                this.navigateCommandHistory('next');
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

        // Prevent standard browser behavior for keypress
        //event.preventDefault();
    }

    /*  Command Management
    ***********************************************************************************************/
    /**
     * @brief Executes the current command
     */
    executeCommand() {
        // Get command text without caret
        const commandText = this.commandLine.getCommandTextWithoutCaret();

        // Split and handle command
        const tokens = commandText.split(' ');
        const command = tokens[0];
        switch(command) {

            case 'clear':
                this.clearTerminal();
                return;

            default:
                console.error(`Unrecognized command: ${command}`);
                break;;
        }
        
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
            this.commandLine.commandText
        )
        
        // Add command to history if not empty
        if (commandText.trim().length > 0) {
            this.commandHistory.addToHistory(commandText);
            
            // Process command (placeholder - would be replaced with actual command handling)
            // For demo, just echo the command as output
            if (false)
                this.addLineToTerminal(`output`, null,`THIS IS TEST OUTPUT...`);
        }
        
        // Create new command line
        this.createNewCommandLine();
    }

    /**
     * @brief Navigates through command history
     * @param {string} direction Direction to navigate ('previous' or 'next')
     */
    navigateCommandHistory(direction) {
        let retrievedCommand = '';

        if (direction === 'previous') {
            if (this.commandHistory.iter === this.commandHistory.size()) {
                this.commandHistory.commandBuffer = this.commandLine.getCommandTextWithoutCaret();
            }
            retrievedCommand = this.commandHistory.getPrevious();
        } else if (direction === 'next') {
            retrievedCommand = this.commandHistory.getNext();
        }

        // Update the command line with the retrieved command
        this.commandLine.updateCommandText(retrievedCommand);
        this.commandLine.appendCaretToEnd();
    }

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

    /*  Display Manipulation
    ***********************************************************************************************/
    /**
     * 
     */
    addLineToTerminal(type, promptInfo, content) {
        const { li } = DOMHelper.createBaseLineElement(type, promptInfo, content);
        this.terminalDisplay.appendChild(li);
    }
    
    /**
     * @brief Clears the terminal and inserts a blank prompt line
     */
    clearTerminal() {
        // Clear terminal display
        this.terminalDisplay.innerHTML = '';
        
        // Create new command line
        this.createNewCommandLine();
    }

    /**
     * 
     */
    printVersionInfo() {
        this.addLineToTerminal('output', null, CONFIG.VERSION_INFO);
    }
}
/*==================================================================================================
    DOM Helper Class
==================================================================================================*/
class DOMHelper {
    static createBaseLineElement(type, promptInfo, content) {
        const {user, directory, sign} = promptInfo || {};
        const li = document.createElement('li');
        li.className = `terminal__line terminal__line--${type}`;

        // This is the user section of the commandline ex. `user@system:`
        const userSpan = document.createElement('span');
        userSpan.className = 'line__user';
        userSpan.textContent = user || '';

        // This is the directory of the commandline ex. `~` or `~/Documents/folder/`
        const dirSpan = document.createElement('span');
        dirSpan.className = 'line__dir';
        dirSpan.textContent = directory || '';

        // This is simply the symbol that appears at the end of the prompt ex. `$`
        const signSpan = document.createElement('span');
        signSpan.className = 'line__sign';
        signSpan.textContent = sign || '';

        // This is where all typed content will be entered ex. `cd path/to/dir/`
        const contentSpan = document.createElement('span');
        contentSpan.className = 'line__content';
        contentSpan.textContent = content || '';

        if (user) li.appendChild(userSpan);
        if (directory) li.appendChild(dirSpan)
        if (sign) li.appendChild(signSpan);
        li.appendChild(contentSpan);

        return { li, contentSpan, userSpan, dirSpan, signSpan };
    }
}

/*==================================================================================================
    Invokation
==================================================================================================*/
// Initialize terminal when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    const terminal = new Terminal();
    terminal.init();
});
