/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: filesystem.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of a Filesystem.
==================================================================================================*/

import { OutputLine } from "../util/output-line.js";
import { FSNode } from "./fs-node.js";
import { FSUtil } from "./fs-util.js";
import { ERROR_MESSAGES } from "../config.js";

export const RESOLUTION = {
    FOUND: "FOUND",
    NOT_FOUND: "NOT_FOUND", // Target or intermediate path doesn't exist
    PARENT_FOUND_TARGET_MISSING: "PARENT_FOUND_TARGET_MISSING", // Parent exists, final component doesn't
    TARGET_FOUND_TYPE_MISMATCH: "TARGET_FOUND_TYPE_MISMATCH", // Target exists, but type doesn't match
    NOT_A_DIRECTORY: "NOT_A_DIRECTORY", // Intermediate path component is not a directory
    INVALID_PATH: "INVALID_PATH", // Path string itself is malformed
    PERMISSION_DENIED: "PERMISSION_DENIED", // Future use for permissions
    ERROR: "ERROR", // Generic error
};

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
        const { root, home, cwd } = this.createTestFilesystem();
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
        const { createIntermediary = false, targetMustHaveType = null } = options;

        // Create array for error messages
        const errors = [];

        // --- 1. Handle empty/root paths ---
        // Root Directory
        if (path === "/") {
            return {
                status: RESOLUTION.FOUND,
                targetNode: this.root,
                parentNode: null,
                targetName: "/",
                errors,
            };
        }

        // Substitute path of home directory for simplicity
        path = path.substring(path.indexOf("~")); // Since ~ is absolute, we ignore the prefix
        path = path.replace("~", this.home.getFilePath());

        // --- 2. Tokenize Path ---
        const pathParts = FSUtil.tokenizePath(path);
        // Check if tokenization returned null result
        if (pathParts === null) {
            errors.push({ type: "error", content: "Path tokenization returned null result" });
            return {
                status: RESOLUTION.INVALID_PATH,
                targetNode: null,
                parentNode: null,
                targetName: null,
                errors,
            };
        }

        // Check if tokenized path is empty
        if (pathParts.length === 0) {
            errors.push({ type: "error", content: "Path tokenization returned empty result" });
            return {
                status: RESOLUTION.INVALID_PATH,
                targetNode: null,
                parentNode: null,
                targetName: null,
                errors,
            };
        }

        // --- 3. Determine Start Node ---
        const firstChar = path[0];
        let cursor;
        if (firstChar === "/") {
            cursor = this.root; // the '/' was already filtered in tokenizePath
        } else if (firstChar === "~") {
            cursor = this.home;
            pathParts.shift(); // remove '~' from the path parts
        } else {
            cursor = this.cwd;
        }

        // --- 4. Iterate Through Tokens Until Last ---
        let n = pathParts.length;
        for (let i = 0; i < n - 1; i++) {
            const part = pathParts[i];

            // If part is '.', stay in the same directory
            if (part === ".") {
                continue;
            }

            // If part is '..', move up to parent directory if it exists
            if (part === "..") {
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
                    errors.push({ type: "error", content: ERROR_MESSAGES.NOT_A_DIRECTORY(part) });
                    return {
                        status: RESOLUTION.NOT_A_DIRECTORY,
                        targetNode: null,
                        parentNode: cursor,
                        targetName: part,
                        errors,
                    };
                }

                // If current director doesnt contain child, and createIntermediary is true, create the
                // new dierctory, and move the cursor to it
            } else if (createIntermediary) {
                const newDir = new FSNode(part, "dir");
                cursor.addChild(newDir);

                // Return error if the cursor doesnt have the child, and createIntermediary is false
            } else {
                errors.push({ type: "error", content: ERROR_MESSAGES.PATH_NOT_FOUND(part) });
                return {
                    status: RESOLUTION.NOT_FOUND,
                    targetNode: null,
                    parentNode: cursor,
                    targetName: part,
                    errors,
                };
            }

            // Directory exists, move to it
            cursor = cursor.getChild(part);
        }

        // Store the targetName so we can change it if the last part is a special case
        let targetName = pathParts[n - 1];

        // If part is '.', stay in the same directory
        if (targetName === ".") {
            targetName = cursor.name;
        }

        // If part is '..', move up to parent directory if it exists
        if (targetName === "..") {
            if (cursor.parent) {
                cursor = cursor.parent;
            }
            targetName = cursor.name;
        }

        if (targetName === "/") {
            return {
                status: RESOLUTION.FOUND,
                targetNode: this.root,
                parentNode: null,
                targetName: this.root.name,
                errors,
            };
        }

        // --- 5. Check Last Token ---
        const targetExists = cursor.hasChild(targetName);
        const targetMatchingTypeExists = cursor.hasChild(targetName, targetMustHaveType);
        const targetNode = cursor.getChild(
            targetName,
            targetMustHaveType ? targetMustHaveType : null
        );
        const parentNode = cursor;
        let status = null;

        // Check if target node withthout specified type exists
        if (targetExists) {
            // If target doesnt match type, and type is specified, return error
            if (!targetMatchingTypeExists && targetMustHaveType) {
                errors.push({ type: "error", content: ERROR_MESSAGES.PATH_NOT_FOUND(targetName) });
                return {
                    status: RESOLUTION.TARGET_FOUND_TYPE_MISMATCH,
                    targetNode,
                    parentNode,
                    targetName,
                    errors,
                };
            }

            // Target doesn't exist, update status
        } else {
            status = RESOLUTION.PARENT_FOUND_TARGET_MISSING;
            errors.push({ type: "error", content: ERROR_MESSAGES.PATH_NOT_FOUND(targetName) });
        }

        // --- 6. Return Result ---
        return {
            // If status wasn't already previously set to PARENT_FOUND_TARGET_MISSING, set it to FOUND
            status: status ? status : RESOLUTION.FOUND,
            targetNode,
            parentNode,
            targetName,
            errors,
        };
    }

    /**
     * @brief Navigates to an absolute or relative path
     * @param {string} path - Path to directory to navigate to
     * @return {Object} Status object with success flag and info message
     */
    navigateTo(path) {
        // Root directory navigation
        if (path === "/") {
            this.cwd = this.root;
            return { success: true };
        }

        // Substitute path of home directory for simplicity
        path = path.replace("~", this.home.getFilePath());

        // Tokenize filepath
        const isAbsolute = path[0] === "/";
        const folders = path.split("/").filter((item) => item !== "");
        let cursor = isAbsolute ? this.root : this.cwd;

        // Iterate through directories
        for (const directory of folders) {
            if (directory === ".") {
                continue;
            } else if (directory === "..") {
                if (cursor.parent) cursor = cursor.parent;
            } else {
                if (!cursor.hasChild(directory, "dir")) {
                    return {
                        success: false,
                        errorInfo: ERROR_MESSAGES.PATH_NOT_FOUND(directory),
                    };
                }
                cursor = cursor.getChild(directory);
            }
        }
        // Update current working directory
        this.cwd = cursor;

        return {
            success: true,
        };
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
        if (!node) return false;

        // If recuresive deletion, check if node is directory and has children
        if (recursive) {
            if (node.isDirectory && node.children) {
                for (const child of node.children) {
                    // Delete all children of node
                    this.deleteNode(child, { recursive: true });
                }
            }
        }

        if (node.parent) node.parent.removeChild(node.getFullName());

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
            for (const [childName, childNode] of node.children) {
                copy.addChild(this.copyNode(childNode));
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
        let outputString = "";
        const outputLine = new OutputLine();

        // 1. Determine connector for node
        const connector = isLast ? "└── " : "├── ";

        // 2. Construct line for this node
        let prefixSpan = null;
        if (node !== this.cwd) {
            outputString += currentPrefix + connector;
            prefixSpan = { type: "general", content: outputString };
        }
        outputString += node.getFullName() + "\n";
        const nodeNameSpan = {
            type: node.isDirectory ? "directory" : "file",
            content: node.getFullName(),
        };

        // Add line to lines for output
        if (prefixSpan) outputLine.addSpan(prefixSpan.type, prefixSpan.content);
        outputLine.addSpan(nodeNameSpan.type, nodeNameSpan.content);
        lines.push(outputLine);

        // 3. If it's a directory, process children
        if (node.isDirectory && node.children) {
            // 4. Calculate the prefix for the children
            let prefixForChildren = "";
            if (node !== this.cwd) prefixForChildren = currentPrefix + (isLast ? "    " : "│   ");

            let count = 0;
            const numChildren = node.children.size; // Get size once

            // Iterate over the Map's [key, value] pairs
            for (const [childName, childNode] of node.children) {
                const childIsLast = count === numChildren - 1;

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
        let root = new FSNode("/", "dir");
        let home = new FSNode("home", "dir");
        let usr = new FSNode("usr", "dir");
        let etc = new FSNode("etc", "dir");
        let vars = new FSNode("var", "dir");
        let tmp = new FSNode("tmp", "dir");

        // Add root level directories
        root.addChild(home);
        root.addChild(usr);
        root.addChild(etc);
        root.addChild(vars);
        root.addChild(tmp);

        // Home directory structure
        let userDir = new FSNode("user", "dir");
        home.addChild(userDir);

        // User's personal directories
        let documents = new FSNode("Documents", "dir");
        let pictures = new FSNode("Pictures", "dir");
        let downloads = new FSNode("Downloads", "dir");
        let desktop = new FSNode("Desktop", "dir");
        userDir.addChild(documents);
        userDir.addChild(pictures);
        userDir.addChild(downloads);
        userDir.addChild(desktop);

        // Some hidden configuration files with content
        let bashrcContent =
            `# .bashrc\n\n# Source global definitions\nif [ -f /etc/bashrc ]; ` +
            `then\n\t. /etc/bashrc\nfi\n\n# User specific aliases and functions\nalias ll='ls -alF'\n` +
            `alias la='ls -A'\nalias l='ls -CF'\n`;
        let bashrc = new FSNode(".bashrc", "txt", bashrcContent);
        let gitconfigContent =
            `[user]\n\tname = Tyler Neal\n\temail = example@example.com\n` +
            `[alias]\n\tst = status\n\tco = checkout\n\tbr = branch\n`;
        let gitconfig = new FSNode(".gitconfig", "txt", gitconfigContent);
        userDir.addChild(bashrc);
        userDir.addChild(gitconfig);

        // Document files with content
        let resumeContent =
            "Objective: To obtain a challenging position...\n\nExperience:\n...\n" +
            "\nSkills:\n...";
        let resume = new FSNode("resume", "txt", resumeContent);
        let notesContent =
            "Meeting Notes - April 8, 2025\n- Discuss project timeline\n- Assign " +
            "action items\n- Next meeting scheduled for Friday";
        let notes = new FSNode("notes", "txt", notesContent);
        let projectIdeasContent = "1. Web Terminal\n2. Task Manager\n3. Recipe App";
        let projectIdeas = new FSNode("project_ideas", "txt", projectIdeasContent);

        documents.addChild(resume);
        documents.addChild(notes);
        documents.addChild(projectIdeas); // Renamed 'project' to 'project_ideas' for clarity

        // Project directory
        let projectDir = new FSNode("project_files", "dir");
        documents.addChild(projectDir);
        let readmeContent =
            "# Project Files\n\nThis directory contains files related to the " +
            "project.\n- README.md: This file\n- config.json: Configuration " +
            "settings";
        let readme = new FSNode("README", "md", readmeContent); // Changed type to 'md'
        let configContent =
            `{ \n  \"setting1\": \"value1\",\n  \"enabled\": true,\n  \"port\": ` + `8080\n}`;
        let config = new FSNode("config", "json", configContent); // Changed type to 'json'
        projectDir.addChild(readme);
        projectDir.addChild(config);

        // Pictures with image files (content usually binary, so adding descriptive text)
        let picturesDir = new FSNode("Photos", "dir"); // Changed name for clarity
        pictures.addChild(picturesDir);
        let vacation = new FSNode("vacation", "dir");
        picturesDir.addChild(vacation);
        let photo1 = new FSNode("beach", "jpg", "[Simulated JPEG data for beach photo]");
        let photo2 = new FSNode("mountains", "jpg", "[Simulated JPEG data for mountain photo]");
        let photo3 = new FSNode("sunset", "png", "[Simulated PNG data for sunset photo]");
        vacation.addChild(photo1);
        vacation.addChild(photo2);
        vacation.addChild(photo3);

        // Screenshots directory
        let screenshots = new FSNode("screenshots", "dir");
        picturesDir.addChild(screenshots); // Added under the new 'Photos' dir
        let screen1 = new FSNode("screenshot1", "png", "[Simulated PNG data for screenshot 1]");
        let screen2 = new FSNode("screenshot2", "png", "[Simulated PNG data for screenshot 2]");
        screenshots.addChild(screen1);
        screenshots.addChild(screen2);

        // Downloads with mixed content
        let installer = new FSNode("app_installer", "exe", "[Simulated executable data]");
        let wallpaper = new FSNode("wallpaper", "jpg", "[Simulated JPEG data for wallpaper]");
        downloads.addChild(installer);
        downloads.addChild(wallpaper);

        // Desktop items
        let shortcutInfo = "[InternetShortcut]\nURL=http://example.com/";
        let shortcut = new FSNode("shortcut_to_example", "url", shortcutInfo);
        let presentation = new FSNode("presentation_draft", "pptx", "[Simulated PowerPoint data]");
        desktop.addChild(shortcut);
        desktop.addChild(presentation);

        // System directories and files
        let bin = new FSNode("bin", "dir");
        usr.addChild(bin);
        let systemConfigContent = "# System Configuration\ndaemon_enabled=true\nlog_level=INFO";
        let systemConfig = new FSNode("system", "conf", systemConfigContent);
        etc.addChild(systemConfig);
        let logs = new FSNode("logs", "dir");
        vars.addChild(logs);
        let appLog = new FSNode(
            "app",
            "log",
            "INFO: Application started.\nWARN: Cache cleared.\n" + "ERROR: Connection refused."
        );
        logs.addChild(appLog);
        let tempFileContent = "Temporary data generated at " + new Date().toISOString();
        let tempFile = new FSNode("temp_file_123", "tmp", tempFileContent);
        tmp.addChild(tempFile);

        return {
            root: root,
            home: userDir,
            cwd: userDir,
        };
    }
}
