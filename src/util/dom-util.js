/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: dom-util.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains implementation of helper functions/classes for DOM HTML generation and key 
          combination protection.
==================================================================================================*/

import { ELEMENT_CLASSES } from "../config.js";

/*  Class Definition
 **************************************************************************************************/
export class DOMHelper {
    static createOutputLineElement(line) {
        // Create list element to hold new entry
        // Lines are of type output or error for easy retrieval. The list class does not affect styling.
        const li = document.createElement("li");
        li.className = `${ELEMENT_CLASSES.command_list_item}`;

        // Make a content span to hold all the lines
        const contentSpan = document.createElement("span");
        contentSpan.className = "line__content";
        li.appendChild(contentSpan);

        // This is where all typed content will be entered.
        // We will put seperate spans inside to control style.
        for (const lineSpan of line.spans) {
            // Prepare new span for formatting
            const span = document.createElement("span");

            if (lineSpan.type === "general") span.className = ELEMENT_CLASSES.general_text;
            else if (lineSpan.type === "error") span.className = ELEMENT_CLASSES.error_text;
            else if (lineSpan.type === "hint") span.className = ELEMENT_CLASSES.hint_text;
            else if (lineSpan.type === "directory") span.className = ELEMENT_CLASSES.directory_text;
            else if (lineSpan.type === "file") span.className = ELEMENT_CLASSES.file_text;

            span.textContent = lineSpan.content;
            contentSpan.appendChild(span);
        }

        return li;
    }
}

export function protectedKeyCombination(event) {
    // Developer Tools  ( F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C )
    if (
        event.key === "F12" ||
        (event.ctrlKey &&
            event.shiftKey &&
            (event.key === "I" || event.key === "J" || event.key === "C"))
    ) {
        return true;
    }

    // Common text operations ( Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+Y )
    if (event.ctrlKey && ["c", "v", "x", "z", "y"].includes(event.key.toLowerCase())) {
        return true;
    }

    // Navigation
    if (
        event.key === "Tab" ||
        event.key === "Escape" ||
        (event.ctrlKey && (event.key === "f" || event.key === "r")) ||
        (event.altKey && ["ArrowLeft", "ArrowRight"].includes(event.key))
    ) {
        return true;
    }

    // Tab management
    if (
        (event.ctrlKey && ["t", "w"].includes(event.key.toLowerCase())) ||
        (event.ctrlKey && event.key === "Tab")
    ) {
        return true;
    }

    return false;
}
