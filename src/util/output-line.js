/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: output-line.js
* @date: 04/6/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: Contains inmplementation of the interpreter's tree command
==================================================================================================*/

/*  Class Definition
 **************************************************************************************************/
export class OutputLine {
    constructor(type, content) {
        this.type = type;
        this.spans = [];
        if (type && content) this.addSpan(type, content);
    }

    // TODO: add output line method for returning colors

    static error(content) {
        return new OutputLine("error", content);
    }

    static hint(content) {
        return new OutputLine("hint", content);
    }

    static general(content) {
        return new OutputLine("general", content);
    }

    addSpan(type, content) {
        this.spans.push({ type, content });
    }
}
