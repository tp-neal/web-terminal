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
        if (!terminal || typeof terminal.run !== "function") {
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
            await new Promise((resolve) => setTimeout(resolve, delayMs));
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
        await this._runCommand(
            "pwd",
            "PWD Test 2: Print working directory after changing to Documents"
        );

        // Test 3: Change back to the parent directory and print
        await this._runCommand("cd ..", "PWD Test 3 (Setup): Change back to parent directory");
        await this._runCommand(
            "pwd",
            "PWD Test 3: Print working directory after returning to parent"
        );

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
        await this._runCommand(
            "ls non_existent_dir",
            "LS Test 4: List non-existent directory (expect error)"
        );

        // Test 5: Attempt to list a non-existent parent directory (expect error)
        await this._runCommand(
            "ls /..",
            "LS Test 5: List non-existent parent directory (expect error)"
        );

        // Test 6: Attempt to list a file (should show the file itself)
        await this._runCommand(
            "ls Documents/resume.txt",
            "LS Test 6: Attempt to list a file (expect file name or error)"
        );

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
        await this._runCommand(
            "cd non_existent_dir",
            "CD Test 2: Attempt cd to non-existent relative directory (expect error)"
        );
        await this._runCommand(
            "pwd",
            "CD Test 2: Verify directory remains 'Documents' after failed cd"
        );

        // --- Absolute Paths ---
        // Test 3: Change to an existing directory using an absolute path
        await this._runCommand(
            "cd /home/user/Pictures",
            "CD Test 3: Change to 'Pictures' (absolute path)"
        );
        await this._runCommand("pwd", "CD Test 3: Verify current directory is 'Pictures'");

        // Test 4: Attempt to change to a non-existent directory using an absolute path
        await this._runCommand(
            "cd /absolute/non_existent",
            "CD Test 4: Attempt cd to non-existent absolute directory (expect error)"
        );
        await this._runCommand(
            "pwd",
            "CD Test 4: Verify directory remains 'Pictures' after failed cd"
        );

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

        // Test 10: Combination
        await this._runCommand(
            "cd /../~/Documents/project_files/../././../..",
            "CD Test 10: Change the directory (expected: /home"
        );
        await this._runCommand("pwd", "CD Test 10: Verify current directory is home (/home)");

        // Test 11: Improper arguments usage
        await this._runCommand(
            "cd Folder_1 Folder_2",
            "CD Test 11: Attempt cd on multiple directories (should print error and usage hint)"
        );

        // Cleanup: Ensure we are back home
        await this._runCommand("cd ~", "CD Cleanup: Ensure return to home directory");

        console.log("===== CD Testing Finished =====");
    }

    /**
     * @brief Tests the 'mkdir' (make directory) command.
     */
    async testMkdir() {
        console.log("\n===== Testing MKDIR =====");

        // Setup: List initial directory
        await this._runCommand(
            "ls",
            "MKDIR Test (Initial): List contents before creating directories"
        );

        // Test 1: Create a single directory
        await this._runCommand(
            "mkdir test_dir_1",
            "MKDIR Test 1: Create a single directory 'test_dir_1'"
        );
        await this._runCommand("ls", "MKDIR Test 1: Verify 'test_dir_1' creation");

        // Test 2: Attempt to create an already existing directory (expect error)
        await this._runCommand(
            "mkdir test_dir_1",
            "MKDIR Test 2: Attempt to create existing directory 'test_dir_1' (expect error)"
        );

        // Test 3: Create multiple directories at once
        await this._runCommand(
            "mkdir test_dir_2 test_dir_3",
            "MKDIR Test 3: Create multiple directories 'test_dir_2' 'test_dir_3'"
        );
        await this._runCommand("ls", "MKDIR Test 3: Verify 'test_dir_2' and 'test_dir_3' creation");

        // Test 4: Create nested directories using the '-p' flag (parents should be created)
        await this._runCommand(
            "mkdir -p nested/dir/creation",
            "MKDIR Test 4: Create nested directories 'nested/dir/creation' with -p flag"
        );
        await this._runCommand(
            "ls nested/dir",
            "MKDIR Test 4: Verify nested directory 'creation' exists"
        );

        // Test 5: Attempt to create nested directories without '-p' (expect error if parent doesn't exist)
        await this._runCommand(
            "mkdir deep/nonexistent/path",
            "MKDIR Test 5: Attempt to create nested directories without -p (expect error)"
        );

        // Cleanup: Remove all created directories (use rm -r for non-empty/nested ones)
        await this._runCommand(
            "rm -r test_dir_1 test_dir_2 test_dir_3 nested",
            "MKDIR Cleanup: Remove created test directories"
        );
        // Attempt cleanup for 'deep', might error if its parent wasn't created, which is expected
        await this._runCommand(
            "rm -r deep",
            "MKDIR Cleanup: Attempt removal of 'deep' (will error harmlessly)"
        );
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
        await this._runCommand(
            "echo 'String with   multiple spaces'",
            "ECHO Test 2: Echo string with multiple spaces (single quoted)"
        );

        // Test 3: Echo a string with multiple spaces, without quotes
        await this._runCommand(
            "echo String with   multiple spaces",
            "ECHO Test 2: Echo string with multiple spaces (unquoted)"
        );

        // Test 4: Echo a string using double quotes
        await this._runCommand(
            'echo "Double quoted string"',
            "ECHO Test 4: Echo double-quoted string"
        );

        // Test 5: Echo with no arguments (should print a newline)
        await this._runCommand("echo", "ECHO Test 5: Echo empty string (expect newline)");

        console.log("===== ECHO Testing Finished =====");
    }

    /**
     * @brief Tests the 'cat' (concatenate and display files) command.
     */
    async testCat() {
        console.log("\n===== Testing CAT =====");
        // Setup: Navigate to documents directory
        await this._runCommand(
            "cd ~/Documents",
            "CAT Setup: Navigate to Documents directory for testing"
        );

        // Test 1: Cat a single existing file
        await this._runCommand(
            "cat resume.txt",
            "CAT Test 1: Display content of single file 'resume.txt'"
        );

        // Test 2: Cat multiple existing files (output should be concatenated)
        await this._runCommand(
            "cat notes.txt project_ideas.txt",
            "CAT Test 2: Display content of multiple files"
        );

        // Test 3: Attempt to cat a non-existent file (expect error)
        await this._runCommand(
            "cat non_existent_file.txt",
            "CAT Test 3: Attempt cat on non-existent file (expect error)"
        );

        // Test 4: Attempt to cat a directory (expect error)
        await this._runCommand(
            "cat project_files",
            "CAT Test 4: Attempt cat on a directory (expect error)"
        );

        // Test 5: Attempt to cat a file in another directory
        await this._runCommand(
            "cat project_files/config.json",
            "CAT Test 5: Attempt cat on file in seperate directory"
        );

        // Test 6: Improper arguments usage
        await this._runCommand(
            "cat",
            "CAT Test 6: Attempt cat on nothing (should print error and usage hint)"
        );

        // Cleanup: Ensure we are back home
        await this._runCommand("cd ~", "CD Cleanup: Ensure return to home directory");
        console.log("===== CAT Testing Finished =====");
    }

    /**
     * @brief Tests the 'cp' (copy) command using the existing filesystem structure.
     */
    async testCp() {
        console.log("\n===== Testing CP =====");

        // --- Setup ---
        // Ensure we start in the user's home directory where test files exist
        await this._runCommand("cd ~", "CP Setup: Go to home directory (~/user)");
        await this._runCommand("pwd", "CP Setup: Verify current directory");
        // Optional: Clear screen
        await this._runCommand("clear", "CP Setup: Clearing screen");

        // Create a dedicated destination directory for copy tests
        await this._runCommand(
            "mkdir cp_test_dest_area",
            "CP Setup: Create destination directory 'cp_test_dest_area'"
        );

        // Verify initial state
        await this._runCommand("ls Documents", "CP Setup: List contents of source 'Documents'");
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Setup: List destination directory (should be empty)"
        );

        // --- Test Cases ---

        // Test 1: Copy an existing file to a new file name in the destination area
        await this._runCommand(
            "cp Documents/resume.txt cp_test_dest_area/resume_copy.txt",
            "CP Test 1: Copy '~/Documents/resume.txt' to '~/cp_test_dest_area/resume_copy.txt'"
        );
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Test 1: Verify 'resume_copy.txt' exists in destination"
        );
        await this._runCommand(
            "cat cp_test_dest_area/resume_copy.txt",
            "CP Test 1: Verify 'resume_copy.txt' content is the same"
        );

        // Test 2: Copy an existing file into the destination directory
        await this._runCommand(
            "cp Documents/notes.txt cp_test_dest_area/",
            "CP Test 2: Copy '~/Documents/notes.txt' into '~/cp_test_dest_area/'"
        );
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Test 2: Verify 'notes.txt' copied into destination"
        );

        // Test 3: Attempt to copy an existing directory without the recursive flag (expect error)
        await this._runCommand(
            "cp Documents/project_files cp_test_dest_area/",
            "CP Test 3: Attempt copy directory '~/Documents/project_files' without -r (expect error)"
        );
        // Verify destination hasn't changed unexpectedly
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Test 3: Verify destination after failed directory copy"
        );

        // Test 4: Copy an existing directory recursively into the destination directory
        // It should create 'project_files' inside 'cp_test_dest_area'
        await this._runCommand(
            "cp -r Documents/project_files cp_test_dest_area/",
            "CP Test 4: Copy directory '~/Documents/project_files' recursively into '~/cp_test_dest_area/'"
        );
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Test 4: Verify 'project_files' directory exists in destination"
        );
        await this._runCommand(
            "ls cp_test_dest_area/project_files",
            "CP Test 4: Verify contents (README.md, config.json) of recursively copied directory"
        );

        // Test 5: Copy multiple existing files into the destination directory
        await this._runCommand(
            "cp Documents/resume.txt Pictures/Photos/vacation/beach.jpg cp_test_dest_area/",
            "CP Test 5: Copy multiple files ('resume.txt', 'beach.jpg') to '~/cp_test_dest_area/'"
        );
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Test 5: Verify 'resume.txt' and 'beach.jpg' exist in destination"
        );

        // Test 6: Copy a hidden file
        await this._runCommand(
            "cp .gitconfig cp_test_dest_area/gitconfig_copy",
            "CP Test 6: Copy hidden file '~/.gitconfig' to '~/cp_test_dest_area/gitconfig_copy'"
        );
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Test 6: Verify 'gitconfig_copy' exists in destination"
        );

        // --- Error Conditions ---

        // Test 7: Source does not exist
        await this._runCommand(
            "cp non_existent_source.txt cp_test_dest_area/",
            "CP Test 7: Attempt copy non-existent source file (expect error)"
        );

        // Test 8: Destination path is invalid (parent directory does not exist)
        await this._runCommand(
            "cp Documents/resume.txt non_existent_dest_dir/resume_copy.txt",
            "CP Test 8: Attempt copy to invalid destination path (expect error)"
        );

        // Test 9: Attempt to copy a directory onto an existing file path
        // Setup: create a target file first
        await this._runCommand(
            "touch cp_test_dest_area/target_file.txt",
            "CP Test 9 (Setup): Create target file 'target_file.txt'"
        );
        await this._runCommand(
            "cp -r Documents/project_files cp_test_dest_area/target_file.txt",
            "CP Test 9: Attempt copy directory onto existing file (expect error)"
        );
        // Verify the target file wasn't wrongly overwritten or removed
        await this._runCommand(
            "ls cp_test_dest_area",
            "CP Test 9: Verify 'target_file.txt' still exists after failed copy"
        );

        // --- Cleanup ---
        console.log("\n--- CP Cleanup ---");
        // Go back home just in case a cd happened or test failed mid-operation
        await this._runCommand("cd ~", "CP Cleanup: Go back to home directory");
        // Remove the destination directory and all its contents
        await this._runCommand(
            "rm -r cp_test_dest_area",
            "CP Cleanup: Remove the destination test directory 'cp_test_dest_area'"
        );
        await this._runCommand("ls", "CP Cleanup: Final listing of home directory");

        console.log("===== CP Testing Finished =====");
    }

    /**
     * @brief Tests the 'mv' (move/rename) command using items copied from the existing filesystem.
     */
    async testMv() {
        console.log("\n===== Testing MV =====");

        // --- Setup ---
        // Start fresh in the home directory
        await this._runCommand("cd ~", "MV Setup: Go to home directory");
        await this._runCommand("pwd", "MV Setup: Verify current directory (~/user)");
        // Clean up any previous test area (ignore errors)
        await this._runCommand(
            "rm -r mv_test_area",
            "MV Setup: Clean up previous test area (ignore errors)"
        );
        // Optional: Clear screen
        await this._runCommand("clear", "MV Setup: Clear screen for tests");
        // Create a dedicated test directory
        await this._runCommand(
            "mkdir mv_test_area",
            "MV Setup: Create main test directory 'mv_test_area'"
        );
        await this._runCommand("cd mv_test_area", "MV Setup: Enter test area 'mv_test_area'");
        await this._runCommand("pwd", "MV Setup: Verify current directory is mv_test_area");

        // Setup: Copy necessary items from the permanent filesystem into the test area
        console.log("--- MV Setup: Copying items into test area ---");
        await this._runCommand(
            "cp ~/Documents/resume.txt file_to_rename.txt",
            "MV Setup: Copy resume.txt for renaming test"
        );
        await this._runCommand(
            "cp ~/Documents/notes.txt file_to_move.txt",
            "MV Setup: Copy notes.txt for moving test"
        );
        await this._runCommand(
            "cp -r ~/Documents/project_files dir_to_rename",
            "MV Setup: Copy project_files/ dir for renaming test"
        );
        await this._runCommand(
            "cp -r ~/Pictures/Photos/vacation dir_to_move", // Copies 'vacation' dir
            "MV Setup: Copy vacation/ dir for moving test"
        );
        await this._runCommand(
            "mkdir existing_dest_dir",
            "MV Setup: Create an empty destination directory 'existing_dest_dir'"
        );
        await this._runCommand(
            "cp ~/Documents/project_ideas.txt existing_dest_dir/target_to_overwrite.txt",
            "MV Setup: Copy project_ideas.txt into dest dir for overwrite test"
        );
        await this._runCommand(
            "cp ~/Downloads/wallpaper.jpg another_file.jpg",
            "MV Setup: Copy wallpaper.jpg for multi-move error test"
        );

        // Show the initial state of the test area
        await this._runCommand("ls", "MV Setup: Initial listing of mv_test_area top-level");
        await this._runCommand("ls dir_to_rename", "MV Setup: List initial dir_to_rename");
        await this._runCommand("ls dir_to_move", "MV Setup: List initial dir_to_move"); // Should show beach.jpg etc.
        await this._runCommand("ls existing_dest_dir", "MV Setup: List initial existing_dest_dir");

        // --- Core Test Cases ---

        // Test 1: Rename file in the same directory
        await this._runCommand(
            "mv file_to_rename.txt renamed_file.txt",
            "MV Test 1: Rename file_to_rename.txt -> renamed_file.txt"
        );
        await this._runCommand("ls", "MV Test 1: Verify renamed_file.txt exists, original is gone");

        // Test 2: Move file into an existing directory
        await this._runCommand(
            "mv file_to_move.txt existing_dest_dir/",
            "MV Test 2: Move file_to_move.txt into existing_dest_dir/"
        );
        await this._runCommand("ls", "MV Test 2: Verify file_to_move.txt gone from top-level");
        await this._runCommand(
            "ls existing_dest_dir",
            "MV Test 2: Verify file_to_move.txt is inside existing_dest_dir"
        );

        // Test 3: Rename directory in the same directory
        await this._runCommand(
            "mv dir_to_rename renamed_dir",
            "MV Test 3: Rename dir_to_rename -> renamed_dir"
        );
        await this._runCommand("ls", "MV Test 3: Verify renamed_dir exists, original is gone");
        await this._runCommand(
            "ls renamed_dir",
            "MV Test 3: Verify contents (README.md, etc.) moved with renamed_dir"
        );

        // Test 4: Move directory into an existing directory
        await this._runCommand(
            "mv dir_to_move existing_dest_dir/", // Should become existing_dest_dir/vacation
            "MV Test 4: Move dir_to_move (vacation/) into existing_dest_dir/"
        );
        await this._runCommand("ls", "MV Test 4: Verify dir_to_move gone from top-level");
        await this._runCommand(
            "ls existing_dest_dir",
            "MV Test 4: Verify 'vacation' directory is inside existing_dest_dir"
        );
        await this._runCommand(
            "ls existing_dest_dir/vacation",
            "MV Test 4: Verify contents (beach.jpg, etc.) moved with vacation/"
        );

        // Test 5: Overwrite an existing file with a moved file
        await this._runCommand(
            "mv renamed_file.txt existing_dest_dir/target_to_overwrite.txt",
            "MV Test 5: Move renamed_file.txt onto existing_dest_dir/target_to_overwrite.txt (Overwrite)"
        );
        await this._runCommand("ls", "MV Test 5: Verify renamed_file.txt is gone from top-level");
        await this._runCommand(
            "ls existing_dest_dir",
            "MV Test 5: Verify target_to_overwrite.txt still exists (content changed)"
        );
        // Optional: Check content if cat is reliable
        // await this._runCommand("cat existing_dest_dir/target_to_overwrite.txt", "MV Test 5: Verify content (should be from resume.txt)");

        // --- Error Conditions ---

        // Test 6: Source does not exist
        await this._runCommand(
            "mv non_existent_file.txt .",
            "MV Test 6: Attempt move non-existent source (expect error)"
        );

        // Test 7: Attempt to move a directory onto an existing file
        await this._runCommand(
            "mv renamed_dir existing_dest_dir/file_to_move.txt", // Use the file moved in Test 2
            "MV Test 7: Attempt move directory 'renamed_dir' onto file 'file_to_move.txt' (expect error)"
        );
        // Verify both source and target still exist
        await this._runCommand(
            "ls",
            "MV Test 7: Verify 'renamed_dir' still exists after failed move"
        );
        await this._runCommand(
            "ls existing_dest_dir",
            "MV Test 7: Verify 'file_to_move.txt' still exists after failed move"
        );

        // Test 8: Attempt to move multiple sources to a file destination
        // Need a file at the top level first. Copy one back temporarily.
        await this._runCommand(
            "cp existing_dest_dir/file_to_move.txt temp_target_file.txt",
            "MV Test 8 (Setup): Create a temporary file target"
        );
        await this._runCommand(
            "mv renamed_dir another_file.jpg temp_target_file.txt",
            "MV Test 8: Attempt move multiple items onto a file target (expect error)"
        );
        await this._runCommand(
            "rm temp_target_file.txt",
            "MV Test 8 (Cleanup): Remove temp target"
        );

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
        await this._runCommand(
            "mkdir rm_test_dir_empty rm_test_dir_nested",
            "RM Setup: Create directories for rm tests"
        );
        await this._runCommand(
            "echo 'file 1 content' > rm_test_file1.txt",
            "RM Setup: Create file 1 'rm_test_file1.txt'"
        );
        await this._runCommand(
            "echo 'file 2 content' > rm_test_file2.txt",
            "RM Setup: Create file 2 'rm_test_file2.txt'"
        );
        await this._runCommand(
            "echo 'nested file content' > rm_test_dir_nested/nested.txt",
            "RM Setup: Create nested file"
        );
        await this._runCommand(
            "ls -a",
            "RM Setup: List contents before rm tests (include hidden if applicable)"
        );
        await this._runCommand("ls rm_test_dir_nested", "RM Setup: List nested directory contents");

        // Test 1: Remove a single existing file
        await this._runCommand(
            "rm rm_test_file1.txt",
            "RM Test 1: Remove single file 'rm_test_file1.txt'"
        );
        await this._runCommand("ls", "RM Test 1: Verify file 1 removed");

        // Test 2: Attempt to remove a non-existent file (expect error)
        await this._runCommand(
            "rm rm_test_file_nonexistent.txt",
            "RM Test 2: Attempt remove non-existent file (expect error)"
        );

        // Test 3: Attempt to remove an empty directory without '-r' flag (might succeed or fail depending on implementation)
        await this._runCommand(
            "rm rm_test_dir_empty",
            "RM Test 3: Attempt remove empty directory 'rm_test_dir_empty' without -r"
        );
        await this._runCommand(
            "ls",
            "RM Test 3: Verify empty directory removal (if supported by basic rm)"
        );
        // If rm doesn't handle empty dirs, use rm -r for cleanup:
        // await this._runCommand("rm -r rm_test_dir_empty", "RM Cleanup: Ensure empty dir is removed");

        // Test 4: Attempt to remove a non-empty directory without '-r' flag (expect error)
        await this._runCommand(
            "rm rm_test_dir_nested",
            "RM Test 4: Attempt remove non-empty directory 'rm_test_dir_nested' without -r (expect error)"
        );

        // Test 5: Remove a non-empty directory using the '-r' flag
        await this._runCommand(
            "rm -r rm_test_dir_nested",
            "RM Test 5: Remove non-empty directory 'rm_test_dir_nested' with -r"
        );
        await this._runCommand("ls", "RM Test 5: Verify nested directory removed");

        // Test 6: Remove multiple files at once
        await this._runCommand(
            "touch rm_multi1.txt rm_multi2.txt",
            "RM Test 6 (Setup): Create multiple files for removal"
        );
        await this._runCommand(
            "rm rm_multi1.txt rm_multi2.txt",
            "RM Test 6: Remove multiple files 'rm_multi1.txt' 'rm_multi2.txt'"
        );
        await this._runCommand("ls", "RM Test 6: Verify multiple files removed");

        // Final Cleanup: Ensure the second test file is removed
        await this._runCommand(
            "rm rm_test_file2.txt",
            "RM Cleanup: Remove remaining test file 'rm_test_file2.txt'"
        );
        await this._runCommand("ls", "RM Cleanup: Verify final state");
        console.log("===== RM Testing Finished =====");
    }

    /**
     * @brief Tests the 'tree' command.
     */
    async testTree() {
        console.log("\n===== Testing TREE =====");
        // Setup: Create a small directory structure
        await this._runCommand(
            "mkdir tree_test && mkdir tree_test/subdir1 && mkdir tree_test/subdir2",
            "TREE Setup: Create directory structure"
        );
        await this._runCommand("echo 'file A' > tree_test/fileA.txt", "TREE Setup: Create file A");
        await this._runCommand(
            "echo 'file B' > tree_test/subdir1/fileB.txt",
            "TREE Setup: Create file B in subdir1"
        );

        // Test 1: Display the filesystem tree starting from the current directory
        await this._runCommand(
            "tree tree_test",
            "TREE Test 1: Display tree structure of 'tree_test'"
        );
        // Optional: Test from root or another specific path if needed
        // await this._runCommand("tree /", "TREE Test 2: Display tree from root (can be large)");

        // Cleanup: Remove the test structure
        await this._runCommand("rm -r tree_test", "TREE Cleanup: Remove test structure");
        console.log("===== TREE Testing Finished =====");
    }

    /**
     * @brief Tests the 'touch' command (without pre-cleanup or redirection).
     */
    async testTouch() {
        console.log("\n===== Testing TOUCH =====");

        // --- Setup ---
        // Assume we start in the home directory or reset if needed
        await this._runCommand("cd ~", "TOUCH Setup: Ensure home directory");

        // Create a dedicated directory for touch tests
        await this._runCommand(
            "mkdir touch_test_area",
            "TOUCH Setup: Create main test directory 'touch_test_area'"
        );
        await this._runCommand(
            "cd touch_test_area",
            "TOUCH Setup: Enter test area 'touch_test_area'"
        );
        await this._runCommand("pwd", "TOUCH Setup: Verify current directory is touch_test_area");

        // Create pre-existing items using touch/mkdir for update/interaction tests
        await this._runCommand(
            "touch existing_file.txt",
            "TOUCH Setup: Create pre-existing file 'existing_file.txt' using touch"
        );
        await this._runCommand(
            "mkdir existing_dir",
            "TOUCH Setup: Create pre-existing directory 'existing_dir'"
        );
        await this._runCommand("ls -a", "TOUCH Setup: Initial listing of touch_test_area");

        // --- Test Cases ---

        // Test 1: Create a single new file
        await this._runCommand(
            "touch new_single_file.txt",
            "TOUCH Test 1: Create single new file 'new_single_file.txt'"
        );
        await this._runCommand("ls", "TOUCH Test 1: Verify 'new_single_file.txt' exists");

        // Test 2: Create multiple new files at once (with and without extensions)
        await this._runCommand(
            "touch multi_file1.log multi_file2 multi_file3.js",
            "TOUCH Test 2: Create multiple files ('multi_file1.log', 'multi_file2', 'multi_file3.js')"
        );
        await this._runCommand("ls", "TOUCH Test 2: Verify multiple files exist");

        // Test 3: Create a file inside an existing subdirectory
        await this._runCommand(
            "touch existing_dir/nested_new_file.dat",
            "TOUCH Test 3: Create file 'nested_new_file.dat' inside 'existing_dir'"
        );
        await this._runCommand(
            "ls existing_dir",
            "TOUCH Test 3: Verify 'nested_new_file.dat' exists in 'existing_dir'"
        );

        // Test 4: Touch an existing file (created during setup)
        await this._runCommand(
            "touch existing_file.txt",
            "TOUCH Test 4: Touch existing file 'existing_file.txt'"
        );
        await this._runCommand(
            "ls",
            "TOUCH Test 4: Verify 'existing_file.txt' still exists after touch"
        );

        // Test 5: Touch an existing directory (created during setup)
        await this._runCommand(
            "touch existing_dir",
            "TOUCH Test 5: Touch existing directory 'existing_dir'"
        );
        await this._runCommand(
            "ls",
            "TOUCH Test 5: Verify 'existing_dir' still exists after touch"
        );

        // --- Error Conditions ---

        // Test 6: Attempt to touch with no arguments
        await this._runCommand(
            "touch",
            "TOUCH Test 6: Attempt touch with no arguments (expect 'too few arguments' error)"
        );

        // Test 7: Attempt to touch a file where the parent directory does not exist
        await this._runCommand(
            "touch non_existent_dir/some_file.txt",
            "TOUCH Test 7: Attempt touch in non-existent directory (expect path resolution error)"
        );

        // Test 8: Attempt to touch a file with an invalid name (assuming '/' is invalid)
        // Note: This depends on your `FSUtil.isValidFileName` implementation.
        await this._runCommand(
            "touch 'invalid/name.txt'",
            "TOUCH Test 8: Attempt touch with invalid character in name (expect 'invalid file name' error)"
        );

        // --- Cleanup ---
        // This cleanup at the end removes everything created during this test run.
        console.log("\n--- TOUCH Cleanup ---");
        await this._runCommand("cd ..", "TOUCH Cleanup: Go back to home directory"); // Exit touch_test_area
        await this._runCommand(
            "rm -r touch_test_area",
            "TOUCH Cleanup: Remove the main test directory"
        );
        await this._runCommand("ls", "TOUCH Cleanup: Final listing of home directory");

        console.log("===== TOUCH Testing Finished =====");
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
        await this.testCd(); // Test cd early as it's fundamental for navigation
        await this.testMkdir(); // Test mkdir before commands that need directories
        await this.testEcho(); // Test echo before commands that use it for setup (cat, cp)
        await this.testCat();
        await this.testCp();
        await this.testRm(); // Test rm after commands that create files/dirs
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
