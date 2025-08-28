import { ArgParser } from './arg-parser.js'; // Adjust path if needed

describe('ArgParser', () => {
    describe('parse', () => {
        it('should parse simple commands', () => {
            const input = 'ls -a /home/user';
            const expected = ['ls', '-a', '/home/user'];
            expect(ArgParser.parse(input)).toEqual(expected);
        });

        it('should handle double quotes', () => {
            const input = 'echo "Hello World"';
            const expected = ['echo', 'Hello World'];
            expect(ArgParser.parse(input)).toEqual(expected);
        });

        it('should handle single quotes', () => {
            const input = "mkdir 'My Documents'";
            const expected = ['mkdir', 'My Documents'];
            expect(ArgParser.parse(input)).toEqual(expected);
        });

        it('should handle empty input', () => {
            const input = '';
            const expected = [];
            expect(ArgParser.parse(input)).toEqual(expected);
        });

        it('should handle input with only spaces', () => {
            const input = '   ';
            const expected = [];
            expect(ArgParser.parse(input)).toEqual(expected);
        });

        it('should handle escaped quotes within quotes', () => {
            const input = 'echo "A quote: \\""';
            const expected = ['echo', 'A quote: "'];
            expect(ArgParser.parse(input)).toEqual(expected);
        });
    });

    describe('argumentSplitter', () => {
        it('should separate switches and parameters', () => {
            const input = ['-r', '-f', 'source.txt', 'dest.txt'];
            const expected = { switches: ['r', 'f'], params: ['source.txt', 'dest.txt'] };
            expect(ArgParser.argumentSplitter(input)).toEqual(expected);
        });

        it('should handle only parameters', () => {
            const input = ['file1', 'file2'];
            const expected = { switches: [], params: ['file1', 'file2'] };
            expect(ArgParser.argumentSplitter(input)).toEqual(expected);
        });

         it('should handle only switches', () => {
            const input = ['-a', '-l', '-h'];
            const expected = { switches: ['a', 'l', 'h'], params: [] };
            expect(ArgParser.argumentSplitter(input)).toEqual(expected);
         });

         it('should handle mixed order', () => {
            const input = ['source', '-v', 'destination', '-f']; // Typically switches come first, but test robustness
            const expected = { switches: ['v', 'f'], params: ['source', 'destination'] };
             expect(ArgParser.argumentSplitter(input)).toEqual(expected);
         });

         it('should handle empty input array', () => {
            const input = [];
            const expected = { switches: [], params: [] };
            expect(ArgParser.argumentSplitter(input)).toEqual(expected);
         });
    });
});
