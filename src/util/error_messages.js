
export const CommandErrors = {
    // General Errors
    CMD_NOT_REGISTERED: "Command not registered",
    UNKNOWN_COMMAND_TYPE: (type) => `Command returned unknown type of '${type}'`, // For console
    INTERNAL_ERROR: "An internal error occurred. Please check the console for details.",

    // Argument/Usage Errors
    TOO_FEW_ARGS: "Too few arguments",
    TOO_MANY_ARGS: "Too many arguments",
    INVALID_SWITCH: (cmd, sw) => `${cmd}: Invalid switch: -${sw}`,
}

export const FilesystemErrors = {
    PATH_NOT_FOUND: (path) => `Cannot access '${path}': No such file or directory`,
    NOT_A_DIRECTORY: (path) => `Cannot access '${path}': Not a directory`,
    DIRECTORY_NOT_EMPTY: (dir) => `Cannot remove directory '${dir}': Directory not empty`,
    FILE_OR_DIR_EXISTS: (file) => `Cannot create '${file}': File or directory already exists`,
    INVALID_FILE_NAME: (name) => `Cannot create file '${name}': Invalid name`,
    INVALID_DIR_NAME: (name) => `Cannot create directory '${name}': Invalid name`,
    PRESERVED_DIR: (dir) => `Cannot remove '${dir}': Preserved directory`,
}

export const FSNodeErrors = {
    NON_FILE_CONTENT_RETRIEVAL: (directoryName) =>
        `Cannot retrieve content from '${directoryName}': Not a file`,
    NON_FILE_CONTENT_SET: (directoryName) =>
        `Cannot set content of '${directoryName}': not a file`,
    ALREADY_HAS_CHILD: (parentName, childName) =>
        `Directory '${parentName}' already contains '${childName}'`,
    CANT_GET_CHILDREN_OF_DIRECTORY: (directoryName) =>
        `Cannot get children of '${directoryName}: not a directory`,
    CANT_ADD_CHILD_TO_NONDIRECTORY: (directoryName) =>
        `Cannot add child to '${directoryName}: not a directory`,
    CANT_REMOVE_CHILD_FROM_NONDIRECTORY: (directoryName) =>
        `Cannot remove child from '${directoryName}: not a directory`,
}  
