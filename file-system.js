/*==================================================================================================
* @project Web-Based Terminal
====================================================================================================
* @file: file-system.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
==================================================================================================*/

/**
 * @brief Map of supported file types and their descriptions
 */
const SUPPORTED_TYPES = {
    dir: 'Directory',
    txt: 'Text File',
    jpg: 'JPEG Image',
    png: 'PNG Image'
}

/*==================================================================================================
    Class Definitions
==================================================================================================*/
/**
 * @class Filesystem
 * @brief Manages the virtual file system structure and operations
 */
export class Filesystem {
    /**
     * @brief Constructor - initializes the filesystem with test data
     * @param {string} initialDirectory - Optional starting directory (unused in current implementation)
     */
    constructor(initialDirectory) {
        const {root, home, cwd} = this.createTestFilesystem();
        this.root = root;
        this.home = home;
        this.cwd = cwd;
    }

    /*  General
    ***********************************************************************************************/
    /**
     * @brief Validates file or directory name against system constraints
     * @param {string} name - Name to validate
     * @return {boolean} True if valid, false otherwise
     */
    isValidName(name) {
        const errors = [];
        
        
        if (!name || name.length === 0) errors.push("empty");
        if (name.includes('/')) errors.push("contains slash");
        if (name.includes('\0')) errors.push("contains null character");
        if (name.length > 255) errors.push("exceeds max length");
        
        if (errors.length > 0) {
          console.error(`Error: file/folder name "${name}" is not valid: ${errors.join(", ")}`);
          return false;
        }
        
        return true;
    }

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

    /**
     * @brief Tokenizes a filepath, and returns an ordered list of folders in path.
     * @param {string} path Filepath to be tokenized.
     * @returns {string[]} Ordered array of folder names to get to file path.
     */
    tokenizePath(path) {
        if (!path) {
            console.error('Cannot tokenize null path');
            return null;
        }

        const tokens = path.split('/').filter(item => item !== '');
        for (const token of tokens) {
            if (!this.isValidName(token)) {
                return null;
            }
        }

        return tokens
    }

    /*  Manipulation
    ***********************************************************************************************/
    deleteNode(node, { recursive }) {
        if (!node) return;

        // If recuresive deletion, check if node is directory and has children
        if (recursive) {
            if (node.isDirectory && node.children) {
                for (const child of node.children)
                    // Delete all children of node
                    this.deleteNode(child, { recursive: true});
            }
        }

        if (node.parent)
            node.parent.removeChild(node.getFullName());
    }

    /*  Navigation
    ***********************************************************************************************/
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
        if (path === '') {
            this.cwd = (this.home) ? this.home : this.root;
            return { success: true }
        }
        
        // Tokenize filepath
        const isAbsolute = path[0] === '/';
        const folders = path.split('/').filter(item => item !== '');
        let cursor = isAbsolute ? this.root : this.cwd;
        
        // Iterate through directories
        for (const folder of folders) {
            if (folder === '.') {
                continue;
            } else if (folder === '..') {
                if (cursor.parent)
                    cursor = cursor.parent;
            } else {
                if (!cursor.hasChild(folder, 'dir')) {
                    return { 
                        success: false,
                        info: 'Path does not exist'
                     }
                }
                cursor = cursor.getChild(folder);
            }
            
        }
        
        // Update current working directory
        this.cwd = cursor;
        return { success: true }
    }

    /*  Printing
    ***********************************************************************************************/
    /**
     * @brief Generates a string representation of the entire filesystem
     * @return {string} Formatted string representation of filesystem
     */
    stringifyFilesystem() {
        let filesystemString = ''
        filesystemString += 'Filesystem:';
        filesystemString += '-----------';
        filesystemString += this.printSubsystem(this.root, 0);
        filesystemString += '-----------';

        return filesystemString;
    }

    /**
     * @brief Recursively builds string representation of a filesystem subtree
     * @param {FSNode} root - Root node of the subtree
     * @param {number} layer - Current depth level for indentation
     * @param {string} string - Accumulated string representation
     * @return {string} Updated string representation with added subtree
     */
    stringifySubsystem(root, layer, string) {
        if (!root) return string;
        
        // Create indentation based on the current layer
        const spaces = layer * 3; // Assuming 3 spaces per level
        let indent = '';
        for (let i = 0; i < spaces; i++) {
            indent += ' ';
        }
        
        // Add the current node to output
        string += indent + root.name + '\n';

        // If node is a not a directory, return before child check
        if (!root.isDirectory) return string;
        
        // Recursively process children with incremented layer
        root.children.forEach((child) => {
            this.stringifySubsystem(child, layer + 1, string);
        });
    }

    /*  Testing
    ***********************************************************************************************/
    /**
     * @brief Creates a test filesystem with predefined structure
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
        
        // Some hidden configuration files
        let bashrc = new FSNode('.bashrc', 'txt');
        bashrc.isHidden = true;
        let gitconfig = new FSNode('.gitconfig', 'txt');
        gitconfig.isHidden = true;
        userDir.addChild(bashrc);
        userDir.addChild(gitconfig);
        
        // Document files
        let resume = new FSNode('resume', 'txt');
        let notes = new FSNode('notes', 'txt');
        let project = new FSNode('project', 'txt');
        documents.addChild(resume);
        documents.addChild(notes);
        documents.addChild(project);
        
        // Project directory
        let projectDir = new FSNode('project_files', 'dir');
        documents.addChild(projectDir);
        let readme = new FSNode('README', 'txt');
        let config = new FSNode('config', 'txt');
        projectDir.addChild(readme);
        projectDir.addChild(config);
        
        // Pictures with image files
        let vacation = new FSNode('vacation', 'dir');
        pictures.addChild(vacation);
        let photo1 = new FSNode('beach', 'jpg');
        let photo2 = new FSNode('mountains', 'jpg');
        let photo3 = new FSNode('sunset', 'png');
        vacation.addChild(photo1);
        vacation.addChild(photo2);
        vacation.addChild(photo3);
        
        // Screenshots folder
        let screenshots = new FSNode('screenshots', 'dir');
        pictures.addChild(screenshots);
        let screen1 = new FSNode('screenshot1', 'png');
        let screen2 = new FSNode('screenshot2', 'png');
        screenshots.addChild(screen1);
        screenshots.addChild(screen2);
        
        // Downloads with mixed content
        let installer = new FSNode('app_installer', 'txt');
        let wallpaper = new FSNode('wallpaper', 'jpg');
        downloads.addChild(installer);
        downloads.addChild(wallpaper);
        
        // Desktop items
        let shortcut = new FSNode('shortcut', 'txt');
        let presentation = new FSNode('presentation', 'txt');
        desktop.addChild(shortcut);
        desktop.addChild(presentation);
        
        // System directories and files
        let bin = new FSNode('bin', 'dir');
        usr.addChild(bin);
        let systemConfig = new FSNode('system', 'txt');
        etc.addChild(systemConfig);
        let logs = new FSNode('logs', 'dir');
        vars.addChild(logs);
        let tempFile = new FSNode('temp', 'txt');
        tmp.addChild(tempFile);

        return { 
            root: root, 
            home: userDir, 
            cwd: userDir 
        };
    }
}

/*================================================================================================*/
/**
 * @class FSNode
 * @brief Represents a node in the filesystem (either a file or directory)
 */
export class FSNode {
    /**
     * @brief Constructor - creates a new file system node
     * @param {string} name - Name of the file or directory
     * @param {string} type - Type of node ('dir' or file extension)
     */
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.isDirectory = (type === 'dir');
        this.isHidden = name.startsWith('.'); // Updated isHidden logic based on name

        this.parent = null;
        this.children = (!this.isDirectory) ? null : new Map();

        this.metadata = {
            created: new Date(), // Use Date object
            modified: new Date(), // Use Date object
            size: 0
        };
        this.content = (this.isDirectory) ? null : '';
    }

    /**
     * @brief Gets the full name of the node including extension for files.
     * Used as the key in the parent's children map.
     * @return {string} Full name (e.g., "file.txt" or "directory_name").
     */
    getFullName() {
        return (this.isDirectory) ? this.name : this.name + '.' + this.type;
    }

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

    /**
     * @brief Checks if directory has a child with specified full name and optional type.
     * @param {string} fullName - Full name of child (name.ext for files, name for dirs).
     * @param {string} [type] - Optional type of child ('dir' or file extension).
     * @return {boolean} True if child exists and matches type (if specified).
     */
    hasChild(fullName, type) {
        if (!this.isDirectory) return false; // Files have no children

        // Check if child exists using the full name as the key
        const child = this.children.get(fullName);
        if (child === undefined) {
            return false;
        }

        // If type specified, check if the found child's type matches
        if (type) {
            if (child.type !== type) {
                return false;
            }
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
        if (!this.isDirectory) return null; // Files have no children

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
        if (!this.isDirectory) {
             console.error(`Cannot add child to non-directory: ${this.getFullName()}`);
            return false;
        }
        const childFullName = child.getFullName();
        if (this.hasChild(childFullName)) {
            console.error(`Folder '${this.getFullName()}' already has child '${childFullName}'`);
            return false;
        }
        child.parent = this;
        this.children.set(childFullName, child); // Use full name as key

        return true;
    }

    /**
     * @brief Removes a child node by its full name.
     * @param {string} fullName - Full name of child to remove (name.ext for files, name for dirs).
     * @return {boolean} True if successfully removed, false if not found or not a directory.
     */
    removeChild(fullName) {
        if (!this.isDirectory) {
             console.error(`Cannot remove child from non-directory: ${this.getFullName()}`);
             return false;
        }
        // Use hasChild with the full name key to check existence before deleting
        if (!this.hasChild(fullName)) {
            return false;
        }

        // Delete using the full name key
        const deleted = this.children.delete(fullName);

        return deleted;
    }
}