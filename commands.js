
/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: commands.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
*
    We start by assuming there is a terminal list in the HTML file. We retrieve this dom element,
    as we will add individual list elements and the command line.
*
==================================================================================================*/

/*==================================================================================================
    CommandRegistry Class
==================================================================================================*/
export class CommandRegistry {
    constructor(terminal, supported_commands) {
        this.terminal = terminal;
        this.commands ={};

        Object.entries(supported_commands).forEach(([commandName, commandClass]) => {
            this.register(commandName, commandClass);
        });
    }

    register(commandName, commandClass) {
        this.commands[commandName] = commandClass;
    }

    execute(commandName, args) {
        if (this.commands[commandName]) {
            const cmd = new this.commands[commandName](this.terminal);
            return cmd.execute(args);
        } else {
            console.error(`Command '${commandName}' not registered.`);
        }
    }
}

/*==================================================================================================
    Generic Command Class
==================================================================================================*/
export class Command {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        throw new Error("Command must be implemented");
    }

    help() {
        return "No help available.";
    }
}

/*==================================================================================================
    Command Classes Sorted Alphabetically
==================================================================================================*/
export class ClearCommand extends Command {
    execute(args) {
        if (this.terminal.terminalDisplay) {
            this.terminal.terminalDisplay.innerHTML = '';
            this.terminal.createNewCommandLine();
            return true;
        }
        return false;
    }

    help() {
        return "'clear' - clears the terminal display.";
    }
}

export class EchoCommand extends Command {
    execute(args) {
        this.terminal.addLineToTerminal('output', null, (args || ''));
    }

    help() {
        return "'echo' - prints a message to the terminal.";
    }
}