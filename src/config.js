/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: config.js
* @date: 04/19/2025
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
        "    - cat      (concatenate and display file contents)\n" +
        "    ✓ cd       (change directory)\n" +
        "    ✓ clear    (clear terminal screen)\n" +
        "    - cp       (copy file/directory)\n" +
        "    - echo     (display a line of text)\n" +
        "    - ls       (list directory contents)\n" +
        "    - mkdir    (make directory)\n" +
        "    - mv       (move file/directory)\n" +
        "    - pwd      (print working directory)\n" +
        "    - rm       (remove file/directory)\n" +
        "    - todo     (prints current todo list for web-terminal\n" +
        "    - touch    (create empty file)\n" +
        `    - tree     (prints the current file system tree)\n` +
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
    json: "JSON File",
    exe: "Executable File",
    url: "URL File",
    pptx: "PowerPoint Presentation",
    conf: "Configuration File",
    log: "Log File",
    tmp: "Temporary File",
};
