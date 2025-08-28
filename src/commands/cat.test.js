import { CatCommand } from "./cat.js";
import { CommandErrors, FilesystemErrors, FSNodeErrors } from "../util/error_messages.js";
import { Filesystem } from "../fs-management/filesystem.js";
import { OutputLine } from "../util/output-line.js";

describe('CatCommand', () => {
    const filesystem = new Filesystem();
    const root = filesystem.root;
    const home = filesystem.home;

    const catCommand = new CatCommand({ filesystem });

    describe('execute', () => {
        it('should handle no target', () => {
            const inputSwitches = [];
            const inputParams = [];

            const expected = {
                type: "output",
                lines: [
                    OutputLine.error(CommandErrors.TOO_FEW_ARGS),
                    OutputLine.hint(`usage: ${CatCommand.usage}`)
                ]
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });

        it('should handle an existing file', () => {
            const inputSwitches = [];
            const inputParams = ["~/Documents/resume.txt"];

            // Hold onto node references of each target to be output
            const target = home.children.get("Documents").children.get("resume.txt");

            const expected = {
                type: "output",
                lines: [
                    OutputLine.general(target.getContent())
                ]
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });

        it('should error on a nonexistent file', () => {
            const inputSwitches = [];
            const inputParams = ["~/Documents/fake.txt"];

            const expected = {
                type: "output",
                lines: [
                    OutputLine.error(FilesystemErrors.PATH_NOT_FOUND("fake.txt"))
                ]
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });

        it('should error on an existing directory', () => {
            const inputSwitches = [];
            const inputParams = ["~/Documents"];

            const expected = {
                type: "output",
                lines: [
                    OutputLine.error(FSNodeErrors.NON_FILE_CONTENT_RETRIEVAL("Documents"))
                ]
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });

        it('should error on a nonexistent directory', () => {
            const inputSwitches = [];
            const inputParams = ["~/fake_dir"];

            const expected = {
                type: "output",
                lines: [
                    OutputLine.error(FilesystemErrors.PATH_NOT_FOUND("fake_dir"))
                ]
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });

        it('should handle multiple existing files', () => {
            const inputSwitches = [];
            const inputParams = ["~/Documents/resume.txt", "~/Documents/notes.txt"];

            // Hold onto node references of each target to be output
            const targets = [];
            targets.push(home.children.get("Documents").children.get("resume.txt"));
            targets.push(home.children.get("Documents").children.get("notes.txt"));

            // Get content of each file
            const lines = [];
            for (const target of targets) {
                lines.push(OutputLine.general(target.getContent()));
            }

            const expected = {
                type: "output",
                lines
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });

        it('should handle multiple files with one nonexistent', () => {
            const inputSwitches = [];
            const inputParams = [
                "~/Documents/resume.txt", 
                "~/Documents/notes.txt",
                "~/Documents/fake.json",
            ];

            // Hold onto node references of each target to be output
            const targets = [];
            targets.push(home.children.get("Documents").children.get("resume.txt"));
            targets.push(home.children.get("Documents").children.get("notes.txt"));

            // Get content of each file
            const lines = [];
            for (const target of targets) {
                lines.push(OutputLine.general(target.getContent()));
            }

            // Manually add the error for the invalid path
            lines.push(OutputLine.error(FilesystemErrors.PATH_NOT_FOUND("fake.json")))

            const expected = {
                type: "output",
                lines
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });

        it('should error on multiple directories', () => {
            const inputSwitches = [];
            const inputParams = [
                "~/Documents", 
                "~/Downloads",
            ];

            // Hold onto node references of each target to be output
            const targets = [];
            targets.push(home.children.get("Documents"));
            targets.push(home.children.get("Downloads"));

            // Get content of each file
            const lines = [];
            for (const target of targets) {
                lines.push(
                    OutputLine.error(
                        FSNodeErrors.NON_FILE_CONTENT_RETRIEVAL(target.getFullName())
                    )
                );
            }

            const expected = {
                type: "output",
                lines
            }

            const result = catCommand.execute(inputSwitches, inputParams);
            expect(result.type).toEqual(expected.type);
            expect(result.lines).toEqual(expected.lines);
        });
    });
});