/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: filesystem.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation Filesystem, and FSNode (Filesystem node) that represents all files
          and folders.
==================================================================================================*/

import { SUPPORTED_TYPES } from "../config.js";
import { FSNodeErrors } from "../util/error_messages.js";
import { FSUtil } from "./fs-util.js";

/*  File/directory Class Definition
 **************************************************************************************************/
/**
 * @class FSNode
 * @brief Represents a node in the filesystem (either a file or directory)
 */
export class FSNode {
    name; // Name of the file/directory
    type; // Type of the node (e.g., 'dir', 'txt', 'jpg')

    isDirectory; // True if the node is a directory
    isHidden; // True if the file/directory is hidden (auto set in this.setName())

    parent; // Parent directory of the file/directory
    children; // Children files/dierectories of this node

    content; // Text content of the file (if applicable)

    metadata; // Metadata including creation time, modification time, and size  

    /**
     * @brief Constructor - creates a new file system node
     * @param {string} name - Name of the file or directory
     * @param {string} type - Type of node ('dir' or file extension)
     */
    constructor(name, type, content) {
        // Handle type initialization
        this.type = type ? type : "txt"; // default to text
        this.isDirectory = type === "dir";

        const typeIsSupported = Object.keys(SUPPORTED_TYPES).includes(type);
        if (type && !typeIsSupported) {
            throw new Error(`FSNode type '${type}' is not supported`);
        }

        // Handle name initialization
        if (!name) {
            throw new Error(`FSNode constructor requires name`);
        }

        this.name = name;
        this.isHidden = name.startsWith(".");

        if (this.isDirectory && !FSUtil.isValidDirectoryName(this.name)) {
            throw new Error(`Invalid directory name: ${this.name}`);
        } else if (!this.isDirectory && !FSUtil.isValidFileName(this.name)) {
            throw new Error(`Invalid file name: ${this.name}`);
        }

        // Set up parent and child information
        this.parent = null;
        this.children = !this.isDirectory ? null : new Map();

        // Initialize content
        this.content = !this.isDirectory ? content || '' : null;

        // Create metadata
        this.metadata = {
            created: new Date(), // Use Date object
            modified: new Date(), // Use Date object
            size: 0,
        };
    }

    /*  Name/Type Management
     **********************************************************************************************/
    /**
     * @brief Gets the full name of the node including extension for files.
     * Used as the key in the parent's children map.
     * @return {string} Full name (e.g., "file.txt" or "directory_name").
     */
    getFullName() {
        return this.isDirectory ? this.name : this.name + "." + this.type;
    }

    /**
     * @brief Sets the name of the node and updates its hidden status.
     * @param {string} name - New name for the node (without extension).
     */
    setName(name) {
        if (!name) {
            throw new Error(`Cannot rename '${this.name}' to invalid name of '${name}'`);
        }

        // Check name validity
        if (this.isDirectory && !FSUtil.isValidDirectoryName(this.name)) {
            throw new Error(`Invalid directory name: ${this.name}`);
        } else if (!this.isDirectory && !FSUtil.isValidFileName(this.name)) {
            throw new Error(`Invalid directory name: ${this.name}`);
        }

        if (this.parent) {
            const newFullName = name + "." + this.type; // construct new name to check for existence

            if (this.parent.hasChild(newFullName)) {
                throw new Error(
                    FSNodeErrors.ALREADY_HAS_CHILD(this.parent.getFullName(), newFullName)
                );
            }

            this.parent.removeChild(this.getFullName());
            this.parent.addChild(newFullName); // here we use the full name + extension as a key
        }

        this.name = name; // we set only the name component here to reflect the one we just added
        this.isHidden = this.name.startsWith(".");
        this.updateModifiedTime();
    }

    /*  Path Management
     **********************************************************************************************/
    /**
     * @brief Gets the full path of this node from root
     * @return {string} Full path starting from root
     */
    getFilePath() {
        let path = "";
        let node = this;

        while (node) {
            path = node.name + (node.name === "/" ? "" : "/") + path;
            node = node.parent;
        }

        return path;
    }

    /*  Child Management
     **********************************************************************************************/
    /**
     * @brief Checks if directory has a child with specified full name and optional type.
     * @param {string} fullName - Full name of child (name.ext for files, name for dirs).
     * @param {string} [type] - Optional type of child ('dir' or file extension).
     * @return {boolean} True if child exists and matches type (if specified).
     */
    hasChild(fullName) {
        const child = this.getChild(fullName);
        return !!child;
    }

    /**
     * @brief Gets a child node by its full name, optionally checking type.
     * @param {string} fullName - Full name of child (name.ext for files, name for dirs).
     * @return {FSNode|undefined} Child node if found (and type matches, if specified), otherwise undef.
     */
    getChild(fullName) {
        if (!this.isDirectory) {
            throw new Error(FSNodeErrors.CANT_GET_CHILDREN_OF_DIRECTORY(this.getFullName()));
        }

        // Retrieve using the full name as the key
        const child = this.children.get(fullName);

        return child;
    }

    /**
     * @brief Adds a child node to this directory. Uses child's full name as map key.
     * @param {FSNode} child - Node to add as child.
     * @return {boolean} True if successful, false if not a directory or child already exists.
     */
    addChild(child) {
        if (!this.isDirectory) {
            throw new Error(FSNodeErrors.CANT_ADD_CHILD_TO_NONDIRECTORY(this.getFullName()));
        }

        // Check if the this directory already has the child
        const childFullName = child.getFullName();
        if (this.hasChild(childFullName)) {
            throw new Error(FSNodeErrors.ALREADY_HAS_CHILD(this.getFullName(), childFullName));
        }

        // Set childs parent directory to this, and add to children map
        child.parent = this;
        this.children.set(childFullName, child); // use full name as key

        this.updateModifiedTime();
        return true;
    }

    /**
     * @brief Removes a child node by its full name.
     * @param {string} fullName - Full name of child to remove (name.ext for files, name for dirs).
     * @return {boolean} True if successfully removed, false if not found or not a directory.
     */
    removeChild(fullName) {
        if (!this.isDirectory) {
            throw new Error(FSNodeErrors.CANT_REMOVE_CHILD_FROM_NONDIRECTORY(this.getFullName()));
        }

        // Get the child node instance
        const child = this.getChild(fullName);

        // Return null if there parent doesnt contain child
        if (child === undefined) {
            return null;
        }

        child.parent = null;

        this.updateModifiedTime();
        return this.children.delete(fullName);
    }

    /*  Content Management
     **********************************************************************************************/
    /**
     * @brief Gets the content of the file. Only applicable for files, not directories.
     * @returns {string} Contents of the file, or null if not a file/not set.
     */
    getContent() {
        if (this.isDirectory) {
            throw new Error(FSNodeErrors.NON_FILE_CONTENT_RETRIEVAL(this.getFullName()));
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
            throw new Error(FSNodeErrors.NON_FILE_CONTENT_SET(this.getFullName()));
        }

        this.content = content;
        this.updateModifiedTime();
        return true;
    }

    /*  Metadata Management
     **********************************************************************************************/
    /**
     * @brief Update the date/time of the last modified attribute of file/directory.
     */
    updateModifiedTime() {
        this.metadata.modified = new Date();
    }

    updateSize() {
        this.metadata.size = content ? this.content.length : 0;
    }

    /**
     * @brief Copies a node and its contents to a new location.
     * @param {FSNode} node - Node to copy.
     * @param {string} newName - New name for the copied node (optional).
     * @returns {FSNode} - Copied node.
     */
    clone(info = {}) {
        const {
            newName = null,
            recursive = false
        } = info;

        const clone = new FSNode(newName || this.name, this.type, this.content);
        clone.parent = this.parent;
        if (this.isDirectory && recursive) {
            for (const [childName, childNode] of this.children) {
                clone.addChild(childNode.clone({ recursive }));
            }
        }

        return clone;
    }
}
