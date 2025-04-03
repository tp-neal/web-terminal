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
import { Filesystem, FSNode } from './file-system.js';

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
     * @return {Object} Object containing {switches: string[], : string[]}
     */
    static argumentSplitter(args) {
        let switches = [];
        let params = [];

        for (const arg of args) {
            if (arg[0] === '-') {
                if (arg.length >= 2 && arg[1] === '-')
                    switches.push(arg.slice(2));
                else
                    switches.push(arg.slice(1));
            } else {
                params.push(arg);
            }
        }

        return { switches, params };
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
            this.registerCommand(commandName, commandClass);
        });
    }

    /**
     * @brief Adds a command to the registry in the form { commandName: commandClass }
     * @param {string} commandName Name of the command to be added
     * @param {class} commandClass Pointer to the class definition the command name refers to
     */
    registerCommand(commandName, commandClass) {
        // Map the command name to its class definition
        this.commands[commandName] = commandClass;
    }

    /**
     * @brief Attempts to execute a command if it exists, and returns its result
     * @param {string} commandName Command to be executed
     * @param {string[]} args Tokenized arguments that follow the command
     * @return {Object} Result object with type and additional information
     */
    executeCommand(commandName, args) {
        // Check if command exists
        if (!this.commands[commandName]) {
            return { 
                type: 'error',
                content: 'voidsh: Command not registered'
            };
        }

        // Create a data object with necessary dependencies
        const data = {
            terminal: this.terminal,
            filesystem: this.filesystem
        };

        // Create instance of new command and invoke it
        const command = new this.commands[commandName](data);
        let { type, content } = command.execute(args);

        // If type is error, and errors provided, format return string
        if (type === 'error' && content.length > 0) {
            let formattedString = '';
            for (const error of content) {
                formattedString += `${commandName}: ${error}\n`;
            }
            content = formattedString;
        }

        return { type, content };
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
        const path = (args && args.length > 0) ? args[0] : '';
        
        // Execute command
        const { success, info } = this.filesystem.navigateTo(path);
        const type = success ? 'navigation' : 'error';

        // If error, return an array with error info string for formatting in CommandRegistry
        return { type, content: (success) ? null : [`${info}`] };
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
    execute() {
        return { 
            type: 'clear'
        };
    }
}

/**
 * @class CpCommand
 * @brief Command for copying files and directories
 */
export class CpCommand extends Command {
    static commandName = 'cp';
    static description = 'Copy files and directories';
    static usage = 'cp [switches] source_file target_file';
    static supportedArgs = [];

    /**
     * @brief Initializes a cp command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Copies files or directories
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        // TODO: Implement cp functionality

        // Split up the arguments
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Check for args
        if (params.length < 2) {
            return {
                type: 'error',
                content: 'Too few arguments',
            }
        }

        // Make sure theyre not trying to copy directory to a file
        if (params.length === 2) {
            if (!this.filesystem.cwd.hasChild(params[0])) {
                return {
                    type: 'error',
                    content: 'No directory specified',
                }
            }
        }
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
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Join the segments with a space (quote enclosed sequences are treated as one segment)
        const content = params.join(' ');
        const type = 'output';

        return { type, content };
    }
}

/**
 * @class FindCommand
 * @brief Command for searching for files in a directory hierarchy
 */
export class FindCommand extends Command {
    static commandName = 'find';
    static description = 'Search for files in a directory hierarchy';
    static usage = 'find [path] [expression]';
    static supportedArgs = [];

    /**
     * @brief Initializes a find command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Searches for files matching given criteria
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        // TODO: Implement find functionality
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
 * @class MkdirCommand
 * @brief Command for creating directories
 */
export class MkdirCommand extends Command {
    static commandName = 'mkdir';
    static description = 'Create new directories';
    static usage = 'mkdir [switches] directory...';
    static supportedArgs = ['p'];

    /**
     * @brief Initializes a mkdir command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Creates new directories
     * @param {string[]} args Array of directory names to create
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        let errors = []; // Used to contain potential errors for return

        // Split up the arguments
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Make sure switches are valid
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                errors.push(`Invalid switch type -${switchName}`);
                return {
                    type: 'error',
                    content: errors
                }
            }
        }

        // Make sure directory('s) are provided
        if (params.length === 0) {
            errors.push('No directory specified');
            return {
                type: 'error',
                content: errors
            }
        }

        // Check if -p flag is present
        const createParents = switches.includes('p');

        // Create each directory specified (each param)
        for (const path of params) {

            // Tokenize the path into seperate directories
            const folders = this.filesystem.tokenizePath(path);
            if (!folders || folders.length === 0) {
                errors.push('Invalid path passed to command');
                return {
                    type: 'error',
                    content: errors
                }
            }

            // Determine starting position of path
            const isAbsolute = path.startsWith('/');
            let cursor = isAbsolute ? this.filesystem.root : this.filesystem.cwd;

            // Process each folder in the path
            for (let i = 0; i < folders.length; i++) {
                const folderName = folders[i];

                // Make sure folder name is valid
                if (!this.filesystem.isValidName(folderName)) {
                    errors.push(`Folder name '${folderName}' is not valid`);
                    return {
                        type: 'error', 
                        content: errors
                    }
                }
                
                // If the folder exists, move to it
                if (cursor.hasChild(folderName, 'dir')) {
                    cursor = cursor.getChild(folderName);
                    continue;
                }
                
                // If it doesn't exist and we're not at the last folder in the path
                // and -p flag is not specified, return error
                if (i < folders.length - 1 && !createParents) {
                    errors.push(`Folder '${cursor.name}' has no child named '${folderName}'\n` +
                                `Try using -p to create parent directories if they don't yet exist`);
                    return {
                        type: 'error',
                        content: errors
                    }
                }
                
                // Create the directory
                const newDir = new FSNode(folderName, 'dir');
                cursor.addChild(newDir);
                cursor = newDir;
            }
        }

        // Return success
        return {
            type: 'output',
            content: null // Success with no output
        }
    }
}

/**
 * @class MvCommand
 * @brief Command for moving/renaming files and directories
 */
export class MvCommand extends Command {
    static commandName = 'mv';
    static description = 'Move (rename) files';
    static usage = 'mv [switches] source target';
    static supportedArgs = [];

    /**
     * @brief Initializes a mv command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Moves or renames files and directories
     * @param {string[]} args Array of command arguments
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        // TODO: Implement mv functionality
    }
}

/**
 * @class PwdCommand
 * @brief Command for printing current working directory
 */
export class PwdCommand extends Command {
    static commandName = 'pwd';
    static description = 'Prints current working directory';
    static usage = 'pwd [switches]';
    static supportedArgs = [];

    /**
     * @brief Initializes a pwd command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Prints out current working directory
     * @param {string[]} args Array of command arguments 
     * @return {Object} Result object with type ('output') and cwd filepath
     */
    execute(args) {
        const cwdPath = this.filesystem.cwd.getFilePath();
        
        return { 
            type: 'output', 
            content: cwdPath 
        };
    }
}

/**
 * @class RmCommand
 * @brief Command for removing files or directories
 */
export class RmCommand extends Command {
    static commandName = 'rm';
    static description = 'Remove files or directories';
    static usage = 'rm [switches] file...';
    static supportedArgs = ['r'];

    /**
     * @brief Initializes a rm command instance
     * @param {Object} data Object containing required dependencies
     */
    constructor(data) {
        super();
        this.filesystem = data.filesystem;
    }

    /**
     * @brief Removes files or directories
     * @param {string[]} args Array of file/directory names to remove
     * @return {Object} Result object with type ('output' or 'error') and information
     */
    execute(args) {
        // FIXME: Fix recursive deletion on non empty directories

        let errors = []; // Used to contain potential errors for return

        // Split up the arguments
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Make sure at least one file is specified
        if (params.length === 0) {
            errors.push('Too few arguments');
            return {
                type: 'error',
                content: errors
            }
        }

        // Make sure switches are valid
        for (const switchName of switches) {
            if (!this.constructor.supportedArgs.includes(switchName)) {
                errors.push(`Invalid switch type -${switchName}`);
                return {
                    type: 'error',
                    content: errors
                }
            }
        }

        // Set switches
        const recursiveDelete = switches.includes('r');

        // Handle each file/directory
        for (const entry of params) {
            
            // Tokenize the path into seperate files/dir ectories
            const pathParts = this.filesystem.tokenizePath(entry);
            if (!pathParts || pathParts.length === 0) {
                errors.push('Invalid path passed to command');
                return {
                    type: 'error',
                    content: errors
                }
            }

            // Determine starting position of path
            const isAbsolute = entry.startsWith('/');
            let cursor = isAbsolute ? this.filesystem.root : this.filesystem.cwd;

            // Navigate to directory of file/dir to be deleted
            const n = pathParts.length;
            let navigationFailed = false; // Flag to track failure
            for (let i = 0; i < n - 1; i++) {
                const dirName = pathParts[i];
                if (cursor.hasChild(dirName, 'dir')) {
                    cursor = cursor.getChild(dirName);
                } else {
                    // Intermediate directory not found or is not a directory
                    errors.push(`Cannot access intermediary directory ${dirName}: No such directory`);
                    navigationFailed = true;
                    break; // Stop navigating this path
                }
            }

            // If navigation failed for this entry, skip to the next entry
            if (navigationFailed) {
                continue;
            }

            // Make sure file/dir name isnt reserved
            const nodeName = pathParts[n-1];
            if (nodeName === '.' || nodeName === '..' || nodeName === '/') {
                errors.push(`Cannot remove '${entry}': Preserved directory`);
                continue;
            }
            
            // Make sure file/dir exists
            const node = cursor.getChild(nodeName);
            if (!node) {
                errors.push(`Cannot remove '${entry}': No such file or directory`);
                continue;
            }

            // Add check for the actual root node object
            if (node === this.filesystem.root) {
                errors.push(`Cannot remove '/': Operation not permitted`);
                continue;
            }

            // Delete folder if possible
            if (node.type === 'dir') {
                if (node.children.size > 0 && !recursiveDelete) {
                    errors.push(`Cannot delete directory '${node.name}': Directory not empty`);
                } else {
                    console.log(`Decided no`);
                    this.filesystem.deleteNode(node, { recursive: recursiveDelete });
                }

            // Delete file
            } else {
                this.filesystem.deleteNode(node, { recursive: false });
            }
        }

        // Return errors if encountered
        if (errors.length > 0) {
            return {
                type: 'error',
                content: errors
            }

        } else {
            return {
                type: 'ignore',
                content: null
            }
        }
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
    execute() {
        return {
            type: 'output',
            content: CONFIG.TWODOO
        }
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