/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: command-registry.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of CommandRegistry class which is a registry of all commands that
          have been implemented for usage in the terminal. Acts as a hub for executing commands.
==================================================================================================*/

import { ArgParser } from "../util/arg-parser.js";
import { Filesystem } from "../fs-management/filesystem.js";
import { OutputLine } from "../util/output-line.js";
import { CatCommand } from "../commands/cat.js";
import { CdCommand } from "../commands/cd.js";
import { ClearCommand } from "../commands/clear.js";
import { CpCommand } from "../commands/cp.js";
import { EchoCommand } from "../commands/echo.js";
import { HelpCommand } from "../commands/help.js";
import { LsCommand } from "../commands/ls.js";
import { MkdirCommand } from "../commands/mkdir.js";
import { MvCommand } from "../commands/mv.js";
import { PwdCommand } from "../commands/pwd.js";
import { RmCommand } from "../commands/rm.js";
import { TodoCommand } from "../commands/todo.js";
import { TouchCommand } from "../commands/touch.js";
import { TreeCommand } from "../commands/tree.js";
import { CommandErrors } from "../util/error_messages.js";

const supportedCommands = {
    cat: CatCommand,
    cd: CdCommand,
    clear: ClearCommand,
    cp: CpCommand,
    echo: EchoCommand,
    help: HelpCommand,
    ls: LsCommand,
    mkdir: MkdirCommand,
    mv: MvCommand,
    pwd: PwdCommand,
    rm: RmCommand,
    todo: TodoCommand,
    touch: TouchCommand,
    tree: TreeCommand,
};

/*  Class Definition
 **************************************************************************************************/
/**
 * @class CommandRegistry
 * @brief Manages available terminal commands and their execution
 */
export class CommandRegistry {

    /**
     * @brief Creates a new command registry with specified commands
     * @param {Terminal} terminal Reference to the terminal instance
     * @param {Filesystem} filesystem Reference to the filesystem instance
     */
    constructor(terminal, filesystem) {
        this.terminal = terminal;
        this.filesystem = filesystem;
        this.commands = supportedCommands;
    }

    /**
     * @brief Adds a command to the registry in the form { commandName: commandClass }
     * @param {string} commandName Name of the command to be added
     * @param {class} commandClass Pointer to the class definition the command name refers to
     */
    registerCommand(commandName, commandClass) {
        this.commands[commandName] = commandClass;
    }

    /**
     * @brief Attempts to execute a command if it exists, and returns its result
     * @param {string} commandName Command to be executed
     * @param {string[]} args Tokenized arguments that follow the command, default it to a new array
     * @return {Object} Result object with type and additional information
     */
    executeCommand(commandName, args = []) {
        let processedLines = [];

        if (!commandName) {
            throw new Error("Invalid command name passed to command-registry");
        }

        // Check command existance
        if (!this.commands[commandName]) {
            processedLines.push(
                OutputLine.error(`voidsh: ${CommandErrors.CMD_NOT_REGISTERED}`)
            );
            return {type: "output", processedLines };
        }

        // Parse arguments
        const { switches, params } = ArgParser.argumentSplitter(args);

        // Create object containing dependencies for commands - passed to command constructor
        const data = {
            filesystem: this.filesystem,
            commandRegistry: this
        };

        // Create instance of command
        const command = new this.commands[commandName](data);

        // Validate switches
        for (const switchName of switches) {
            // Here we use the constructor to check for switches, which inherets from Command if empty
            if (!command.constructor.supportedArgs.includes(switchName)) {
                lines.push(
                    OutputLine.error(CommandErrors.INVALID_SWITCH(commandName, switchName))
                );
                return { type: "output", lines };
            }
        }

        // Invoke command
        const { type, lines } = command.execute(switches, params);

        // Format returned errors for printing
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
