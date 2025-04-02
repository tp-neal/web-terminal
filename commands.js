/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: commands.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
==================================================================================================*/

import { CONFIG } from './terminal.js';
import { Filesystem } from './file-system.js';

/**
 * @class ArgParser
 * @brief Utility class for parsing command arguments from string input
 */
export class ArgParser {

    /**
     * @brief Parses a command string into tokens, handling quotes and escaped characters
     * @param {string} string The raw input string to parse
     * @return {string[]} Array of parsed tokens with escaped characters processed
     */
    static parse(string) {
        // Regex to match tokens, accounting for:
        // - Quotes ("...", '...')
        // - Escaped characters (\, ", ')
        // - Spaces outside quotes
        const tokenRegex = /(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^\s]+))/g;
        
        const tokens = [];
        let match;

        while ((match = tokenRegex.exec(string)) !== null) {
            // Prefer double-quoted, then single-quoted, then unquoted matches
            const token = match[1] || match[2] || match[3];
            if (token !== undefined) {
                // Replace escaped quotes and spaces (e.g., \" → ", \  → space)
                tokens.push(token.replace(/\\(.)/g, '$1'));
            }
        }

        return tokens;
    }

    /**
     * @brief Splits command arguments into switches and remaining parameters
     * @param {string[]} args Array of command arguments
     * @return {Object} Object containing {switches: string[], remaining: string[]}
     */
    static argumentSplitter(args) {
        let switches = [];
        let remaining = [];

        for (const arg of args) {
            if (arg[0] === '-')
                switches.push(arg);
            else
                remaining.push(arg);
        }

        return { switches, remaining };
    }
}

/*==================================================================================================
    CommandRegistry Class
==================================================================================================*/
/**
 * @class CommandRegistry
 * @brief Manages available terminal commands and their execution
 */
export class CommandRegistry {
    /**
     * @brief Creates a new command registry with specified commands
     * @param {Object} terminal Reference to the terminal instance
     * @param {Filesystem} filesystem Reference to the filesystem instance
     * @param {Object} supportedCommands Map of command names to command classes
     */
    constructor(terminal, filesystem, supportedCommands) {
        this.terminal = terminal;
        this.filesystem = filesystem;

        this.commands = {};
        Object.entries(supportedCommands).forEach(([commandName, commandClass]) => {
            this.register(commandName, commandClass);
        });
    }

    /**
     * @brief Adds a command to the registry in the form { commandName: commandClass }
     * @param {string} commandName Name of the command to be added
     * @param {class} commandClass Pointer to the class definition the command name refers to
     */
    register(commandName, commandClass) {
        // Map the command name to its class definition
        this.commands[commandName] = commandClass;
    }

    /**
     * @brief Attempts to execute a command if it exists, and returns its result
     * @param {string} commandName Command to be executed
     * @param {string[]} args Tokenized arguments that follow the command
     * @return {Object} Result object with type and additional information
     */
    execute(commandName, args) {
        // Check if command exists
        if (!this.commands[commandName]) {
            const type = 'error';
            const info = `Command ${commandName} not registered`;
            return { type, info };
        }

        // Create a data object with necessary dependencies
        const data = {
            terminal: this.terminal,
            filesystem: this.filesystem
        };

        // Create instance of new command and invoke it
        const command = new this.commands[commandName](data);
        return command.execute(args);
    }
}

/*==================================================================================================
    Generic Command Class
==================================================================================================*/
/**
 * @class Command
 * @brief Base class for all terminal commands
 */
export class Command {
    static commandName = '';
    static description = 'No description available.';
    static usage = '';
    static supportedArgs = []; // List of supported switches

    /**
     * @brief Returns information about the command related to its usage
     * @return {Object} Object containing command documentation (name, description, usage, args)
     */
    static getHelp() {
        return {
            name: this.commandName,
            description: this.description,
            usage: this.usage,
            args: this.supportedArgs
        };
    }

    /**
     * @brief Instance method to access static help information
     * @return {Object} Command documentation from static getHelp()
     */
    help() {
        return this.constructor.getHelp();
    }
}

/*==================================================================================================
    Command Classes Sorted Alphabetically
==================================================================================================*/
/**
 * @class CdCommand
 * @brief Command for changing the current directory
 */
export class CdCommand extends Command {
    static commandName = 'cd';
    static description = 'Change directory';
    static usage = 'cd [directory]';
    
    /**
     * @brief Initializes a cd command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Navigates to a specified relative or absolute directory if it exists
     * @param {string[]} args Array containing the path to navigate to at args[0]
     * @return {Object} Result object with type ('navigation' or 'error') and information
     */
    execute(args) {
        if (args && args.length > 1) {
            return {
                type: 'error',
                info: 'Invalid usage: too many arguments'
            };
        }
        
        // Extract path
        const path = (args) ? args[0] : '';
        
        // Execute command
        const { success, info } = this.filesystem.navigateTo(path);
        const type = success ? 'navigation' : 'error';
        return { type, content: info };
    }
    
}

/**
 * @class ClearCommand
 * @brief Command for clearing the terminal screen
 */
export class ClearCommand extends Command {
    static commandName = 'clear';
    static description = 'Clear the terminal screen';
    static usage = 'clear';

    /**
     * @brief Initializes a clear command instance
     * @param {Object} data Object containing required dependencies (none for this command)
     */
    constructor(data) {
        super();
    }

    /**
     * @brief Returns a clear command to the calling terminal
     * @param {string[]} args Array of command arguments (not used)
     * @return {Object} Structure containing handling type ('clear')
     */
    execute(args) {
        return { 
            type: 'clear'
        };
    }
}

/**
 * @class EchoCommand
 * @brief Command for displaying text in the terminal
 */
export class EchoCommand extends Command {
    static commandName = 'echo';
    static description = 'Display a line of text';
    static usage = 'echo [switches] [text]';

    /**
     * @brief Initializes an echo command instance
     * @param {Object} data Object containing required dependencies (none for this command)
     */
    constructor(data) {
        super();
        // No dependencies needed
    }

    /**
     * @brief Returns a string for the terminal to display based on provided arguments
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type ('output') and output text
     */
    execute(args) {
        // Split up the arguments
        const { switches, remaining } = ArgParser.argumentSplitter(args);

        // Join the segments with a space (quote enclosed sequences are treated as one segment)
        const content = remaining.join(' ');
        const type = 'output';

        return { type, content };
    }
}

/**
 * @class LsCommand
 * @brief Command for listing directory contents
 */
export class LsCommand extends Command {
    static commandName = 'ls';
    static description = 'List directory contents';
    static usage = 'ls [switches] [directory](optional)';
    static supportedArgs = [];

    /**
     * @brief Initializes an ls command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Lists contents of the current working directory
     * @param {string[]} args Array of command arguments (not used in this implementation)
     * @return {Object} Result object with type ('output') and directory listing
     */
    execute(args) {
        const cwd = this.filesystem.cwd;
        
        let content = '';
        cwd.children.forEach((child, childName) => {
            if (!child.isHidden) {
                content += child.getFullName() + '\t';
            }
        });
        const type = 'output';
        if (content.length === 0) content = null;
        
        return { type, content };
    }
}

/**
 * @class TodoCommand
 * @brief Command for displaying the TODO list
 */
export class TodoCommand extends Command {
    static commandName = 'todo';
    static description = 'Display the TODO list';
    static usage = 'todo';

    /**
     * @brief Initializes a todo command instance
     * @param {Object} data Object containing required dependencies (none for this command)
     */
    constructor(data) {
        super();
        // This command only needs access to CONFIG, which is imported
    }

    /**
     * @brief Returns the configured TODO list
     * @param {string[]} args Array of command arguments (not used)
     * @return {Object} Result object with type ('output') and TODO content
     */
    execute(args) {
        return {
            type: 'output',
            content: CONFIG.TODO
        };
    }
}

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
        const filesystemString = this.filesystem.stringifyFilesystem();
        const type = 'output';

        return { type, content: filesystemString };
    }
}