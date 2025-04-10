/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: file-system.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation Filesystem, and FSNode (Filesystem node) that represents all files
          and folders.
==================================================================================================*/

import { OutputLine } from './output-line.js';
import { FSUtil } from './fs-util.js';
import { ERROR_MESSAGES } from "./config.js";

export const RESOLUTION = {
    FOUND: 'FOUND',
    NOT_FOUND: 'NOT_FOUND', // Target or intermediate path doesn't exist
    PARENT_FOUND_TARGET_MISSING: 'PARENT_FOUND_TARGET_MISSING', // Parent exists, final component doesn't
    TARGET_FOUND_TYPE_MISMATCH: 'TARGET_FOUND_TYPE_MISMATCH', // Target exists, but type doesn't match
    NOT_A_DIRECTORY: 'NOT_A_DIRECTORY', // Intermediate path component is not a directory
    INVALID_PATH: 'INVALID_PATH', // Path string itself is malformed
    PERMISSION_DENIED: 'PERMISSION_DENIED', // Future use for permissions
    ERROR: 'ERROR' // Generic error
};

/*  File/directory Class Definition
***************************************************************************************************/
/**
 * @class FSNode
 * @brief Represents a node in the filesystem (either a file or directory)
 */
export class FSNode {
    name;           // Name of the file/directory
    type;           // Type of the node (e.g., 'dir', 'txt', 'jpg')

    isDirectory;    // True if the node is a directory
    isHidden;       // True if the file/directory is hidden (auto set in this.setName())

    parent;         // Parent directory of the file/directory
    cihldren;       // Children files/dierectories of this node

    content;        // Text content of the file (if applicable)

    metadata;       // Metadata including creation time, modification time, and size

    /**
     * @brief Constructor - creates a new file system node
     * @param {string} name - Name of the file or directory
     * @param {string} type - Type of node ('dir' or file extension)
     */
    constructor(name, type, content) {
        if (!name) {
            console.error(`FSNode constructor requires name | provided: {name: '${name}'}`);
            return;
        }

        this.name = name;
        this.isHidden = name.startsWith('.');
        this.type = (type) ? type : 'txt' // default to text
        
        this.isDirectory = (type === 'dir');

        this.parent = null;
        this.children = (!this.isDirectory) ? null : new Map();

        this.content = (!this.isDirectory && content) ? content : null;

        this.metadata = {
            created: new Date(), // Use Date object
            modified: new Date(), // Use Date object
            size: 0
        };
    }
    

    /*  Name Management
    ***********************************************************************************************/
    /**
     * @brief Gets the full name of the node including extension for files.
     * Used as the key in the parent's children map.
     * @return {string} Full name (e.g., "file.txt" or "directory_name").
     */
    getFullName() {
        return (this.isDirectory) ? this.name : this.name + '.' + this.type;
    }

    /**
     * @brief Gets the name of the node without its type (extension).
     * @returns {string} Name of the node without the type (e.g., "file" or "directory_name").
     */
    getNameWithoutType() {
        return this.name;
    }

    /**
     * @brief Sets the name of the node and updates its hidden status.
     * @param {string} name - New name for the node (without extension).
     */
    setName(name) {
        const oldName = this.name;

        // Update the name of the node
        this.name = name;
        this.isHidden = this.name.startsWith('.');
        this.updateModifiedTime();

        // Update the name of the node in the parent directory.
        if (this.parent) {
            this.parent.removeChild(oldName);
            this.parent.addChild(this);
        }
    }

    /*  Path Management
    ***********************************************************************************************/
    /**
     * @brief Gets the full path of this node from root
     * @return {string} Full path starting from root
     */
    getFilePath() {
        let node = this;
        let path = '';
        while (node) {
            path = node.name + ((path && node.name !== '/') ? '/' : '') + path; // build path correctly

             // Stop at root - check parent, not name
            if (node.parent === null && node.name === '/') break; // Reached root
            node = node.parent;
        }
         // Ensure leading slash if it wasn't the root itself
         if (path !== '/' && !path.startsWith('/')) {
             path = '/' + path;
         }
        return path;
    }

    /*  Child Management
    ***********************************************************************************************/
    /**
     * @brief Checks if directory has a child with specified full name and optional type.
     * @param {string} fullName - Full name of child (name.ext for files, name for dirs).
     * @param {string} [type] - Optional type of child ('dir' or file extension).
     * @return {boolean} True if child exists and matches type (if specified).
     */
    hasChild(fullName, type) {
        // Check if child exists using the full name as the key
        const child = this.getChild(fullName, type);
        if (!child) {
            return false;
        }

        return true;
    }

    /**
     * @brief Gets a child node by its full name, optionally checking type.
     * @param {string} fullName - Full name of child (name.ext for files, name for dirs).
     * @param {string} [type] - Optional required type ('dir' or file extension).
     * @return {FSNode|null} Child node if found (and type matches, if specified), otherwise null.
     */
    getChild(fullName, type) {
        // Files cant have children
        if (!this.isDirectory) {
            return null;
        }

        // Retrieve using the full name key
        const child = this.children.get(fullName);
        if (!child) {
            return null;
        }

         // Optional type check
         if (type && child.type !== type) {
            return null;
         }

        return child;
    }

    /**
     * @brief Adds a child node to this directory. Uses child's full name as map key.
     * @param {FSNode} child - Node to add as child.
     * @return {boolean} True if successful, false if not a directory or child already exists.
     */
    addChild(child) {
        // Cannot add children to a file
        if (!this.isDirectory) {
            console.error(`Cannot add child to non-directory: ${this.getFullName()}`);
            return false;
        }

        // Check if the this directory already has the child
        const childFullName = child.getFullName();
        if (this.hasChild(childFullName)) {
            console.error(`directory '${this.getFullName()}' already has child '${childFullName}'`);
            return false;
        }
        
        // Set childs parent directory to this, and add to children map
        child.parent = this;
        this.children.set(childFullName, child); // Use full name as key

        this.updateModifiedTime();
        return true;
    }

    /**
     * @brief Removes a child node by its full name.
     * @param {string} fullName - Full name of child to remove (name.ext for files, name for dirs).
     * @return {boolean} True if successfully removed, false if not found or not a directory.
     */
    removeChild(fullName) {
        // Cannot remove children from a file
        if (!this.isDirectory) {
            console.error(`Cannot remove child from non-directory: ${this.getFullName()}`);
            return false;
        }

        // Check if the this directory has the child
        if (!this.hasChild(fullName)) {
            return false;
        }

        // Delete using the full name key
        const child = this.getChild(fullName);
        child.parent = null;
        const deleted = this.children.delete(fullName);

        this.updateModifiedTime();
        return deleted;
    }

    /*  Content Management
    ***********************************************************************************************/
    /**
     * @brief Gets the content of the file. Only applicable for files, not directories.
     * @returns {string} Contents of the file, or null if not a file/not set.
     */
    getContent() {
        if (this.isDirectory) {
            console.error(`Cannot set content for non-directory: ${this.getFullName()}`);
            return null;
        }

        return this.content;
    }

    /**
     * @brief Sets the content of the file. Only applicable for files, not directories.
     * @param {string} content Content to set the interior of the file to.
     * @returns {boolean} True if successful, false if not a file.
     */
    setContent(content) {
        if (!this.isDirectory) {
            console.error(`Cannot set content for non-directory: ${this.getFullName()}`);
            return false;
        }

        this.content = content;
        this.updateModifiedTime();
        return true;
    }

    /*  Metadata Management
    ***********************************************************************************************/
    /**
     * @brief Update the date/time of the last modified attribute of file/directory.
     */
    updateModifiedTime() {
        this.metadata.modified = new Date();
    }
}

/*  Filesystem Class Definition
***************************************************************************************************/
/**
 * @class Filesystem
 * @brief Manages the virtual file system structure and operations
 */
export class Filesystem {
    /**
     * @brief Constructor - initializes the filesystem with test data
     * @param {string} initialDirectory - Optional starting directory (unused in current implementation)
     */
    constructor() {
        const {root, home, cwd} = this.createTestFilesystem();
        this.root = root;
        this.home = home;
        this.cwd = cwd;
    }

    /*  Path Traversal
    ***********************************************************************************************/
    /**
     * @brief Resolves a path to find a target node and its parent without changing cwd.
     * @param {string} path - The path string to resolve (relative or absolute).
     * @param {object} [options={}] - Optional parameters.
     * @param {boolean} [options.createIntermediate=false] - If true, create missing directories along the path (like mkdir -p).
     * @param {string|null} [options.targetMustBe=null] - Optional constraint: 'dir' or 'file' (or specific extension). If set, resolution fails if target exists but is wrong type.
     * @param {boolean} [options.mustExist=true] - If true (default), resolution fails if the target doesn't exist. If false, allows returning PARENT_FOUND_TARGET_MISSING.
     * @return {object} An object describing the resolution outcome.
     * @property {string} status - A status string from this.ResolutionStatus.
     * @property {FSNode|null} targetNode - The target node if found, otherwise null.
     * @property {FSNode|null} parentNode - The parent of the target node, or the last existing node found.
     * @property {string|null} targetName - The name of the final component in the path string.
     * @property {string[]|null} errors - Additional details on error.
     */
    resolvePath(path, options = {}) {
        // --- 0. FORMAT VARIABLES ---
        // Destructure and set option defaults
        const {
            createIntermediary = false,
            targetMustHaveType = null
        } = options;

        // Create array for error messages
        const errors = [];


        // --- 1. Handle empty/root paths ---
        // Root Directory
        if (path === '/') {
            return {
                status: RESOLUTION.FOUND,
                targetNode: this.root,
                parentNode: null,
                targetName: '/',
                errors
            }
        }

        // Home Directory
        if (path === '' || path === '~') {
            return {
                status: RESOLUTION.FOUND,
                targetNode: this.home,
                parentNode: this.home.parent,
                targetName: this.home.name,
                errors
            }
        }

        // --- 2. Tokenize Path ---
        const pathParts = FSUtil.tokenizePath(path);
        // Check if tokenization returned null result
        if (!pathParts) {
            errors.push({ type: 'error', content: 'Path tokenization returned null result' });
            return {
                status: RESOLUTION.INVALID_PATH,
                targetNode: null,
                parentNode: null,
                targetName: null,
                errors
            }
        }

        // Check if tokenized path is empty
        if (pathParts.length === 0) {
            errors.push({ type: 'error', content: 'Path tokenization returned empty result' });
            return {
                status: RESOLUTION.INVALID_PATH,
                targetNode: null,
                parentNode: null,
                targetName: null,
                errors
            }
        }

        // --- 3. Determine Start Node ---
        const firstChar = path[0];
        let cursor;
        if (firstChar === '/') {
            cursor = this.root; // the '/' was already filtered in tokenizePath
        } else if (firstChar === '~') {
            cursor = this.home;
            pathParts.shift(); // remove '~' from the path parts
        } else {
            cursor = this.cwd;
        }


        // --- 4. Iterate Through Tokens Until Last ---
        let n = pathParts.length;
        for (let i = 0; i < n-1; i++) {
            const part = pathParts[i];

            // If part is '.', stay in the same directory
            if (part === '.') {
                continue;
            }

            // If part is '..', move up to parent directory if it exists
            if (part === '..') {
                if (cursor.parent) {
                    cursor = cursor.parent;
                }
                continue;
            }

            // Check if the current directory contains the child directory
            if (cursor.hasChild(part)) {
                const child = cursor.getChild(part);

                // Check if the child is a directory, if not, we cannot scope into it, return error
                if (!child.isDirectory) {
                    errors.push({ type: 'error', content: ERROR_MESSAGES.NOT_A_DIRECTORY(part) });
                    return {
                        status: RESOLUTION.NOT_A_DIRECTORY,
                        targetNode: null,
                        parentNode: cursor,
                        targetName: part,
                        errors
                    }
                }

            // If current director doesnt contain child, and createIntermediary is true, create the 
            // new dierctory, and move the cursor to it
            } else if (createIntermediary) {
                const newDir = new FSNode(part, 'dir');
                cursor.addChild(newDir);

            // Return error if the cursor doesnt have the child, and createIntermediary is false
            } else {
                errors.push({ type: 'error', content: ERROR_MESSAGES.PATH_NOT_FOUND(part) });
                return {
                    status: RESOLUTION.NOT_FOUND,
                    targetNode: null,
                    parentNode: cursor,
                    targetName: part,
                    errors
                }
            }

            // Directory exists, move to it
            cursor = cursor.getChild(part);
        }

        // --- 5. Check Last Token ---
        const targetName = pathParts[n-1];
        const targetExists = cursor.hasChild(targetName);
        const targetMatchingTypeExists = cursor.hasChild(targetName, targetMustHaveType);
        const targetNode = cursor.getChild(targetName, (targetMustHaveType) ? targetMustHaveType : null);
        const parentNode = cursor;
        let status = null;

        // Check if target node withthout specified type exists
        if (targetExists) {
            // If target doesnt match type, and type is specified, return error
            if (!targetMatchingTypeExists && targetMustHaveType) {
                errors.push({ type: 'error', content: ERROR_MESSAGES.PATH_NOT_FOUND(targetName) });
                return {
                    status: RESOLUTION.TARGET_FOUND_TYPE_MISMATCH,
                    targetNode,
                    parentNode,
                    targetName,
                    errors
                }
            }   

        // Target doesn't exist, update status
        } else {
            status = RESOLUTION.PARENT_FOUND_TARGET_MISSING;
            errors.push({ type: 'error', content: ERROR_MESSAGES.PATH_NOT_FOUND(targetName) });
        }

        // --- 6. Return Result ---
        return { 
            // If status wasn't already previously set to PARENT_FOUND_TARGET_MISSING, set it to FOUND
            status: (status) ? status : RESOLUTION.FOUND,
            targetNode,
            parentNode, 
            targetName, 
            errors 
        };
    }

    /**
     * @brief Navigates to an absolute or relative path
     * @param {string} path - Path to directory to navigate to
     * @return {Object} Status object with success flag and info message
     */
    navigateTo(path) {
        
        // Root directory navigation
        if (path === '/') {
            this.cwd = this.root;
            return { success: true }
        }

        // Home directory navigation
        if (path === '' || path === '~') {
            this.cwd = (this.home) ? this.home : this.root;
            return { success: true }
        }
        
        // Tokenize filepath
        const isAbsolute = path[0] === '/';
        const folders = path.split('/').filter(item => item !== '');
        let cursor = isAbsolute ? this.root : this.cwd;
        
        // Iterate through directories
        for (const directory of folders) {
            if (directory === '.') {
                continue;
            } else if (directory === '..') {
                if (cursor.parent)
                    cursor = cursor.parent;
            } else {
                if (!cursor.hasChild(directory, 'dir')) {
                    return { 
                        success: false,
                        errorInfo: ERROR_MESSAGES.PATH_NOT_FOUND(directory)
                     }
                }
                cursor = cursor.getChild(directory);
            }
            
        }
        
        // Update current working directory
        this.cwd = cursor;
        return { 
            success: true 
        }
    }

    /*  Node State Modification
    ***********************************************************************************************/
    /**
     * @brief Deletes a node from the filesystem.
     * @param {FSNode} node - Node to delete.
     * @param {Object} options - Options for deletion.
     * @param {boolean} options.recursive - If true, delete all children of the node.
     * @return {boolean} True if deletion was successful, false otherwise.
     */
    deleteNode(node, { recursive } = {}) {
        if (!node) 
            return false;

        // If recuresive deletion, check if node is directory and has children
        if (recursive) {
            if (node.isDirectory && node.children) {
                for (const child of node.children) {
                    // Delete all children of node
                    this.deleteNode(child, { recursive: true});
                }
            }
        }

        if (node.parent)
            node.parent.removeChild(node.getFullName());

        return true;
    }

    /**
     * @brief Copies a node and its contents to a new location.
     * @param {FSNode} node - Node to copy.
     * @param {string} newName - New name for the copied node (optional).
     * @returns {FSNode} - Copied node.
     */
    copyNode(node, { newName, recursive } = {}) {
        const copy = new FSNode(newName || node.name, node.type, node.content);
        copy.parent = node.parent;
        if (node.isDirectory && recursive) {
            for (const child of node.children) {
                copy.addChild(this.copyNode(child));
            }
        }

        return copy;
    }

    /*  Pathname Malipulation
    ***********************************************************************************************/
    /**
     * @brief Converts home directory path to tilde notation
     * @param {string} path - Full path to convert
     * @return {string} Abbreviated path with ~ for home directory
     */
    abbreviateHomeDir(path) {
        const homeNameLength = this.home.getFilePath().length;
        if (path.substring(0, homeNameLength) == this.home.getFilePath()) {
            path = `~` + path.substring(homeNameLength);
        }
        return path;
    }

    /*  Printing
    ***********************************************************************************************/
    getFSTree(node, currentPrefix, isLast, lines) {
        let outputString = '';
        const outputLine = new OutputLine();
    
        // 1. Determine connector for node
        const connector = isLast ? '└── ' : '├── ';
    
        // 2. Construct line for this node
        let prefixSpan = null;
        if (node !== this.root) {
            outputString += currentPrefix + connector;
            prefixSpan = { type: 'general', content: outputString };

        }
        outputString += node.getFullName() + '\n';
        const nodeNameSpan = { type: (node.isDirectory) ? 'directory' : 'file', content: node.getFullName() };
    
        // Add line to lines for output
        if (prefixSpan)
            outputLine.addSpan(prefixSpan.type, prefixSpan.content);
        outputLine.addSpan(nodeNameSpan.type, nodeNameSpan.content);
        lines.push(outputLine);

        // 3. If it's a directory, process children
        if (node.isDirectory && node.children) {
    
            // 4. Calculate the prefix for the children
            let prefixForChildren = '';
            if (node !== this.root)
                prefixForChildren = currentPrefix + (isLast ? '    ' : '│   ');
    
            let count = 0;
            const numChildren = node.children.size; // Get size once
    
            // Iterate over the Map's [key, value] pairs
            for (const [childName, childNode] of node.children) { 
                const childIsLast = (count === numChildren - 1);
    
                // Recursive call
                this.getFSTree(childNode, prefixForChildren, childIsLast, lines);
    
                count++;
            }
        }
    }

    /*  Testing
    ***********************************************************************************************/
    /**
 * @brief Creates a test filesystem with predefined structure and dummy content
 * @return {Object} Object containing root, home, and current working directory nodes
 */
    createTestFilesystem() {
        // Root level directories
        let root = new FSNode('/', 'dir');
        let home = new FSNode('home', 'dir');
        let usr = new FSNode('usr', 'dir');
        let etc = new FSNode('etc', 'dir');
        let vars = new FSNode('var', 'dir');
        let tmp = new FSNode('tmp', 'dir');

        // Add root level directories
        root.addChild(home);
        root.addChild(usr);
        root.addChild(etc);
        root.addChild(vars);
        root.addChild(tmp);

        // Home directory structure
        let userDir = new FSNode('user', 'dir');
        home.addChild(userDir);

        // User's personal directories
        let documents = new FSNode('Documents', 'dir');
        let pictures = new FSNode('Pictures', 'dir');
        let downloads = new FSNode('Downloads', 'dir');
        let desktop = new FSNode('Desktop', 'dir');
        userDir.addChild(documents);
        userDir.addChild(pictures);
        userDir.addChild(downloads);
        userDir.addChild(desktop);

        // Some hidden configuration files with content
        let bashrcContent = `# .bashrc\n\n# Source global definitions\nif [ -f /etc/bashrc ]; `+ 
        `then\n\t. /etc/bashrc\nfi\n\n# User specific aliases and functions\nalias ll='ls -alF'\n`+ 
        `alias la='ls -A'\nalias l='ls -CF'\n`;
        let bashrc = new FSNode('.bashrc', 'txt', bashrcContent);
        let gitconfigContent = `[user]\n\tname = Tyler Neal\n\temail = example@example.com\n`+ 
        `[alias]\n\tst = status\n\tco = checkout\n\tbr = branch\n`;
        let gitconfig = new FSNode('.gitconfig', 'txt', gitconfigContent);
        userDir.addChild(bashrc);
        userDir.addChild(gitconfig);

        // Document files with content
        let resumeContent = "Objective: To obtain a challenging position...\n\nExperience:\n...\n"+ 
                            "\nSkills:\n...";
        let resume = new FSNode('resume', 'txt', resumeContent);
        let notesContent = "Meeting Notes - April 8, 2025\n- Discuss project timeline\n- Assign "+
                           "action items\n- Next meeting scheduled for Friday";
        let notes = new FSNode('notes', 'txt', notesContent);
        let projectIdeasContent = "1. Web Terminal\n2. Task Manager\n3. Recipe App";
        let projectIdeas = new FSNode('project_ideas', 'txt', projectIdeasContent);

        documents.addChild(resume);
        documents.addChild(notes);
        documents.addChild(projectIdeas); // Renamed 'project' to 'project_ideas' for clarity

        // Project directory
        let projectDir = new FSNode('project_files', 'dir');
        documents.addChild(projectDir);
        let readmeContent = "# Project Files\n\nThis directory contains files related to the "+
                            "project.\n- README.md: This file\n- config.json: Configuration "+
                            "settings";
        let readme = new FSNode('README', 'md', readmeContent); // Changed type to 'md'
        let configContent = `{ \n  \"setting1\": \"value1\",\n  \"enabled\": true,\n  \"port\": `+
                            `8080\n}`;
        let config = new FSNode('config', 'json', configContent); // Changed type to 'json'
        projectDir.addChild(readme);
        projectDir.addChild(config);

        // Pictures with image files (content usually binary, so adding descriptive text)
        let picturesDir = new FSNode('Photos', 'dir'); // Changed name for clarity
        pictures.addChild(picturesDir);
        let vacation = new FSNode('vacation', 'dir');
        picturesDir.addChild(vacation);
        let photo1 = new FSNode('beach', 'jpg', '[Simulated JPEG data for beach photo]');
        let photo2 = new FSNode('mountains', 'jpg', '[Simulated JPEG data for mountain photo]');
        let photo3 = new FSNode('sunset', 'png', '[Simulated PNG data for sunset photo]');
        vacation.addChild(photo1);
        vacation.addChild(photo2);
        vacation.addChild(photo3);

        // Screenshots directory
        let screenshots = new FSNode('screenshots', 'dir');
        picturesDir.addChild(screenshots); // Added under the new 'Photos' dir
        let screen1 = new FSNode('screenshot1', 'png', '[Simulated PNG data for screenshot 1]');
        let screen2 = new FSNode('screenshot2', 'png', '[Simulated PNG data for screenshot 2]');
        screenshots.addChild(screen1);
        screenshots.addChild(screen2);

        // Downloads with mixed content
        let installer = new FSNode('app_installer', 'exe', '[Simulated executable data]');
        let wallpaper = new FSNode('wallpaper', 'jpg', '[Simulated JPEG data for wallpaper]');
        downloads.addChild(installer);
        downloads.addChild(wallpaper);

        // Desktop items
        let shortcutInfo = "[InternetShortcut]\nURL=http://example.com/";
        let shortcut = new FSNode('shortcut_to_example', 'url', shortcutInfo);
        let presentation = new FSNode('presentation_draft', 'pptx', '[Simulated PowerPoint data]'); 
        desktop.addChild(shortcut);
        desktop.addChild(presentation);

        // System directories and files
        let bin = new FSNode('bin', 'dir');
        usr.addChild(bin);
        let systemConfigContent = "# System Configuration\ndaemon_enabled=true\nlog_level=INFO";
        let systemConfig = new FSNode('system', 'conf', systemConfigContent);
        etc.addChild(systemConfig);
        let logs = new FSNode('logs', 'dir');
        vars.addChild(logs);
        let appLog = new FSNode('app', 'log', "INFO: Application started.\nWARN: Cache cleared.\n"+
                                              "ERROR: Connection refused.");
        logs.addChild(appLog);
        let tempFileContent = "Temporary data generated at " + new Date().toISOString();
        let tempFile = new FSNode('temp_file_123', 'tmp', tempFileContent);
        tmp.addChild(tempFile);

        return {
            root: root,
            home: userDir,
            cwd: userDir
        };
    }
}
