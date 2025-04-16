/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: config.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains all the configuration constants for the terminal emulator.
==================================================================================================*/

/*  Configuration Constants
 **************************************************************************************************/
/**
 * @brief Global configuration settings for the terminal
 */
export const CONFIG = {
    CARET_SYMBOL: "█",
    CARET_BLINK_INTERVAL: 850,
    USER: `user@system:`,
    DEFAULT_DIRECTORY: `~`,
    SIGN: `$`,
    VERSION_INFO:
        "Null-Terminal v0.1.0-alpha \\0\n" +
        "© 2025 Nullptr Solutions\n" +
        "Build: 0x00FF-TERM-NULL\n" +
        '"Where strings end, possibilities begin."\n' +
        "---------------------------------------------------------\n" +
        "The terminal where strings terminate, but ideas don't.\n" +
        "Running on NullOS kernel 3.14\n" +
        "Powered by voidsh interpreter v0.0.0\n" +
        "Type 'help' to begin or 'about' for more information.\n" +
        "---------------------------------------------------------\n",

    TO_DO_LIST:
        "---------------------------------------------------------\n" +
        "TODO ITEMS:\n" +
        "---------------------------------------------------------\n" +
        "1.  Implement file movement in mv cp etc. for hidden files.\n" +
        "2.  Add documentation for each command's flags.\n" +
        "3.  Add tab auto-completion for navigation cmds.\n" +
        "4.  Implement the following cmds:\n" +
        "    ✓ cat      (concatenate and display file contents)\n" +
        "    ✓ cd       (change directory)\n" +
        "    ✓ clear    (clear terminal screen)\n" +
        "   ✓✓ cp       (copy file/directory)\n" +
        "    ✓ echo     (display a line of text)\n" +
        "    ✓ ls       (list directory contents)\n" +
        "    ✓ mkdir    (make directory)\n" +
        "    ✓ mv       (move file/directory)\n" +
        "    ✓ pwd      (print working directory)\n" +
        "    ✓ rm       (remove file/directory)\n" +
        "    ✓ todo     (prints current todo list for web-terminal\n" +
        "    ✓ touch    (create empty file)\n" +
        `    ✓ tree     (prints the current file system tree)\n` +
        "---------------------------------------------------------\n",
};

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
    general_text: `content__general`,
    error_text: `content__error`,
    directory_text: `content__directory`,
    file_text: `content__file`,
    hint_text: `content__hint`,
};

/**
 * @brief Map of supported file types and their descriptions
 */
export const SUPPORTED_TYPES = {
    dir: "Directory",
    txt: "Text File",
    jpg: "JPEG Image File",
    png: "PNG Image File",
    md: "Markdown File",
    json: "JSON File", // Keeping it concise as "JSON" is widely understood
    exe: "Executable File",
    url: "URL File",
    pptx: "PowerPoint Presentation", // Or 'PowerPoint File' if you prefer
    conf: "Configuration File",
    log: "Log File",
    tmp: "Temporary File",
};
/**
 * @brief Map of error messages with their printouts
 */
export const ERROR_MESSAGES = {
    // General Errors
    CMD_NOT_REGISTERED: "Command not registered",
    UNKNOWN_COMMAND_TYPE: (type) => `Command returned unknown type of '${type}'`, // For console
    INTERNAL_ERROR: "An internal error occurred. Please check the console for details.",

    // Argument/Usage Errors
    INVALID_USAGE: "Invalid usage",
    TOO_FEW_ARGS: "Too few arguments",
    TOO_MANY_ARGS: "Too many arguments",
    INVALID_SWITCH: (sw) => `Invalid switch: -${sw}`,
    MISSING_TARGET: "Missing target operand",
    MISSING_SOURCE: "Missing source operand",

    // Filesystem Errors
    INVALID_PATH: "Invalid path specified",
    PATH_NOT_FOUND: (path) => `Cannot access '${path}': No such file or directory`,
    NOT_A_DIRECTORY: (path) => `Cannot access '${path}': Not a directory`,
    IS_A_DIRECTORY: (path) => `Cannot perform operation on '${path}': Is a directory`,
    DIRECTORY_NOT_EMPTY: (dir) => `Cannot remove directory '${dir}': Directory not empty`,
    FILE_EXISTS: (file) => `Cannot create '${file}': File or directory already exists`,
    INVALID_FILE_NAME: (name) => `Cannot create file '${name}': Invalid name`,
    INVALID_DIR_NAME: (name) => `Cannot create directory '${name}': Invalid name`,
    PRESERVED_DIR: (dir) => `Cannot remove '${dir}': Preserved directory`,

    // Filesystem Validation Errors (Primarily for console, use GENERIC for user)
    INVALID_NAME_REASON: (name, reason) => `Invalid name '${name}': ${reason}`,
};

export const HINT_MESSAGES = {};
