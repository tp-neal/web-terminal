/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: script.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: ...
*
==================================================================================================*/

/*==================================================================================================
    Terminal Module - Encapsulates all terminal functionality
==================================================================================================*/
const Terminal = (function() {

    /* ===== Class Definitions ===== */
    class Caret {
        constructor() {
            this.sym = '█';
            this.pos = 0;
            this.visible = true;
        }
    }
    
    class Prompt {
        constructor() {
            this.element = null;
            this.content = "";
            this.caret = new Caret();
        }
    
        /**
         * @brief Inserts a key into the current line before the caret
         * @param {*} key Key to insert
         */
        insertCharacter(key) {
            // Split the content at the caret
            const left_text = this.content.substring(0, this.caret.pos);
            const right_text = this.content.substring(this.caret.pos+1);
            
            // Create new content with the character inserted
            this.updateContent(left_text + key + this.caret.sym + right_text);
            this.caret.pos++;
        }
    
        /**
         * @brief Removes a character from the current line before the caret
         */
        removeCharacter() {
            if (this.caret.pos == 0) return; // skip if nothing to remove
            
            // Split the content at the caret
            const left_text = this.content.substring(0, this.caret.pos);
            const right_text = this.content.substring(this.caret.pos+1);
            
            // Create new content with the character removed
            this.updateContent(left_text.substring(0, left_text.length-1) + this.caret.sym + right_text);
            this.caret.pos--;
        }

        /**
         * @brief Updates the position of the caret, left or right
         * @param {*} direction Direction of caret movement
         * @returns Early return if caret is at left or right border
         */
        moveCaret(direction) {
            // Split the content at the caret
            const left_text = this.content.substring(0, this.caret.pos);
            const right_text = this.content.substring(this.caret.pos+1);
            let new_content = "";

            if (direction === 'left') {
                if (this.caret.pos <= 0) return;
                
                // Shift the position one left
                const prev_char = left_text.charAt(left_text.length-1);
                new_content = left_text.substring(0, left_text.length-1) + this.caret.sym + prev_char + right_text;
                this.caret.pos--;
    
            } else if (direction === 'right') {
                if (this.caret.pos >= this.content.length-1) return;
                
                // Shift the position one right
                const next_char = right_text.charAt(0);
                new_content = left_text + next_char + this.caret.sym + right_text.substring(1);
                this.caret.pos++;
            }

            this.updateContent(new_content);
        }
    
        /**
         * @brief Toggles caret visibility
         */
        toggleCaret() {
            // Split the content at the caret
            const left_text = this.content.substring(0, this.caret.pos);
            const right_text = this.content.substring(this.caret.pos+1);
    
            if (this.caret.visible) {
                this.hideCaret();
            }
            else {
                this.showCaret();
            }
        }

        /**
         * @brief This function is used to hide the caret. It functions by replacing the caret
         * charater with a space instead of removing it, in the case the line somehow becomes 
         * active again
         */
        hideCaret() {
            // Split the content at the caret
            const left_text = this.content.substring(0, this.caret.pos);
            const right_text = this.content.substring(this.caret.pos+1);

            this.updateContent(left_text + ` ` + right_text);
            this.caret.visible = false;
        }

        /**
         * 
         */
        showCaret() {
            // Split the content at the caret
            const left_text = this.content.substring(0, this.caret.pos);
            const right_text = this.content.substring(this.caret.pos+1);

            this.updateContent(left_text + this.caret.sym + right_text);
            this.caret.visible = true;
        }

        /**
         * @brief Returns a copy of the prompt text without the caret attatched
         * @returns (see above)
         */
        stripCaret() {
            const left_text = this.content.substring(0, this.caret.pos);
            const right_text = this.content.substring(this.caret.pos+1);
            return left_text + right_text;
        }

        /**
         * @brief Moves the caret to the end of the text
         */
        moveCaretToEnd() {
            // TODO: Create a more efficient impelementation
            for (let i = 0; i < this.content.length; i++) {
                this.moveCaret(`right`);
            }
        }
    
        appendCaretToEnd() {
            this.updateContent(this.content += this.caret.sym);
            this.caret.pos = this.content.length-1;
        }

        /**
         * @brief Updates the prompt's copy of the content, and updates the DOM
         */
        updateContent(content) {
            this.content = content; // Updates this objects copy of the text
            this.element.querySelector('.line__content').textContent = content; // Updates the DOM
        }

        printContent() {
            console.log(`Content: "${this.content}"`);
        }

        printCaretPos() {
            console.log(`Caret Pos: ${this.caret.pos}`);
        }
    }

    class Terminal_List {
        constructor() {
            this.element = document.querySelector(`.${ELEMENT_IDS.command_list}`);
            if (!this.element) {
                console.error("Terminal list element not found!");
            }
            this.display = new Array(); // Commands being displayed on the screen
            this.buffer = ""; // Holds the current line text when traversing old command entries
            this.history = new Array(); // History of commands that have been processed
            this.iter = 0;
        }

        addToHistory(content) {
            this.history.push(content);
            this.iter = this.history.length;
        }

        addToDisplay(content) {
            this.display.push(content);
        }

        printHistory() {
            let str = "";
            str += `[`;
            for (let i = 0; i < this.history.length; i++) {
                str += `${this.history[i]}`;
                if (i < this.history.length-1)
                    str += `,`;
            }
            str += `]`;
            console.log(str)
        }
    }

    /* ===== Variables ===== */
    const ELEMENT_IDS = {
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

    let prompt = null;
    let terminal_list = null;
    
    /* ===== Initialization ===== */
    function init() {
        console.log("Terminal initializing...");
        
        // Create Integral Elements
        terminal_list = new Terminal_List();
        resetPrompt();
        if (!prompt) {
            console.error("Failed to create prompt object!");
            return false;
        }

        // Setup Events
        setupHeaderButtons();
        setInterval(() => prompt.toggleCaret(), 850);
        
        // Return Success
        return true;
    }
    
    /*==============================================================================================
        Event Handling
    ==============================================================================================*/
    /* ===== Keystroke Management ===== */
    /**
     * @brief Initializes keystroke events
     * @param {*} event 
     */
    function handleKeydown(event) {
        switch (event.key) {

            // Carret Shifting
            case 'ArrowRight':
                prompt.moveCaret('right');
                break;
            case 'ArrowLeft':
                prompt.moveCaret('left');
                break;
            
            // Command History
            case 'ArrowUp':
                navigateCommandHistory('up');
                break;
            case 'ArrowDown':
                navigateCommandHistory('down');
                break;

            // Command Requesting
            case 'Enter':
                executeCommand();
                break;
            case 'Delete':
                clearTerminal();
                break;
            case 'Backspace':
                prompt.removeCharacter();
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
                    prompt.insertCharacter(event.key);
                break;
        }

        // Prevent standard browser behavior for keypress
        //event.preventDefault();
    }

    /**
     * @brief Setup header button event listeners
     */
    function setupHeaderButtons() {
        const buttons = [
            { id: ELEMENT_IDS.minimize_button, handler: () => alert('Minimized terminal') },
            { id: ELEMENT_IDS.maximize_button, handler: () => alert('Maximized terminal') },
            { id: ELEMENT_IDS.exit_button, handler: () => alert('Exited terminal') }
        ];
        
        buttons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element) {
                element.addEventListener('click', button.handler);
            }
        });
    }

    /*==============================================================================================
        Command Management
    ==============================================================================================*/
    function navigateCommandHistory(direction) {
        console.log(`Before:`);
        terminal_list.printHistory();
    
        if (direction === 'up') {
            // Store current typed command if at the end before navigating up
            if (terminal_list.iter === terminal_list.history.length) {
                terminal_list.buffer = prompt.stripCaret();
            }
            // Decrement iterator if possible
            if (terminal_list.iter > 0) {
                terminal_list.iter--;
            }
            // Update prompt with history entry
            prompt.updateContent(terminal_list.history[terminal_list.iter]);
            prompt.appendCaretToEnd();

        } else if (direction === 'down') {
            // Increment iterator if possible
            if (terminal_list.iter < terminal_list.history.length) {
                terminal_list.iter++;
            }
            // Retrieve buffer if at the end, else history entry
            if (terminal_list.iter === terminal_list.history.length) {
                prompt.updateContent(terminal_list.buffer);
            } else {
                prompt.updateContent(terminal_list.history[terminal_list.iter]);
            }
            prompt.appendCaretToEnd();
        }
    
        console.log(`After:`);
        terminal_list.printHistory();
    }

    function executeCommand() {
        // Remove the active prompt list entry
        removePreviousPrompt();

        // Hide caret and add unactive prompt to list
        let command = prompt.stripCaret();
        addLineToTerminal(`prompt`, command);

        // Add command to history and display history
        terminal_list.addToDisplay(command);
        if (command.length > 0)
            terminal_list.addToHistory(command);

        // TODO: Execute based on command

        // Reset prompt
        resetPrompt();
    }

    function resetPrompt() {
        prompt = new Prompt();
        addLineToTerminal('prompt', `${prompt.caret.sym}`);

        // Assign prompt attributes
        prompt.element = terminal_list.element.lastElementChild;
        prompt.content = prompt.element.querySelector('.line__content').textContent;

        // Focus the active line and monitor input
        prompt.element.addEventListener('keydown', handleKeydown);
        prompt.element.focus();
    }

    function removePreviousPrompt() {
        terminal_list.element.removeChild(terminal_list.element.lastElementChild);
    }

    /*==============================================================================================
        Terminal Manipulation
    ==============================================================================================*/
    /**
     * @brief Clears the terminal and inserts a blank prompt line
     */
    function clearTerminal() {
        terminal_list.element.innerHTML = '';
        terminal_list.display.length = 0;
        resetPrompt();
    }

    /**
     * @brief Adds a new line to the terminal
     * @param {*} type Type of line to add (prompt : output : error)
     * @param {*} content Content to populate the line with
     * @returns 
    */
    function addLineToTerminal(type, content) {
        const new_line_html = getTerminalLineHTML(type, content);
        terminal_list.element.insertAdjacentHTML('beforeend', new_line_html);
        return terminal_list.element.lastElementChild;
    }

    /**
     * @brief Format the HTML of the new terminal line
     * @param {*} type Type of terminal line (prompt : output : error)
     * @param {*} content Text to populate the line with
     * @returns HTML of formatted line
     */
    function getTerminalLineHTML(type, content) {
        if (type === 'prompt') {
            return /*html*/`
            <li class="terminal__line terminal__line--prompt" tabindex="0">
                <span class="line__user">user@system:<span class="line__sign">~$</span></span>
                <span class="line__content">${content}</span>
            </li>`;
        } else if (type === 'output') {
            return /*html*/`
            <li class="terminal__line terminal__line--output">
                <span class="line__content">${content}</span>
            </li>`;
        } else if (type === 'error') {
            return /*html*/`
            <li class="terminal__line terminal__line--error">
                <span class="line__content">${content}</span>
            </li>`;
        }
    }
    
    // Public API - only expose what needs to be public
    return {
        init: init,
    };
})();

// Initialize terminal when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    Terminal.init();
});
