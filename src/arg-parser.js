/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: arg-parser.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of ArgParser, which is used to parse/divide command line input.
==================================================================================================*/

/*  Class Definition
***************************************************************************************************/
/**
 * @class ArgParser
 * @brief Utility class for parsing command arguments from string input
 */
export class ArgParser {

    /**
     * @brief Parses a command string into tokens, handling quotes and escaped characters
     * @param {string} string The raw input string to parse
     * @return {string[]} Array of parsed tokens with escaped characters processed
     */
    static parse(string) {
        // Regex to match tokens, accounting for:
        // - Quotes ("...", '...')
        // - Escaped characters (\, ", ')
        // - Spaces outside quotes
        const tokenRegex = /(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^\s]+))/g;
        
        const tokens = [];
        let match;

        while ((match = tokenRegex.exec(string)) !== null) {
            // Prefer double-quoted, then single-quoted, then unquoted matches
            const token = match[1] || match[2] || match[3];
            if (token !== undefined) {
                // Replace escaped quotes and spaces (e.g., \" → ", \  → space)
                tokens.push(token.replace(/\\(.)/g, '$1'));
            }
        }

        return tokens;
    }

    /**
     * @brief Splits command arguments into switches and remaining parameters
     * @param {string[]} args Array of command arguments
     * @return {Object} Object containing {switches: string[], : string[]}
     */
    static argumentSplitter(args) {
        let switches = [];
        let params = [];

        for (const arg of args) {
            if (arg[0] === '-') {
                if (arg.length >= 2 && arg[1] === '-')
                    switches.push(arg.slice(2));
                else
                    switches.push(arg.slice(1));
            } else {
                params.push(arg);
            }
        }

        return { switches, params };
    }
}
