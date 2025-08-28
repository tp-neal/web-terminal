import { Filesystem, RESOLUTION } from "./filesystem.js";

describe('Filesystem', () => {
    let filesystem;
    let root;
    let home;

    beforeEach(() => {
        filesystem = new Filesystem();
        root = filesystem.root;
        home = filesystem.home;
    });

    describe('resolvePath', () => {
        it('should handle root directory', () => {
            const inputPath = "/"
            const inputOptions = {};

            const node = root; // Get ref. to targeted node ("/")
            const parent = node.parent; // Get ref. to target's parent (null)
            const fullname = "/";

            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            }

            const result = filesystem.resolvePath(inputPath, inputOptions);

            // Using toEqual for status, targetName. Using toBe for node references.
            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle home acronym', () => {
            const inputPath = "~"
            const inputOptions = {};

            const node = home; // Get ref. to targeted node ("user")
            const parent = node.parent; // Get ref. to target's parent ("home")
            const fullname = "user";
            
            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            }

            const result = filesystem.resolvePath(inputPath, inputOptions);

            // Using toEqual for status, targetName. Using toBe for node references.
            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle basic path', () => {
            const inputPath = "/home/user/Documents"
            const inputOptions = {};

            const node = home.children.get("Documents"); // Get ref. to targeted node ("Documents")
            const parent = node.parent; // Get ref. to target's parent ("user")
            const fullname = "Documents";
            
            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            }

            const result = filesystem.resolvePath(inputPath, inputOptions);

            // Using toEqual for status, targetName. Using toBe for node references.
            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle nonexistent destinations', () => {
            const inputPath = "/home/user/fake_dir"
            const inputOptions = {};

            const node = undefined; // Get ref. to targeted node (undefined)
            const parent = home; // Get ref. to target's parent ("user")
            const fullname = "fake_dir";
            
            const expected = {
                status: RESOLUTION.PARENT_FOUND_TARGET_MISSING,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            }

            const result = filesystem.resolvePath(inputPath, inputOptions);

            // Using toEqual for status, targetName. Using toBe for node references.
            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle nonexistent intermediary paths', () => {
            const inputPath = "/home/fake_dir/user"
            const inputOptions = {};

            const node = undefined; // Get ref. to targeted node (undefined)
            const parent = root.children.get("home"); // Get ref. to target's parent ("user")
            const fullname = "fake_dir";
            
            const expected = {
                status: RESOLUTION.NOT_FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            }

            const result = filesystem.resolvePath(inputPath, inputOptions);

            // Using toEqual for status, targetName, errors. Using toBe for node references.
            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle file destinations', () => {
            const inputPath = "~/Documents/resume.txt";
            const inputOptions = {};

            const parentNode = home.children.get("Documents");
            const node = parentNode.children.get("resume.txt");
            const fullname = "resume.txt";

            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parentNode,
                targetName: fullname,
            };

            const result = filesystem.resolvePath(inputPath, inputOptions);

            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle file intermediary paths', () => {
            const inputPath = "~/Documents/resume.txt/fake_dir";
            const inputOptions = {};

            const parentNode = home.children.get("Documents");
            const fileNode = parentNode.children.get("resume.txt");
            const fullname = "resume.txt";

            const expected = {
                status: RESOLUTION.NOT_A_DIRECTORY,
                targetNode: fileNode,
                parentNode: parentNode,
                targetName: fullname,
            };

            const result = filesystem.resolvePath(inputPath, inputOptions);

            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle special cwd string \'.\'', () => {
            const inputPath = "~/.";
            const inputOptions = {};

            const node = home;
            const parent = node.parent;
            const fullname = "user";

            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            };

            const result = filesystem.resolvePath(inputPath, inputOptions);

            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle special parent string \'..\'', () => {
            const inputPath = "~/..";
            const inputOptions = {};

            const node = home.parent;
            const parent = node.parent;
            const fullname = "home";

            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            };

            const result = filesystem.resolvePath(inputPath, inputOptions);

            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle relative paths', () => {
            filesystem.cwd = home; // Setting CWD is necessary setup here
            const inputPath = "Documents/project_files";
            const inputOptions = {};

            const parentNode = home.children.get("Documents");
            const node = parentNode.children.get("project_files");
            const fullname = "project_files";

            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parentNode,
                targetName: fullname,
            };

            const result = filesystem.resolvePath(inputPath, inputOptions);

            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle multiple special characters', () => {
            filesystem.cwd = home; // Setting CWD is necessary setup here
            const inputPath = "Documents/././../..";
            const inputOptions = {};

            const node = home.parent;
            const parent = node.parent;
            const fullname = "home";

            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            };

            const result = filesystem.resolvePath(inputPath, inputOptions);

            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });

        it('should handle navigation upwards of root', () => {
            const inputPath = "/..";
            const inputOptions = {};

            const node = root;
            const parent = null;
            const fullname = "/";

            const expected = {
                status: RESOLUTION.FOUND,
                targetNode: node,
                parentNode: parent,
                targetName: fullname,
            };

            const result = filesystem.resolvePath(inputPath, inputOptions);

            expect(result.status).toEqual(expected.status);
            expect(result.targetNode).toBe(expected.targetNode);
            expect(result.parentNode).toBe(expected.parentNode);
            expect(result.targetName).toEqual(expected.targetName);
        });
    });

    describe('deleteNode', () => {
        it('should handle files', () => {
            const parent = home.children.get("Documents");
            const target = parent.children.get("resume.txt");
            const options = { recursive: false };

            filesystem.deleteNode(target, options);

            const parentHasChild = !!parent.children.get("resume.txt");
            expect(parentHasChild).toEqual(false);
        });

        it('should handle empty directories', () => {
            const parent = root.children.get("usr");
            const target = parent.children.get("bin");
            const options = { recursive: false };

            filesystem.deleteNode(target, options);

            const parentHasChild = !!parent.children.get("bin");
            expect(parentHasChild).toEqual(false);
        });

        it('should handle non-recursive deletion of non-empty directories', () => {
            const parent = root
            const target = parent.children.get("var");
            const options = { recursive: false };

            filesystem.deleteNode(target, options);

            const parentHasChild = !!parent.children.get("var");
            expect(parentHasChild).toEqual(true);
        });

        it('should handle recursive deletion of non-empty directories', () => {
            const parent = root
            const target = parent.children.get("var");
            const options = { recursive: true };

            filesystem.deleteNode(target, options);

            const parentHasChild = !!parent.children.get("var");
            expect(parentHasChild).toEqual(false);
        });

        it('should handle root protection', () => {
            const target = root;
            const options = { recursive: true };

            const deleteOccured = filesystem.deleteNode(target, options);

            expect(deleteOccured).toEqual(false);
        });
    });
})