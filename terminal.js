/*==================================================================================================
* @project Web-Based Terminal
====================================================================================================
* @file: script.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
==================================================================================================*/

import { 
    ArgParser,
    CommandRegistry, 
    CdCommand,
    ClearCommand, 
    EchoCommand, 
    LsCommand,
    MkdirCommand,
    PwdCommand,
    RmCommand,
    TodoCommand,
    TreeCommand,
} from './commands.js';

import {
    Filesystem,
    FSNode,
} from './file-system.js';

import { 
    DOMHelper, 
    protectedKeyCombination 
} from './dom-helper.js';

/*==================================================================================================
    Configuration
==================================================================================================*/
/**
 * @brief Map of command names to their corresponding command classes
 */
const SUPPORTED_COMMANDS = {
    cd: CdCommand,
    clear: ClearCommand,
    echo: EchoCommand,
    ls: LsCommand,
    mkdir: MkdirCommand,
    pwd: PwdCommand,
    rm: RmCommand,
    todo: TodoCommand,
    tree: TreeCommand,
}

/**
 * @brief CSS class names used throughout the terminal application
 */
export const ELEMENT_CLASSES = {
    wrapper: `terminal`,

    header: `terminal__header`,
    window_title: `terminal__title`,
    window_buttons_container: `terminal__controls`,
    window_button: `terminal__button`,
    minimize_button: `terminal__button--minimize`,
    maximize_button: `terminal__button--maximize`,
    exit_button: `terminal__button--exit`,

    terminal_window: `terminal__window`,
    command_list: `terminal__list`,
    command_list_item: `terminal__line`,
};

/**
 * @brief Global configuration settings for the terminal
 */
export const CONFIG = {
    CARET_SYMBOL: '█',
    CARET_BLINK_INTERVAL: 850,
    USER: `user@system:`,
    DEFAULT_DIRECTORY: `~`,
    SIGN: `$`,
    VERSION_INFO:   'Null-Terminal v0.1.0-alpha \\0\n' +
                    '© 2025 Nullptr Solutions\n' +
                    'Build: 0x00FF-TERM-NULL\n' +
                    '"Where strings end, possibilities begin."\n' +
                    '---------------------------------------------------------\n' +
                    'The terminal where strings terminate, but ideas don\'t.\n' +
                    'Running on NullOS kernel 3.14\n' +
                    'Powered by voidsh interpreter v0.0.0\n' +
                    'Type \'help\' to begin or \'about\' for more information.\n' +
                    '---------------------------------------------------------\n',

    TWODOO:         '---------------------------------------------------------\n' +
                    'TODO ITEMS:\n' +
                    '---------------------------------------------------------\n' +
                    '1.  Fix command history feature\n' +
                    '2.  Add tab auto-completion for navigation cmds.\n' +
                    '3.  Style lines to break by words instead of whole lines.\n' +
                    '4.  Add specific folder/file highlighting for cmds like ls.\n' +
                    '5.  Implement switches for designated cmds.\n' +
                    '6.  Implement the following cmds:\n' +
                    '    - cat      (concatenate and display file contents)\n' +
                    '    ✓ cd       (change directory)\n' +
                    '    ✓ clear    (clear terminal screen)\n' +
                    '    - cp       (copy file/directory)\n' +
                    '    ✓ echo     (display a line of text)\n' +
                    '    - find     (search for files in a directory hierarchy)\n' +
                    '    - grep     (search text using patterns)\n' +
                    '    - ls       (list directory contents)\n' +
                    '    ✓ mkdir    (make directory)\n' +
                    '    - mv       (move file/directory)\n' +
                    '    - pwd      (print working directory)\n' +
                    '    - rm       (remove file/directory)\n' +
                    '    - touch    (create empty file)\n' +
                    '---------------------------------------------------------\n',
};

/*==================================================================================================
    Class Definitions
==================================================================================================*/
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

/*================================================================================================*/
/**
 * @class CommandLine
 * @brief Handles command input including text manipulation and caret position
 */
class CommandLine {
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

        const dirSpan = document.createElement('span'); // ex. dir/folder/
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

/*================================================================================================*/
/**
 * @class CommandHistory
 * @brief Manages the command history for up/down arrow navigation
 * @todo Fix command history navigation
 */
class CommandHistory {
    /**
     * @brief Constructor - initializes an empty command history
     */
    constructor() {
        this.commands = [];
        this.commandBuffer = ``;
        this.iter = 0;
    }

    /**
     * @brief Navigates the command history based on the direction specified
     * @param {string} direction Direction to navigate ('previous' or 'next')
     * @param {CommandLine} commandLine Command line element to update
     */
    navigateCommandHistory(direction, commandLine) {
        if (!commandLine) console.error(`Command history naviagation failed: commandLine instance is null`);
        let retrievedCommand = '';

        if (direction === 'previous') {
            if (this.iter === this.size()) {
                this.commandBuffer = commandLine.getFullText();
            }
            retrievedCommand = this.getPrevious();
        } else if (direction === 'next') {
            retrievedCommand = this.getNext();
        }

        // Update the command line with the retrieved command
        commandLine.setLeftText(retrievedCommand);
        commandLine.setRightText('');
        commandLine.caret.pos = retrievedCommand.length;
        commandLine.updateDomText(); 
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
     * @return {string} Previous command or empty string if at start
     */
    getPrevious() {
        if (this.iter > 0) this.iter--;
        return this.commands[this.iter];
    }

    /**
     * @brief Gets the next command from history
     * @return {string} Next command or command buffer if at end
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
     * @return {number} Size of command history
     */
    size() {
        return this.commands.length;
    }
}

/*================================================================================================*/
/**
 * @class Terminal
 * @brief Main terminal class that manages the overall terminal functionality
 */
export class Terminal { 
    /**
     * @brief Constructor - initializes the terminal and its components
     */
    constructor() {
        // Find terminal wrapper element
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

        // const args = ["cp", "-l", "--carvan", "a", "-b", "afile1", "file2", "file3", "dir/to/copyto"];
        // const { switches, remaining } = ArgParser.argumentSplitter(args);
        // console.log("Switches:");
        // switches.forEach((swch) => console.log(swch));
        // console.log("Remaining:");
        // remaining.forEach((param) => console.log(param));

        // Initialize configuration variables
        this.currentDirectory = CONFIG.DEFAULT_DIRECTORY;
        this.caretBlinkInterval = CONFIG.CARET_BLINK_INTERVAL;

        // Add version info and commandline to DOM
        this.printVersionInfo();

        // Bind key handling function so the command line can access it on keydown
        this.handleKeydown = this.handleKeydown.bind(this);

        // Initialize components
        this.filesystem = new Filesystem(this.currentDirectory);
        this.commandHistory = new CommandHistory();
        this.createNewCommandLine();
        this.commandRegistry = new CommandRegistry(this, this.filesystem, SUPPORTED_COMMANDS);
    }

    /*  Initialization
    ***********************************************************************************************/
    /**
     * @brief Initializes the terminal
     * @return {boolean} True on success
     */
    init() {

        // Set up event handling/intervals
        this.setupHeaderButtons();
        this.startCaretBlink();
        
        // Return success
        return true;
    }

    /*  Event Handling
    ***********************************************************************************************/
    /**
     * @brief Handles keydown events for the terminal
     * @param {KeyboardEvent} event The keydown event
     */
    handleKeydown(event) {
        this.startCaretBlink();
        switch (event.key) {

            // Carret Lateral Movement
            case 'ArrowRight':
                this.commandLine.moveCaret('right');
                break;
            case 'ArrowLeft':
                this.commandLine.moveCaret('left');
                break;
            
            // Command History Navigation
            case 'ArrowUp':
                this.commandHistory.navigateCommandHistory('previous', this.commandLine);
                break;
            case 'ArrowDown':
                this.commandHistory.navigateCommandHistory('next', this.commandLine);
                break;

            // Command Execution
            case 'Enter':
                this.executeCommand();
                break;
            case 'Delete':
                this.commandLine.removeNextCharacter();
                break;
            case 'Backspace':
                this.commandLine.removePreviousCharacter();
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
     * @brief Sets up header button event listeners
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
     * @brief Resets and starts the caret blinking process
     */
    startCaretBlink() {
        this.stopCaretBlink();
        this.commandLine.showCaret();

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
     * @brief Executes the current command entered in the command line
     */
    executeCommand() {
        // Get command text without caret
        const commandText = this.commandLine.getFullText();

        // Remove event handling and caret from the current command line
        this.commandLine.disableKeyCapture();
        this.stopCaretBlink();
        this.commandLine.hideCaret();

        // Skip if nothing was typed
        if (commandText.length > 0) {

            // Parse the arguments for the command
            let args = ArgParser.parse(commandText);
            const command = args[0];

            // Prepare the remaining arguments
            args = args.slice(1);

            // Execute the command if command is registered (path everything after command as args)
            const { type, content } = this.commandRegistry.executeCommand(command, args);

            // Handle output based on type
            switch(type) {
                
                case 'error':
                    this.addOutputLineToTerminal('error', content);
                    break;
                
                case 'output':
                    if (content) // Only print a line if there is content, or specified to print blank
                        this.addOutputLineToTerminal('output', content);
                    break;
                
                case 'clear':
                    this.clearDisplay();
                    break;

                case 'navigation':
                    this.currentDirectory = this.filesystem.cwd.getFilePath();
                    this.currentDirectory = this.filesystem.abbreviateHomeDir(this.currentDirectory);
                    break;

                case 'ignore':
                    break;

                default:
                    console.error(`Unknown command return type of ${type}`);
            }
        }

        // Add back command line
        this.createNewCommandLine(); 
    }

    /*  Display Manipulation
    ***********************************************************************************************/
    /**
     * @brief Creates a new command line and appends it to the terminal display
     */
    createNewCommandLine() {
        // Create new command line
        this.commandLine = new CommandLine(this, this.handleKeydown); // pass terminal and key handler
        
        // Add command line to terminal display
        this.terminalDisplay.appendChild(this.commandLine.element);

        // Start the caret blinking
        this.startCaretBlink();

        // Focus the element
        this.commandLine.element.focus();
    }

    /**
     * @brief Adds an output line to the terminal display
     * @param {string} type Type of output ('error', 'output', etc.)
     * @param {string} content Content to display
     */
    addOutputLineToTerminal(type, content) {
        const li = DOMHelper.createOutputLineElement(type, content);
        this.terminalDisplay.appendChild(li);
    }

    /**
     * @brief Clears the terminal by removing all content from the display
     */
    clearDisplay() {
        this.terminalDisplay.innerHTML ='';
    }

    /**
     * @brief Prints version information to the terminal
     */
    printVersionInfo() {
        this.addOutputLineToTerminal('output', CONFIG.VERSION_INFO);
    }
}