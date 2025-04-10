/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: terminal.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
==================================================================================================*/

import { ArgParser } from './arg-parser.js';
import { CommandHistory } from './command-history.js'
import { CommandLine } from './command-line.js'
import { CommandRegistry } from './command-registry.js';
import { CONFIG, ELEMENT_CLASSES, ERROR_MESSAGES } from './config.js'
import { Filesystem } from './file-system.js';
import { OutputLine } from './output-line.js';
import { TestSuite } from './testsuit.js';

import { 
    DOMHelper, 
    protectedKeyCombination 
} from './dom-util.js';

/*  Class Definition
***************************************************************************************************/
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

        // Initialize configuration variables
        this.currentDirectory = CONFIG.DEFAULT_DIRECTORY;
        this.caretBlinkInterval = CONFIG.CARET_BLINK_INTERVAL;

        // Add version info and commandline to DOM
        this.printVersionInfo();

        // Bind key handling function so the command line can access it on keydown
        this.handleKeydown = this.handleKeydown.bind(this);

        // Initialize components
        this.filesystem = new Filesystem();
        this.commandHistory = new CommandHistory();
        this.commandRegistry = new CommandRegistry(this, this.filesystem);
        this.createNewCommandLine(); // call after commandHistory constructor

        const testSuite = new TestSuite(this);
        //testSuite.catCommand();
        this.run("ls");
        this.run("ls Documents");
    }

    run(command) {
        this.commandLine.setLeftText(command);
        this.commandLine.updateDomText();
        this.executeCommand();
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
        console.log(`Executing command: ${this.commandLine.getFullText()}`);

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
            const { type, processedLines } = this.commandRegistry.executeCommand(command, args);

            // Handle output based on type
            switch(type) {
                
                // Only print a line if there is content, or specified to print blank.
                // Currently handles output and error in the same way but coulb be seperated
                // for further clarification.
                case 'output':
                    if (processedLines && processedLines.length > 0)
                        this.addLinesToTerminal(processedLines);
                    break;
                
                case 'clear':
                    this.clearDisplay();
                    break;

                case 'navigation':
                    // Update currentDirectory if current working directory moved
                    this.currentDirectory = this.filesystem.cwd.getFilePath();
                    this.currentDirectory = this.filesystem.abbreviateHomeDir(this.currentDirectory);
                    break;

                case 'ignore':
                    break;

                default:
                    console.error(ERROR_MESSAGES.UNKNOWN_COMMAND_TYPE(type));
            }
        }

        // Add command to history
        this.commandHistory.addToHistory(commandText);

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

        // Let the command history instance know of the new active line
        this.commandHistory.setActiveLine(this.commandLine);
        
        // Add command line to terminal display
        this.terminalDisplay.appendChild(this.commandLine.element);

        // Start the caret blinking
        this.startCaretBlink();

        // Focus the element
        this.commandLine.element.focus();
    }


    addLinesToTerminal(lines) {
        for (const line of lines) {
            this.addLinetoTerminal(line);
        }
    }


    addLinetoTerminal(line) {
        const li = DOMHelper.createOutputLineElement(line);
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
        this.addLinetoTerminal(new OutputLine('general', CONFIG.VERSION_INFO));
    }
}