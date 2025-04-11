/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: command-registry.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of CommandRegistry class which is a registry of all commands that
          have been implemented for usage in the terminal. Acts as a hub for executing commands.
==================================================================================================*/

import { Filesystem } from "./file-system.js";
import { OutputLine } from "./output-line.js";
import { CatCommand } from "./commands/cat.js";
import { CdCommand } from "./commands/cd.js";
import { ClearCommand } from "./commands/clear.js";
import { CpCommand } from "./commands/cp.js";
import { EchoCommand } from "./commands/echo.js";
import { LsCommand } from "./commands/ls.js";
import { MkdirCommand } from "./commands/mkdir.js";
import { MvCommand } from "./commands/mv.js";
import { PwdCommand } from "./commands/pwd.js";
import { RmCommand } from "./commands/rm.js";
import { TodoCommand } from "./commands/todo.js";
import { TouchCommand } from "./commands/touch.js";
import { TreeCommand } from "./commands/tree.js";
import { ERROR_MESSAGES } from "./config.js";

/*  Class Definition
 ***************************************************************************************************/
/**
 * @class CommandRegistry
 * @brief Manages available terminal commands and their execution
 */
export class CommandRegistry {
    /**
     * @brief Creates a new command registry with specified commands
     * @param {Object} terminal Reference to the terminal instance
     * @param {Filesystem} filesystem Reference to the filesystem instance
     * @param {Object} supportedCommands Map of command names to command classes
     */
    constructor(terminal, filesystem) {
        this.terminal = terminal;
        this.filesystem = filesystem;
        this.commands = {
            cat: CatCommand,
            cd: CdCommand,
            clear: ClearCommand,
            cp: CpCommand,
            echo: EchoCommand,
            ls: LsCommand,
            mkdir: MkdirCommand,
            mv: MvCommand,
            pwd: PwdCommand,
            rm: RmCommand,
            todo: TodoCommand,
            touch: TouchCommand,
            tree: TreeCommand,
        };
    }

    /**
     * @brief Adds a command to the registry in the form { commandName: commandClass }
     * @param {string} commandName Name of the command to be added
     * @param {class} commandClass Pointer to the class definition the command name refers to
     */
    registerCommand(commandName, commandClass) {
        // Map the command name to its class definition
        this.commands[commandName] = commandClass;
    }

    /**
     * @brief Attempts to execute a command if it exists, and returns its result
     * @param {string} commandName Command to be executed
     * @param {string[]} args Tokenized arguments that follow the command
     * @return {Object} Result object with type and additional information
     */
    executeCommand(commandName, args) {
        let processedLines = [];

        // Check if command exists
        if (!this.commands[commandName]) {
            processedLines.push(
                new OutputLine("error", `voidsh: ${ERROR_MESSAGES.CMD_NOT_REGISTERED}`)
            );
            console.error(`Command '${commandName}' not registered in command regisrty`);
            return {
                type: "output",
                processedLines,
            };
        }

        // Create a data object with necessary dependencies for all commands
        const data = {
            filesystem: this.filesystem,
        };

        // Create instance of new command and invoke it
        const command = new this.commands[commandName](data);
        let { type, lines } = command.execute(args);

        // If there are error lines to be output, format them with the command name
        if (lines && lines.length > 0) {
            for (const line of lines) {
                for (const span of line.spans) {
                    if (span.type === "error") {
                        span.content = `${commandName}: ${span.content}`;
                    }

                    if (span.type === "hint") {
                        span.content = `hint: ${span.content}`;
                    }
                }
                processedLines.push(line);
            }
        }

        return {
            type,
            processedLines,
        };
    }
}
