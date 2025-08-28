/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: filesystem.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of a Filesystem.
==================================================================================================*/

import { FilesystemErrors } from "../util/error_messages.js";
import { OutputLine } from "../util/output-line.js";
import { FSNode } from "./fs-node.js";
import { FSUtil } from "./fs-util.js";

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
 **************************************************************************************************/
/**
 * @class Filesystem
 * @brief Manages the virtual file system structure and operations
 */
export class Filesystem {

    /**
     * @brief Constructor - initializes the filesystem with test data
     * @param {string} initialDirectory - optional starting directory (unused in current implementation)
     */
    constructor() {
        const { root, home, cwd } = this.createTestFilesystem();
        this.root = root;
        this.home = home;
        this.cwd = cwd; // TODO: Disconnect cwd from filesystem, and connect it to terminal class (mind cd command)

        if (!this.root || !this.home || !this.cwd) {
            throw new Error("Failed to initialize special node");
        }
    }

    /*  Path Traversal
     **********************************************************************************************/
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
        const { 
            createIntermediary = false, 
            targetMustExist = false 
        } = options;

        const errors = []; // Container for errors during path resolution

        // Add cwd to front of path if necessary
        if (!path.startsWith('~') && !path.startsWith('/')) {
            path = this.cwd.getFilePath() + path;
        }

        // Prepare path
        const tokens = FSUtil.tokenizePath(path);
        if (!tokens) {
            throw new Error("Bad path tokenization during path resolution");
        }

        // Handle special cases in path
        const pathParts = FSUtil.proccessSpecialCases(tokens);
        if (!pathParts) {
            throw new Error("Bad special case processing during path resolution");
        }

        // Handle root special case
        if (pathParts.length === 1 && pathParts[0] === '/') {
            return {
                status: RESOLUTION.FOUND,
                targetNode: this.root,
                parentNode: null,
                targetName: this.root.getFullName(),
                errors
            }
        }

        // Determine starting point
        let cursor = this.root;
        pathParts.shift(); // remove '/' from the start

        // Iterate through each token of the path
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];

            // Either scope into existing directory, create it, or produce error
            let child = cursor.getChild(part);
            if (child) {
                if (!child.isDirectory) { // We cant scope into a non-directory, return error
                    errors.push({ type: "error", content: FilesystemErrors.NOT_A_DIRECTORY(part) });
                    return {
                        status: RESOLUTION.NOT_A_DIRECTORY,
                        targetNode: child,
                        parentNode: cursor,
                        targetName: part,
                        errors,
                    };
                }
            } else if (createIntermediary) {
                // We've been instructed to create nonexisting intermediary directories
                const newDir = new FSNode(part, "dir");
                cursor.addChild(newDir);
                child = newDir;
            } else {
                // Child wasnt found, and not specified to make intermediary, return error
                errors.push({ type: "error", content: FilesystemErrors.PATH_NOT_FOUND(part) });
                return {
                    status: RESOLUTION.NOT_FOUND,
                    targetNode: undefined,
                    parentNode: cursor,
                    targetName: part,
                    errors,
                };
            }

            // Move into next directory
            cursor = child;
        }

        // Handle last token 
        const targetName = pathParts[pathParts.length-1];
        const parentNode = cursor;
        const targetNode = parentNode.getChild(targetName);

        // If target doesn't exist, update status, and produce an error if requested
        let status = RESOLUTION.FOUND;
        if (!targetNode) {
            status = RESOLUTION.PARENT_FOUND_TARGET_MISSING
            if (targetMustExist) {
                errors.push({ type: "error", content: FilesystemErrors.PATH_NOT_FOUND(targetName) });
            }
        }

        // Package results
        const returnPackage = { // we currently bundle this for easy debug printing before return
            status,
            targetNode,
            parentNode,
            targetName,
            errors,
        }
        return returnPackage;
    }

    /**
     * @brief Navigates to an absolute or relative path
     * @param {string} path - Path to directory to navigate to
     * @return {Object} Status object with success flag and info message
     */
    navigateTo(path) {
        if (path === null) {
            throw new Error('Null path provided to filesystem navigation function');
        }

        if (path.length === 0) {
            throw new Error('Empty path provided to filesystem navigation function');
        }

        // Attempt to resolve path
        const {
            status,
            targetNode,
            parentNode,
            targetName,
            errors
        } = this.resolvePath(path, {
            createIntermediary: false,
            targetMustExist: true
        })

        // Update target directory
        if (status === RESOLUTION.FOUND) {
            this.cwd = targetNode;
        }
        
        // Return status
        return {
            success: (status === RESOLUTION.FOUND),
            errors
        };
    }

    /*  Node State Modification
     **********************************************************************************************/
    /**
     * @brief Deletes a node from the filesystem.
     * @param {FSNode} node - Node to delete.
     * @param {Object} options - Options for deletion.
     * @param {boolean} options.recursive - If true, delete all children of the node.
     * @return {boolean} True if deletion was successful, false otherwise.
     */
    deleteNode(node, { recursive } = {}) {
        if (!node) {
            return false;
        }

        if (node === this.root) {
            return false;
        }

        if (node.isDirectory && node.children.size > 0) {
            if (recursive) {
                // Delete all children of node
                for (const child of node.children) {
                    this.deleteNode(child, { recursive: true }); 
                }
            } else {
                // Fail to delete
                return false;
            }
        }

        // Remove the file/directory
        try { node.parent.removeChild(node.getFullName()); }
        catch (failedRemoveError) { return false; }

        return true;
    }

    /*  Printing
     **********************************************************************************************/
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
     **********************************************************************************************/
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
