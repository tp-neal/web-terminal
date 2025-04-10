/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: file-util.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains helper functions for manipulating file/directory names as well as paths.
==================================================================================================*/

/*  FSUtil Class Definition
***************************************************************************************************/
export class FSUtil {

    /**
     * @brief Trims the file extension from a file name if it is found.
     * @param {string} name - Name to be trimmed.
     * @returns - Trimmed name if extension was found, otherwise, returns the name provided.
     */
    static trimExtension(name) {
        if (!name) {
            console.error('Null name provided to trimExtension()');
            return null;
        }

        const lastDot = name.lastIndexOf('.');

        // If the last dot is not the hidden file character, remove the extension
        if (lastDot > 0) {
            const nameParts = name.split('.').filter((str) => str.length > 0);
            return {
                name: nameParts[0],
                extension: (nameParts.length > 1) ? nameParts[1] : null
            }
        }

        // Return original name otherwise
        return {
            name
        }
    }

    /**
     * @brief Tokenizes a filepath, and returns an ordered list of directories in path.
     * @param {string} path Filepath to be tokenized.
     * @returns {string[]} Ordered array of directory names to get to file path.
     */
    static tokenizePath(path) {
        if (!path) {
            console.error('Null path provided to tokenizePath()');
            return null;
        }

        const tokens = path.split('/').filter(item => item !== '');
        for (const token of tokens) {
            if (token.type === 'dir' && !this.isValidDirectoryName(token)) {
                return null;
            } else {
                if (!this.isValidFileName(token)) {
                    return null;
                }
            }
        }

        return tokens
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
            reasons: null
        }
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
            reasons: null
        }
    }
}