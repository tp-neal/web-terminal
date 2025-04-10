/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: testsuit.js
* @date: 04/3/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A class used for testing the functionality of each terminal command.
==================================================================================================*/

/*  Class Definition
***************************************************************************************************/
/**
 * @class TestSuite
 * @brief Runs a series of standard usage tests against the Terminal instance to ensure commands function correctly.
 */
export class TestSuite {
    /**
     * Initializes the test suite.
     * @param {Terminal} terminal - An instance of the Terminal class. Requires a 'run' method.
     */
    constructor(terminal) { 
        if (!terminal || typeof terminal.run !== 'function') {
            throw new Error("TestSuite requires a valid Terminal instance with a 'run' method.");
        }
        this.terminal = terminal;
        console.log("TestSuite Initialized. Preparing to run tests...");
    }

    /**
     * Helper method to execute a command, log information, and introduce a delay.
     * @param {string} command - The command string to execute.
     * @param {string} description - A clear description of what the test case is verifying.
     * @param {number} [delayMs=250] - Milliseconds to pause after running the command (allows UI updates).
     */
    async _runCommand(command, description = "", delayMs = 0) {
        console.log(`\n--- Testing: ${description} ---`);
        console.log(`COMMAND: ${command}`);

        // Directly call the terminal's run method to simulate user input
        this.terminal.run(command);

        // Wait for the specified delay if needed
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        console.log("--- Test Complete ---");
    }

    /**
     * @brief Tests the 'pwd' (print working directory) command.
     */
    async testPwd() {
        console.log("\n===== Testing PWD =====");
        // Test 1: Print the initial working directory (should be home: ~)
        await this._runCommand("pwd", "PWD Test 1: Print initial working directory");

        // Test 2: Change directory and print the new working directory
        await this._runCommand("cd Documents", "PWD Test 2 (Setup): Change directory to Documents");
        await this._runCommand("pwd", "PWD Test 2: Print working directory after changing to Documents");

        // Test 3: Change back to the parent directory and print
        await this._runCommand("cd ..", "PWD Test 3 (Setup): Change back to parent directory");
        await this._runCommand("pwd", "PWD Test 3: Print working directory after returning to parent");

        // Cleanup: Ensure we are back home for subsequent tests
        await this._runCommand("cd ~", "PWD Cleanup: Return to home directory");
        console.log("===== PWD Testing Finished =====");
    }

    /**
     * @brief Tests the 'ls' (list directory contents) command.
     */
    async testLs() {
        console.log("\n===== Testing LS =====");
        // Test 1: List the current directory (home)
        await this._runCommand("ls", "LS Test 1: List current directory (~/user)");

        // Test 2: List a specific subdirectory (Documents)
        await this._runCommand("ls Documents", "LS Test 2: List 'Documents' directory contents");

        // Test 3: List the root directory
        await this._runCommand("ls /", "LS Test 3: List root directory '/' contents");

        // Test 4: Attempt to list a non-existent directory (expect error)
        await this._runCommand("ls non_existent_dir", "LS Test 4: List non-existent directory (expect error)");

        // Test 5: Attempt to list a file (should show the file itself or produce an error)
        await this._runCommand("ls Documents/resume.txt", "LS Test 5: Attempt to list a file (expect file name or error)");
        console.log("===== LS Testing Finished =====");
    }

    /**
     * @brief Tests the 'cd' (change directory) command thoroughly.
     */
    async testCd() {
        console.log("\n===== Testing CD =====");
        // Initial state check
        await this._runCommand("pwd", "CD Test (Initial): Show directory before cd tests");

        // --- Relative Paths ---
        // Test 1: Change to an existing directory relative to current
        await this._runCommand("cd Documents", "CD Test 1: Change to 'Documents' (relative path)");
        await this._runCommand("pwd", "CD Test 1: Verify current directory is 'Documents'");

        // Test 2: Attempt to change to a non-existent directory relative to current
        await this._runCommand("cd non_existent_dir", "CD Test 2: Attempt cd to non-existent relative directory (expect error)");
        await this._runCommand("pwd", "CD Test 2: Verify directory remains 'Documents' after failed cd");

        // --- Absolute Paths ---
        // Test 3: Change to an existing directory using an absolute path
        await this._runCommand("cd /home/user/Pictures", "CD Test 3: Change to 'Pictures' (absolute path)");
        await this._runCommand("pwd", "CD Test 3: Verify current directory is 'Pictures'");

        // Test 4: Attempt to change to a non-existent directory using an absolute path
        await this._runCommand("cd /absolute/non_existent", "CD Test 4: Attempt cd to non-existent absolute directory (expect error)");
        await this._runCommand("pwd", "CD Test 4: Verify directory remains 'Pictures' after failed cd");

        // --- Special Paths ---
        // Test 5: Change to the parent directory using '..'
        await this._runCommand("cd ..", "CD Test 5: Change to parent directory using '..'");
        await this._runCommand("pwd", "CD Test 5: Verify current directory is parent (~/user)");

        // Test 6: Attempt to change to the parent of the root directory (should stay at root)
        await this._runCommand("cd /", "CD Test 6 (Setup): Go to root '/'");
        await this._runCommand("cd ..", "CD Test 6: Attempt change to parent of root using '..'");
        await this._runCommand("pwd", "CD Test 6: Verify directory remains '/'");

        // Test 7: Change to the current directory using '.' (should have no effect)
        await this._runCommand("cd .", "CD Test 7: Change to current directory using '.'");
        await this._runCommand("pwd", "CD Test 7: Verify directory remains '/'");

        // Test 8: Change to home directory using '~' shortcut
        await this._runCommand("cd ~", "CD Test 8: Change to home directory using '~'");
        await this._runCommand("pwd", "CD Test 8: Verify current directory is home (~/user)");

        // Test 9: Change to home directory using 'cd' with no arguments
        await this._runCommand("cd /", "CD Test 9 (Setup): Go to root '/'"); // Move away from home first
        await this._runCommand("cd", "CD Test 9: Change to home directory using empty 'cd'");
        await this._runCommand("pwd", "CD Test 9: Verify current directory is home (~/user)");

        // Cleanup: Ensure we are back home
        await this._runCommand("cd ~", "CD Cleanup: Ensure return to home directory");
        console.log("===== CD Testing Finished =====");
    }

    /**
     * @brief Tests the 'mkdir' (make directory) command.
     */
    async testMkdir() {
        console.log("\n===== Testing MKDIR =====");
        await this._runCommand("ls", "MKDIR Test (Initial): List contents before creating directories");

        // Test 1: Create a single directory
        await this._runCommand("mkdir test_dir_1", "MKDIR Test 1: Create a single directory 'test_dir_1'");
        await this._runCommand("ls", "MKDIR Test 1: Verify 'test_dir_1' creation");

        // Test 2: Attempt to create an already existing directory (expect error)
        await this._runCommand("mkdir test_dir_1", "MKDIR Test 2: Attempt to create existing directory 'test_dir_1' (expect error)");

        // Test 3: Create multiple directories at once
        await this._runCommand("mkdir test_dir_2 test_dir_3", "MKDIR Test 3: Create multiple directories 'test_dir_2' 'test_dir_3'");
        await this._runCommand("ls", "MKDIR Test 3: Verify 'test_dir_2' and 'test_dir_3' creation");

        // Test 4: Create nested directories using the '-p' flag (parents should be created)
        await this._runCommand("mkdir -p nested/dir/creation", "MKDIR Test 4: Create nested directories 'nested/dir/creation' with -p flag");
        await this._runCommand("ls nested/dir", "MKDIR Test 4: Verify nested directory 'creation' exists");

        // Test 5: Attempt to create nested directories without '-p' (expect error if parent doesn't exist)
        await this._runCommand("mkdir deep/nonexistent/path", "MKDIR Test 5: Attempt to create nested directories without -p (expect error)");

        // Cleanup: Remove all created directories (use rm -r for non-empty/nested ones)
        await this._runCommand("rm -r test_dir_1 test_dir_2 test_dir_3 nested", "MKDIR Cleanup: Remove created test directories");
        // Attempt cleanup for 'deep', might error if its parent wasn't created, which is expected
        await this._runCommand("rm -r deep", "MKDIR Cleanup: Attempt removal of 'deep' (may error harmlessly)");
        await this._runCommand("ls", "MKDIR Cleanup: Verify cleanup");
        console.log("===== MKDIR Testing Finished =====");
    }

    /**
     * @brief Tests the 'echo' command.
     */
     async testEcho() {
        console.log("\n===== Testing ECHO =====");
        // Test 1: Echo a simple string
        await this._runCommand("echo Hello World", "ECHO Test 1: Echo simple string 'Hello World'");

        // Test 2: Echo a string with multiple spaces, using quotes
        await this._runCommand("echo 'String with   multiple spaces'", "ECHO Test 2: Echo string with multiple spaces (single quoted)");

        // Test 3: Echo a string using double quotes
        await this._runCommand("echo \"Double quoted string\"", "ECHO Test 3: Echo double-quoted string");

        // Test 4: Echo with no arguments (should print a newline)
        await this._runCommand("echo", "ECHO Test 4: Echo empty string (expect newline)");

        // Note: Redirection tests depend on '>' being implemented in your shell/filesystem.
        // Test 5: Echo and redirect output to a file
        // await this._runCommand("echo 'Redirect content' > echo_test.txt", "ECHO Test 5: Echo with redirection to 'echo_test.txt'");
        // await this._runCommand("cat echo_test.txt", "ECHO Test 5: Verify redirection content (Requires cat)");
        // await this._runCommand("rm echo_test.txt", "ECHO Test 5: Cleanup redirection test file");
        console.log("===== ECHO Testing Finished =====");
    }

    /**
     * @brief Tests the 'cat' (concatenate and display files) command.
     */
    async testCat() {
        console.log("\n===== Testing CAT =====");
        // Setup: Create test files using echo (assumes echo works)
        await this._runCommand("echo 'Content for cat test 1' > cat_test1.txt", "CAT Setup: Create cat_test1.txt");
        await this._runCommand("echo 'Content for cat test 2' > cat_test2.txt", "CAT Setup: Create cat_test2.txt");
        await this._runCommand("mkdir cat_test_dir", "CAT Setup: Create directory 'cat_test_dir'");
        await this._runCommand("ls", "CAT Setup: List contents after setup");

        // Test 1: Cat a single existing file
        await this._runCommand("cat cat_test1.txt", "CAT Test 1: Display content of single file 'cat_test1.txt'");

        // Test 2: Cat multiple existing files (output should be concatenated)
        await this._runCommand("cat cat_test1.txt cat_test2.txt", "CAT Test 2: Display content of multiple files");

        // Test 3: Attempt to cat a non-existent file (expect error)
        await this._runCommand("cat non_existent_file.txt", "CAT Test 3: Attempt cat on non-existent file (expect error)");

        // Test 4: Attempt to cat a directory (expect error)
        await this._runCommand("cat cat_test_dir", "CAT Test 4: Attempt cat on a directory (expect error)");

        // Cleanup: Remove test files and directory
        await this._runCommand("rm cat_test1.txt cat_test2.txt", "CAT Cleanup: Remove test files");
        await this._runCommand("rm -r cat_test_dir", "CAT Cleanup: Remove test directory");
        console.log("===== CAT Testing Finished =====");
    }

    /**
     * @brief Tests the 'cp' (copy) command.
     */
    async testCp() {
        console.log("\n===== Testing CP =====");
        // Setup: Create source files and directories
        await this._runCommand("echo 'Source file content.' > cp_source.txt", "CP Setup: Create source file 'cp_source.txt'");
        await this._runCommand("mkdir cp_dir_src cp_dir_dest", "CP Setup: Create source 'cp_dir_src' and destination 'cp_dir_dest' directories");
        await this._runCommand("echo 'Nested file content.' > cp_dir_src/nested.txt", "CP Setup: Create nested file 'cp_dir_src/nested.txt'");
        await this._runCommand("ls", "CP Setup: List contents before copy tests");
        await this._runCommand("ls cp_dir_src", "CP Setup: List source directory contents");
        await this._runCommand("ls cp_dir_dest", "CP Setup: List destination directory contents (should be empty)");

        // Test 1: Copy a file to a new file name
        await this._runCommand("cp cp_source.txt cp_target_file.txt", "CP Test 1: Copy file 'cp_source.txt' to 'cp_target_file.txt'");
        await this._runCommand("ls", "CP Test 1: Verify 'cp_target_file.txt' exists");
        await this._runCommand("cat cp_target_file.txt", "CP Test 1: Verify copied file content (Requires cat)");

        // Test 2: Copy a file into an existing directory
        await this._runCommand("cp cp_source.txt cp_dir_dest", "CP Test 2: Copy file 'cp_source.txt' into directory 'cp_dir_dest'");
        await this._runCommand("ls cp_dir_dest", "CP Test 2: Verify 'cp_source.txt' copied into 'cp_dir_dest'");

        // Test 3: Attempt to copy a directory without the recursive flag (expect error)
        await this._runCommand("cp cp_dir_src cp_dir_dest", "CP Test 3: Attempt copy directory 'cp_dir_src' without -r (expect error)");

        // Test 4: Copy a directory recursively into another directory
        await this._runCommand("cp -r cp_dir_src cp_dir_dest/copied_dir", "CP Test 4: Copy directory 'cp_dir_src' recursively to 'cp_dir_dest/copied_dir'");
        await this._runCommand("ls cp_dir_dest", "CP Test 4: Verify 'copied_dir' exists in 'cp_dir_dest'");
        await this._runCommand("ls cp_dir_dest/copied_dir", "CP Test 4: Verify contents of recursively copied directory");

        // Test 5: Copy multiple files/items into a directory (if supported)
        await this._runCommand("cp cp_source.txt cp_target_file.txt cp_dir_dest", "CP Test 5: Copy multiple items to 'cp_dir_dest'");
        await this._runCommand("ls cp_dir_dest", "CP Test 5: Verify multiple items copied");

        // Cleanup: Remove all created files and directories
        await this._runCommand("rm cp_source.txt cp_target_file.txt", "CP Cleanup: Remove test files");
        await this._runCommand("rm -r cp_dir_src cp_dir_dest", "CP Cleanup: Remove test directories");
        console.log("===== CP Testing Finished =====");
    }

    /**
     * @brief Tests the 'mv' (move/rename) command based on mv.js implementation.
     */
    async testMv() {
        console.log("\n===== Testing MV (Based on mv.js Implementation) =====");

        // --- Setup ---
        // Ensure we are in a clean state
        await this._runCommand("cd ~", "MV Setup: Go to home directory");
        await this._runCommand("pwd", "MV Setup: Verify current directory (~/user)");
        await this._runCommand("rm -r mv_test_area", "MV Setup: Clean up previous test area (ignore errors)");
        await this._runCommand("clear", "MV Setup: Clear the screen for tests")
        // Create fresh items for testing in a dedicated test directory
        await this._runCommand("mkdir mv_test_area", "MV Setup: Create main test directory 'mv_test_area'");
        await this._runCommand("cd mv_test_area", "MV Setup: Enter test area 'mv_test_area'");
        await this._runCommand("pwd", "MV Setup: Verify current directory is mv_test_area");
        // Create source files and directories
        await this._runCommand("echo 'File A content' > fileA.txt", "MV Setup: Create source file fileA.txt");
        await this._runCommand("echo 'File B content' > fileB.txt", "MV Setup: Create source file fileB.txt");
        await this._runCommand("mkdir dir1", "MV Setup: Create source directory dir1");
        await this._runCommand("echo 'Nested file' > dir1/nested.txt", "MV Setup: Create nested file in dir1");
        await this._runCommand("mkdir dir2", "MV Setup: Create destination directory dir2");
        await this._runCommand("echo 'Existing file in dir2' > dir2/existing_in_dir2.txt", "MV Setup: Create a file in dir2");
        await this._runCommand("mkdir dir3_empty", "MV Setup: Create empty destination directory dir3_empty");
        await this._runCommand("ls -a", "MV Setup: Initial listing of mv_test_area");
        await this._runCommand("ls dir1", "MV Setup: Initial listing of dir1");
        await this._runCommand("ls dir2", "MV Setup: Initial listing of dir2");

        // --- File Operations ---

        // Test 1: Rename file (destination does not exist, same directory)
        await this._runCommand("mv fileA.txt fileA_renamed.txt", "MV Test 1: Rename fileA.txt to fileA_renamed.txt");
        await this._runCommand("ls", "MV Test 1: Verify fileA.txt gone, fileA_renamed.txt exists");

        // Test 2: Move file into existing directory (destination is dir)
        await this._runCommand("mv fileA_renamed.txt dir2/", "MV Test 2: Move fileA_renamed.txt into dir2");
        await this._runCommand("ls", "MV Test 2: Verify fileA_renamed.txt gone from mv_test_area");
        await this._runCommand("ls dir2", "MV Test 2: Verify fileA_renamed.txt exists in dir2");

        // Test 3: Move and rename file (destination file path does not exist, different directory)
        await this._runCommand("mv fileB.txt dir3_empty/fileB_moved.txt", "MV Test 3: Move fileB.txt to dir3_empty as fileB_moved.txt");
        await this._runCommand("ls", "MV Test 3: Verify fileB.txt gone from mv_test_area");
        await this._runCommand("ls dir3_empty", "MV Test 3: Verify fileB_moved.txt exists in dir3_empty");

        // Test 4: Overwrite existing file (destination is an existing file)
        await this._runCommand("echo 'Overwrite source' > overwrite_src.txt", "MV Test 4 (Setup): Create overwrite_src.txt");
        await this._runCommand("mv overwrite_src.txt dir2/existing_in_dir2.txt", "MV Test 4: Overwrite dir2/existing_in_dir2.txt with overwrite_src.txt");
        await this._runCommand("ls", "MV Test 4: Verify overwrite_src.txt gone from mv_test_area");
        await this._runCommand("ls dir2", "MV Test 4: Verify existing_in_dir2.txt still exists in dir2");
        // Optional: Verify content if cat command is reliable
        // await this._runCommand("cat dir2/existing_in_dir2.txt", "MV Test 4: Verify content of overwritten file (Requires cat)");

        // --- Directory Operations ---

        // Test 5: Rename directory (destination does not exist, same directory)
        await this._runCommand("mv dir1 dir1_renamed", "MV Test 5: Rename dir1 to dir1_renamed");
        await this._runCommand("ls", "MV Test 5: Verify dir1 gone, dir1_renamed exists");
        await this._runCommand("ls dir1_renamed", "MV Test 5: Verify contents of dir1_renamed (nested.txt)");

        // Test 6: Move directory into existing directory
        await this._runCommand("mv dir1_renamed dir2/", "MV Test 6: Move dir1_renamed into dir2");
        await this._runCommand("ls", "MV Test 6: Verify dir1_renamed gone from mv_test_area");
        await this._runCommand("ls dir2", "MV Test 6: Verify dir1_renamed exists inside dir2");
        await this._runCommand("ls dir2/dir1_renamed", "MV Test 6: Verify contents of moved dir1_renamed");

        // Test 7: Move and rename directory (destination path does not exist, different directory)
        // Setup: Create a dir to move
        await this._runCommand("mkdir dir_to_move", "MV Test 7 (Setup): Create dir_to_move");
        await this._runCommand("echo 'content' > dir_to_move/file.txt", "MV Test 7 (Setup): Add content to dir_to_move");
        await this._runCommand("mv dir_to_move dir3_empty/dir_moved_renamed", "MV Test 7: Move dir_to_move into dir3_empty as dir_moved_renamed");
        await this._runCommand("ls", "MV Test 7: Verify dir_to_move gone from mv_test_area");
        await this._runCommand("ls dir3_empty", "MV Test 7: Verify dir_moved_renamed exists in dir3_empty");
        await this._runCommand("ls dir3_empty/dir_moved_renamed", "MV Test 7: Verify contents of moved/renamed directory");


        // --- Multiple Source Operations ---

        // Test 8: Move multiple files into existing directory
        await this._runCommand("echo 'multi1' > multi1.txt", "MV Test 8 (Setup): Create multi1.txt");
        await this._runCommand("echo 'multi2' > multi2.txt", "MV Test 8 (Setup): Create multi2.txt");
        await this._runCommand("mv multi1.txt multi2.txt dir3_empty/", "MV Test 8: Move multi1.txt and multi2.txt into dir3_empty");
        await this._runCommand("ls", "MV Test 8: Verify multi1.txt and multi2.txt gone from mv_test_area");
        await this._runCommand("ls dir3_empty", "MV Test 8: Verify multi1.txt and multi2.txt exist in dir3_empty");


        // --- Error Conditions ---

        // Test 9: Source does not exist
        await this._runCommand("mv non_existent_file.txt .", "MV Test 9: Attempt to move non-existent source (expect error)");

        // Test 10: Destination path is invalid (parent directory does not exist)
        await this._runCommand("echo 'err test' > err_file.txt", "MV Test 10 (Setup): Create file for error test");
        await this._runCommand("mv err_file.txt /no/such/dir/new_name.txt", "MV Test 10: Attempt move to invalid destination path (expect error)");
        await this._runCommand("rm err_file.txt", "MV Test 10 (Cleanup): Remove error test file");

        // Test 11: Attempt to move directory onto an existing file
        await this._runCommand("mkdir err_dir", "MV Test 11 (Setup): Create directory for error test");
        await this._runCommand("echo 'target file' > err_target_file.txt", "MV Test 11 (Setup): Create target file");
        await this._runCommand("mv err_dir err_target_file.txt", "MV Test 11: Attempt move directory onto existing file (expect error: directory to file)");
        await this._runCommand("rm -r err_dir", "MV Test 11 (Cleanup): Remove error test directory");
        await this._runCommand("rm err_target_file.txt", "MV Test 11 (Cleanup): Remove error target file");

        // Test 12: Attempt to move multiple sources to a file destination
        await this._runCommand("echo 'multi err 1' > multi_err1.txt", "MV Test 12 (Setup): Create file 1");
        await this._runCommand("echo 'multi err 2' > multi_err2.txt", "MV Test 12 (Setup): Create file 2");
        await this._runCommand("echo 'target' > target_file.txt", "MV Test 12 (Setup): Create target file");
        await this._runCommand("mv multi_err1.txt multi_err2.txt target_file.txt", "MV Test 12: Attempt move multiple sources to a file (expect error)");
        await this._runCommand("rm multi_err1.txt multi_err2.txt target_file.txt", "MV Test 12 (Cleanup): Remove test files");

        // Test 13: Attempt to move multiple sources to a non-existent destination path
        // Recreate sources from Test 12
        await this._runCommand("echo 'multi err 1' > multi_err1.txt", "MV Test 13 (Setup): Create file 1");
        await this._runCommand("echo 'multi err 2' > multi_err2.txt", "MV Test 13 (Setup): Create file 2");
        await this._runCommand("mv multi_err1.txt multi_err2.txt non_existent_dest", "MV Test 13: Attempt move multiple sources to non-existent destination (expect error)");
        await this._runCommand("rm multi_err1.txt multi_err2.txt", "MV Test 13 (Cleanup): Remove test files");


        // --- Cleanup ---
        console.log("\n--- MV Cleanup ---");
        await this._runCommand("cd ..", "MV Cleanup: Go back to home directory"); // Exit mv_test_area
        await this._runCommand("rm -r mv_test_area", "MV Cleanup: Remove the main test directory");
        await this._runCommand("ls", "MV Cleanup: Final listing of home directory");

        console.log("===== MV Testing Finished =====");
    }

    /**
     * @brief Tests the 'rm' (remove) command.
     */
     async testRm() {
        console.log("\n===== Testing RM =====");
        // Setup: Create files and directories for removal tests
        await this._runCommand("mkdir rm_test_dir_empty rm_test_dir_nested", "RM Setup: Create directories for rm tests");
        await this._runCommand("echo 'file 1 content' > rm_test_file1.txt", "RM Setup: Create file 1 'rm_test_file1.txt'");
        await this._runCommand("echo 'file 2 content' > rm_test_file2.txt", "RM Setup: Create file 2 'rm_test_file2.txt'");
        await this._runCommand("echo 'nested file content' > rm_test_dir_nested/nested.txt", "RM Setup: Create nested file");
        await this._runCommand("ls -a", "RM Setup: List contents before rm tests (include hidden if applicable)");
        await this._runCommand("ls rm_test_dir_nested", "RM Setup: List nested directory contents");

        // Test 1: Remove a single existing file
        await this._runCommand("rm rm_test_file1.txt", "RM Test 1: Remove single file 'rm_test_file1.txt'");
        await this._runCommand("ls", "RM Test 1: Verify file 1 removed");

        // Test 2: Attempt to remove a non-existent file (expect error)
        await this._runCommand("rm rm_test_file_nonexistent.txt", "RM Test 2: Attempt remove non-existent file (expect error)");

        // Test 3: Attempt to remove an empty directory without '-r' flag (might succeed or fail depending on implementation)
        await this._runCommand("rm rm_test_dir_empty", "RM Test 3: Attempt remove empty directory 'rm_test_dir_empty' without -r");
        await this._runCommand("ls", "RM Test 3: Verify empty directory removal (if supported by basic rm)");
        // If rm doesn't handle empty dirs, use rm -r for cleanup:
        // await this._runCommand("rm -r rm_test_dir_empty", "RM Cleanup: Ensure empty dir is removed");


        // Test 4: Attempt to remove a non-empty directory without '-r' flag (expect error)
        await this._runCommand("rm rm_test_dir_nested", "RM Test 4: Attempt remove non-empty directory 'rm_test_dir_nested' without -r (expect error)");

        // Test 5: Remove a non-empty directory using the '-r' flag
        await this._runCommand("rm -r rm_test_dir_nested", "RM Test 5: Remove non-empty directory 'rm_test_dir_nested' with -r");
        await this._runCommand("ls", "RM Test 5: Verify nested directory removed");

        // Test 6: Remove multiple files at once
        await this._runCommand("touch rm_multi1.txt rm_multi2.txt", "RM Test 6 (Setup): Create multiple files for removal");
        await this._runCommand("rm rm_multi1.txt rm_multi2.txt", "RM Test 6: Remove multiple files 'rm_multi1.txt' 'rm_multi2.txt'");
        await this._runCommand("ls", "RM Test 6: Verify multiple files removed");

        // Final Cleanup: Ensure the second test file is removed
        await this._runCommand("rm rm_test_file2.txt", "RM Cleanup: Remove remaining test file 'rm_test_file2.txt'");
        await this._runCommand("ls", "RM Cleanup: Verify final state");
        console.log("===== RM Testing Finished =====");
    }

    /**
     * @brief Tests the 'tree' command.
     */
    async testTree() {
        console.log("\n===== Testing TREE =====");
        // Setup: Create a small directory structure
        await this._runCommand("mkdir tree_test && mkdir tree_test/subdir1 && mkdir tree_test/subdir2", "TREE Setup: Create directory structure");
        await this._runCommand("echo 'file A' > tree_test/fileA.txt", "TREE Setup: Create file A");
        await this._runCommand("echo 'file B' > tree_test/subdir1/fileB.txt", "TREE Setup: Create file B in subdir1");

        // Test 1: Display the filesystem tree starting from the current directory
        await this._runCommand("tree tree_test", "TREE Test 1: Display tree structure of 'tree_test'");
        // Optional: Test from root or another specific path if needed
        // await this._runCommand("tree /", "TREE Test 2: Display tree from root (can be large)");

        // Cleanup: Remove the test structure
        await this._runCommand("rm -r tree_test", "TREE Cleanup: Remove test structure");
        console.log("===== TREE Testing Finished =====");
    }

    /**
     * @brief Tests the 'todo' command.
     */
    async testTodo() {
        console.log("\n===== Testing TODO =====");
        // Test 1: Display the TODO list
        await this._runCommand("todo", "TODO Test 1: Display the TODO list");
        console.log("===== TODO Testing Finished =====");
    }

    /**
     * Runs all defined test methods sequentially.
     * Ensures a clean state before starting and provides overall status logs.
     */
    async runFullSuite() {
        console.log("\n###########################");
        console.log("### Running Full Test Suite ###");
        console.log("###########################");

        // Reset to a known state (home directory) before starting tests
        await this._runCommand("cd ~", "Suite Setup: Resetting to home directory", 100);
        // Clear the screen for better visibility of test output
        await this._runCommand("clear", "Suite Setup: Clearing screen", 100);

        // Execute tests sequentially, awaiting each completion
        await this.testPwd();
        await this.testLs();
        await this.testCd();    // Test cd early as it's fundamental for navigation
        await this.testMkdir(); // Test mkdir before commands that need directories
        await this.testEcho();  // Test echo before commands that use it for setup (cat, cp)
        await this.testCat();
        await this.testCp();
        await this.testRm();    // Test rm after commands that create files/dirs
        await this.testTree();
        await this.testTodo();

        console.log("\n###########################");
        console.log("### Test Suite Complete ###");
        console.log("###########################");
    }
}

// --- How to Use ---
// 1. Ensure this file ('testsuit.js') is correctly placed in your project structure.
// 2. Import the TestSuite class where you initialize your Terminal (e.g., in `main.js`):
//    import { TestSuite } from './testsuit.js'; // Adjust path if necessary
//
// 3. After creating and initializing your terminal instance:
//    const terminal = new Terminal();
//    terminal.init(); // Ensure terminal setup is complete
//    const testSuite = new TestSuite(terminal);
//
// 4. Trigger the tests when desired (e.g., via browser console, a button click):
//    // To run the full suite:
//    testSuite.runFullSuite();
//
//    // To run only a specific command's test:
//    testSuite.testLs(); // Remember these are async methods
//
// 5. Monitor the browser's developer console for detailed logs and observe the terminal UI for command execution.