/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: filesystem.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation Filesystem, and FSNode (Filesystem node) that represents all files
          and folders.
==================================================================================================*/

import { FSUtil } from "./fs-util.js";

/*  File/directory Class Definition
 ***************************************************************************************************/
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
    cihldren; // Children files/dierectories of this node

    content; // Text content of the file (if applicable)

    metadata; // Metadata including creation time, modification time, and size

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

        const { name: trimmedName } = FSUtil.parseNameAndExtension(name);

        this.name = trimmedName;
        this.isHidden = name.startsWith(".");
        this.type = type ? type : "txt"; // default to text

        this.isDirectory = type === "dir";

        this.parent = null;
        this.children = !this.isDirectory ? null : new Map();

        this.content = !this.isDirectory && content ? content : null;

        this.metadata = {
            created: new Date(), // Use Date object
            modified: new Date(), // Use Date object
            size: 0,
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
        return this.isDirectory ? this.name : this.name + "." + this.type;
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
        if (!name) {
            console.error(
                `FSNode.setName: Received invalid name: '${name}' for node originally named '${this.name}'`
            );
            return; // Prevent setting an invalid name
        }
        // Update the name of the node
        this.name = name;
        this.isHidden = this.name.startsWith(".");
        this.updateModifiedTime();
    }

    /*  Path Management
     ***********************************************************************************************/
    /**
     * @brief Gets the full path of this node from root
     * @return {string} Full path starting from root
     */
    getFilePath() {
        let node = this;
        let path = "";
        while (node) {
            path = node.name + (path && node.name !== "/" ? "/" : "") + path; // build path correctly

            // Stop at root - check parent, not name
            if (node.parent === null && node.name === "/") break; // Reached root
            node = node.parent;
        }
        // Ensure leading slash if it wasn't the root itself
        if (path !== "/" && !path.startsWith("/")) {
            path = "/" + path;
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
