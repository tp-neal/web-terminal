/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: file-util.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains helper functions for manipulating file/directory names as well as paths.
==================================================================================================*/

/*  FSUtil Class Definition
 **************************************************************************************************/
export class FSUtil {

    // TODO: Create instance based util class to allow different homedir / rootname
    static homePath = '/home/user';
    static rootName = '/';

    /**
     * @brief Trims the file extension from a file name if it is found.
     * @param {string} name - Name to be trimmed.
     * @returns - Trimmed name if extension was found, otherwise, returns the name provided.
     */
    static parseNameAndExtension(fullName) {
        if (!fullName) {
            console.error("Null name provided to trimExtension()");
            return null;
        }

        const tokenRegex = /^(\.)?([^.]+)(\.(.+))?$/;
        const match = fullName.match(tokenRegex);
        const tokens = {
            fullMatch: match[0], // The entire matched string
            leadingDot: match[1], // Group 1: '.' or undefined
            baseName: match[2], // Group 2: The part before the first extension dot
            extensionWithDot: match[3], // Group 3: The full extension part (e.g., '.txt', '.tar.gz') or undefined
            extension: match[4] // Group 4: The extension without the leading dot (e.g., 'txt', 'tar.gz') or undefined
        };

        let trimmedName = ((tokens.leadingDot) ? '.' : '') + tokens.baseName;
        const extension = tokens.extension;

        return {
            name: trimmedName,
            extension
        }
    }

    /**
     * @brief Tokenizes a filepath, and returns an ordered list of directories in path.
     * @param {string} path Filepath to be tokenized.
     * @returns {string[]} Ordered array of directory names to get to file path.
     */
    static tokenizePath(path) {
        if (path === null) {
            console.error("Null path provided to tokenizePath()");
            return null;
        }

        if (path.length === 0) {
            console.error("Empty path provided to tokenizePath()");
            return null;
        }

        // Substitute home directory
        path = path.replace("~", this.homePath);

        const tokens = path.split("/").filter((item) => item !== "");
        if (path.startsWith(this.rootName)) {
            tokens.unshift(this.rootName);
        }

        return tokens;
    }

    /**
     * @brief Takes an array of destinations in a filepath, and process special cases '.' and '..'
     * @param {string} path Filepath to be tokenized.
     * @returns {string[]} Ordered array of directory names to get to file path.
     */
    static proccessSpecialCases(tokens) {
        if (tokens === null) {
            console.error("Null path provided to tokenizePath()");
            return null;
        }

        if (tokens.length === 0) {
            console.error("Empty path provided to tokenizePath()");
            return null;
        }

        // Iterate cases
        let processedTokens = [];
        for (const part of tokens) {
            if (part === '.') {
                continue; // skip
            } else if (part === '..') {
                if (processedTokens.length > 1) {
                    processedTokens.pop();
                }
            } else {
                processedTokens.push(part);
            }
        }

        return processedTokens;
    }

    /**
     * @brief Converts home directory path to tilde notation
     * @param {string} path - Full path to convert
     * @return {string} Abbreviated path with ~ for home directory
     */
    static abbreviateHomeDir(path) {
        const homeNameLength = this.homePath.length;
        if (path.substring(0, homeNameLength) === this.homePath) {
            path = `~` + path.substring(homeNameLength);
        }
        return path;
    }

    /**
     * @brief Checks if a provided file name is valid.
     * @param {string} name - Name to be tested for validity.
     * @returns - True if valid, false otherwise.
     */
    static isValidFileName(name) {
        // TODO: Implement file name validation
        return {
            valid: true,
            reasons: null,
        };
    }

    /**
     * @brief Checks if a provided directory name is valid.
     * @param {string} name - Name to be tested for validity.
     * @returns - True if valid, false otherwise.
     */
    static isValidDirectoryName(name) {
        // TODO: Implement directory name validation
        return {
            valid: true,
            reasons: null,
        };
    }
}
