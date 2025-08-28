# Web-Based Terminal Emulator

A front-end, interactive terminal emulator created with vanilla JavaScript,
HTML, and CSS. This project simulates a Unix-like command-line interface in the
browser, complete with a virtual file system and a suite of standard commands.

![Screenshot of the Null-Terminal project](./tp-neal/web-terminal/web-terminal-39715d173bc6d57e61910f14403c72cd4fc42a70/assets/null-term.png)

---

## Features

* **Virtual File System:** A mock file system is created in memory on startup,
allowing for directory navigation and file manipulation.
* **Command History:** Navigate through previously entered commands using the
up and down arrow keys.
* **Standard Commands:** A variety of common Unix-like commands have been implemented.
* **Clean UI:** A simple, responsive terminal window built with modern CSS.
* **Zero Dependencies:** The project is written entirely in vanilla JavaScript
(ES6 Modules), HTML, and CSS, requiring no external libraries or build steps.

---

## Implemented Commands

The following commands are currently supported:

* `cat`: Display the contents of files.
* `cd`: Change the current working directory.
* `clear`: Clear all output from the terminal screen.
* `cp`: Copy files and directories.
* `echo`: Display a line of text.
* `ls`: List the contents of a directory.
* `mkdir`: Create a new directory.
* `mv`: Move or rename files and directories.
* `pwd`: Print the name of the current working directory.
* `rm`: Remove files and directories.
* `touch`: Create empty files.
* `tree`: Display the directory structure in a tree-like format.
* `todo`: Display the project's TODO list.

---

## Getting Started

To open the web-terminal simulator, simply click on the pages link on the right
side of this page.

If you would like to run it locally, you may do the following after downloading
the source code.

```bash
# Navigate to the source directory
cd tp-neal/web-terminal/web-terminal-39715d173bc6d57e61910f14403c72cd4fc42a70/src/

# Open the main HTML file
# (On macOS)
open index.html
# (On Windows)
start index.html
# (On Linux)
xdg-open index.html

## How It Works


