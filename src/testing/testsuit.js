/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: testsuit.js
* @date: 04/19/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A class used for testing the functionality of each terminal command.
==================================================================================================*/

/* Class Definition
 **************************************************************************************************/
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
    }

    /**
     * Helper method to execute a command and introduce a delay.
     * @param {string} command - The command string to execute.
     * @param {number} [delayMs=0] - Milliseconds to pause after running the command (allows UI updates).
     */
    async _runCommand(command, delayMs = 0) {
        // Directly call the terminal's run method to simulate user input
        this.terminal.run(command);

        // Wait for the specified delay if needed
        if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    /**
     * @brief Tests the 'pwd' (print working directory) command.
     * Matches the testing style of testLs/testCd.
     */
    async testPwd() {
        console.log("--- Starting pwd command tests ---");

        // --- Basic Usage ---
        console.log("\n--- Testing Basic Usage ---");

        // Test 1: Print the initial working directory (should be home: ~)
        console.log("\nTest 1: Print initial working directory");
        await this._runCommand("pwd");

        // --- After Directory Change ---
        console.log("\n--- Testing After Directory Change ---");

        // Test 2: Change directory and print the new working directory
        console.log("\nTest 2 (Setup): Change directory to Documents");
        await this._runCommand("cd Documents");
        console.log("Test 2: Print working directory after changing to Documents");
        await this._runCommand("pwd");

        // Test 3: Change back to the parent directory and print
        console.log("\nTest 3 (Setup): Change back to parent directory");
        await this._runCommand("cd ..");
        console.log("Test 3: Print working directory after returning to parent");
        await this._runCommand("pwd");

        // Test 3: Change back to the parent directory and print
        console.log("\nTest 4 (Setup): Change to root directory");
        await this._runCommand("cd /");
        await this._runCommand("pwd");

        // --- Cleanup ---
        console.log("\n--- Cleanup ---");
        console.log("Cleanup: Return to home directory");
        await this._runCommand("cd ~");
        console.log("Cleanup: Verify final directory");
        await this._runCommand("pwd");

        console.log("\n--- pwd command tests finished ---");
    }

    /**
     * @brief Tests the 'ls' (list directory contents) command thoroughly.
     * Matches the testing style of testCd.
     */
    async testLs() {
        console.log("--- Starting ls command tests ---");

        console.log("\n--- Initial State Check ---");
        console.log("Initial State: Show directory before ls tests");
        await this._runCommand("pwd");

        // --- Basic Directory Listing ---
        console.log("\n--- Testing Basic Directory Listing ---");

        // Test 1: List the current directory (default behavior)
        console.log("\nTest 1: List current directory (implicit '.')");
        await this._runCommand("ls");

        // Test 2: List a specific existing subdirectory ('Documents')
        console.log("\nTest 2: List specific subdirectory ('Documents')");
        await this._runCommand("ls Documents");

        // --- Special Paths ---
        console.log("\n--- Testing Special Paths ---");

        // Test 3: List the root directory '/'
        console.log("\nTest 3: List root directory '/'");
        await this._runCommand("ls /");

        // Test 4: List the current directory explicitly using '.'
        console.log("\nTest 4: List current directory explicitly ('.')");
        await this._runCommand("ls .");

        // Test 5: List the parent directory using '..'
        console.log("\nTest 5: List parent directory ('..')");
        await this._runCommand("ls ..");

        // --- File Listing ---
        console.log("\n--- Testing File Listing ---");

        // Test 6: Attempt to list a specific file (should typically show the file itself)
        console.log("\nTest 6: List a specific file ('Documents/resume.txt')");
        await this._runCommand("ls Documents/resume.txt");

        // --- Hidden File Listing (-a) ---
        console.log("\n--- Testing Hidden File Listing (-a) ---");
        console.log("\nTest 7: List current directory including hidden files ('ls -a')");
        await this._runCommand("ls -a");

        // --- Error Handling / Non-Existent Targets ---
        console.log("\n--- Testing Error Handling ---");

        // Test 8: Attempt to list a non-existent directory
        console.log("\nTest 8: Attempt to list non-existent directory ('non_existent_dir', expect error)");
        await this._runCommand("ls non_existent_dir"); // Expect error

        // Test 9: Attempt to list a non-existent file within an existing directory
        console.log("\nTest 9: Attempt to list non-existent file ('Documents/no_such_file.txt', expect error)");
        await this._runCommand("ls Documents/no_such_file.txt"); // Expect error

        // Test 10: Attempt to list a path containing a non-existent component
        console.log("\nTest 10: Attempt to list path with non-existent component ('fake_dir/some_file', expect error)");
        await this._runCommand("ls fake_dir/some_file"); // Expect error

        console.log("\n--- ls command tests finished ---");
    }

    /**
     * @brief Tests the 'cd' (change directory) command thoroughly.
     * Matches the testing style of testCp.
     */
    async testCd() {
        console.log("--- Starting cd command tests ---");

        // Note: Using 'pwd' is essential to verify 'cd' worked correctly.

        console.log("\n--- Initial State Check ---");
        console.log("Initial State: Show directory before cd tests");
        await this._runCommand("pwd");

        // --- Relative Paths ---
        console.log("\n--- Testing Relative Paths ---");

        // Test 1: Change to an existing directory relative to current
        console.log("\nTest 1: Change to 'Documents' (relative path)");
        await this._runCommand("cd Documents");
        console.log("Test 1: Verify current directory is 'Documents'");
        await this._runCommand("pwd");

        // Test 2: Attempt to change to a non-existent directory relative to current
        console.log("\nTest 2: Attempt cd to non-existent relative directory 'non_existent_dir' (expect error)");
        await this._runCommand("cd non_existent_dir"); // Expect error
        console.log("Test 2: Verify directory remains 'Documents' after failed cd");
        await this._runCommand("pwd");

        // --- Absolute Paths ---
        console.log("\n--- Testing Absolute Paths ---");

        // Test 3: Change to an existing directory using an absolute path
        console.log("\nTest 3: Change to '/home/user/Pictures' (absolute path)");
        await this._runCommand("cd /home/user/Pictures");
        console.log("Test 3: Verify current directory is 'Pictures'");
        await this._runCommand("pwd");

        // Test 4: Attempt to change to a non-existent directory using an absolute path
        console.log("\nTest 4: Attempt cd to non-existent absolute directory '/absolute/non_existent' (expect error)");
        await this._runCommand("cd /absolute/non_existent"); // Expect error
        console.log("Test 4: Verify directory remains 'Pictures' after failed cd");
        await this._runCommand("pwd");

        // --- Special Paths ---
        console.log("\n--- Testing Special Paths ---");

        // Test 5: Change to the parent directory using '..'
        console.log("\nTest 5: Change to parent directory using '..'");
        await this._runCommand("cd ..");
        console.log("Test 5: Verify current directory is parent (~/home/user)");
        await this._runCommand("pwd");

        // Test 6: Attempt to change to the parent of the root directory (should stay at root)
        console.log("\nTest 6: Attempt change to parent of root using 'cd /' then 'cd ..'");
        console.log("Test 6 (Setup): Go to root '/'");
        await this._runCommand("cd /");
        await this._runCommand("cd ..");
        console.log("Test 6: Verify directory remains '/'");
        await this._runCommand("pwd");

        // Test 7: Change to the current directory using '.' (should have no effect)
        console.log("\nTest 7: Change to current directory using '.'");
        await this._runCommand("cd .");
        console.log("Test 7: Verify directory remains '/'");
        await this._runCommand("pwd");

        // Test 8: Change to home directory using '~' shortcut
        console.log("\nTest 8: Change to home directory using '~'");
        await this._runCommand("cd ~");
        console.log("Test 8: Verify current directory is home (~/home/user)");
        await this._runCommand("pwd");

        // Test 9: Change to home directory using 'cd' with no arguments
        console.log("\nTest 9: Change to home directory using empty 'cd'");
        console.log("Test 9 (Setup): Go to root '/' to ensure we move");
        await this._runCommand("cd /");
        await this._runCommand("cd");
        console.log("Test 9: Verify current directory is home (~/home/user)");
        await this._runCommand("pwd");

        // --- Complex Paths and Arguments ---
        console.log("\n--- Testing Complex Paths and Arguments ---");

        // Test 10: Combination of special characters
        // Expected resolution: / -> /home/user -> Documents -> project_files -> Documents -> 
        // Documents -> Documents -> /home/user -> /home
        console.log("\nTest 10: Change using complex path '/../~/Documents/project_files/../././../..' (expected: /home)");
        await this._runCommand("cd /../~/Documents/project_files/../././../..");
        console.log("Test 10: Verify current directory is /home");
        await this._runCommand("pwd");

        // Test 11: Improper arguments usage (too many arguments)
        console.log("\nTest 11: Attempt cd on multiple directories 'Folder_1 Folder_2' (expect error)");
        await this._runCommand("cd Folder_1 Folder_2"); // Expect error
        console.log("Test 11: Verify directory remains /home after failed cd");
        await this._runCommand("pwd");

        // Test 12: Home followed by special cases
        console.log("\nTest 12: Attempt cd home, and then to parent (expected: /home");
        await this._runCommand("cd ~/..");
        console.log("Test 12: Verify directory is now /home after cd");
        await this._runCommand("pwd");


        // --- Final State Check and Cleanup ---
        console.log("\n--- Final State Check and Cleanup ---");
        console.log("Cleanup: Ensuring return to home directory");
        await this._runCommand("cd ~");

        console.log("\n--- cd command tests finished ---");
    }

    /**
     * @brief Tests the 'mkdir' (make directory) command.
     * Matches the testing style of testLs/testCd.
     */
    async testMkdir() {
        console.log("--- Starting mkdir command tests ---");

        console.log("\n--- Initial State Check ---");
        console.log("Initial State: Go to home and list contents before creating directories");
        await this._runCommand("cd ~");
        await this._runCommand("pwd");
        await this._runCommand("ls");

        // --- Basic Creation ---
        console.log("\n--- Testing Basic Creation ---");

        // Test 1: Create a single directory
        console.log("\nTest 1: Create a single directory 'test_dir_1'");
        await this._runCommand("mkdir test_dir_1");
        console.log("Test 1: Verify 'test_dir_1' creation");
        await this._runCommand("ls");

        // Test 2: Create multiple directories at once
        console.log("\nTest 2: Create multiple directories 'test_dir_2' 'test_dir_3'");
        await this._runCommand("mkdir test_dir_2 test_dir_3");
        console.log("Test 2: Verify 'test_dir_2' and 'test_dir_3' creation");
        await this._runCommand("ls");

        // --- Recursive Creation (-p) ---
        console.log("\n--- Testing Recursive Creation (-p) ---");

        // Test 3: Create nested directories using the '-p' flag (parents should be created)
        console.log("\nTest 3: Create nested directories 'nested/dir/creation' with -p flag");
        await this._runCommand("mkdir -p nested/dir/creation");
        console.log("Test 3: Verify nested directory 'creation' exists by listing parent");
        await this._runCommand("ls nested/dir");

        // --- Error Handling ---
        console.log("\n--- Testing Error Handling ---");

        // Test 4: Attempt to create an already existing directory (expect error)
        console.log("\nTest 4: Attempt to create existing directory 'test_dir_1' (expect error)");
        await this._runCommand("mkdir test_dir_1");

        // Test 5: Attempt to create nested directories without '-p' (expect error if parent doesn't exist)
        console.log("\nTest 5: Attempt to create nested directories 'deep/nonexistent/path' without -p (expect error)");
        await this._runCommand("mkdir deep/nonexistent/path");

        // --- Cleanup ---
        console.log("\n--- Cleanup ---");
        console.log("Cleanup: Remove created test directories (test_dir_1, test_dir_2, test_dir_3, nested)");
        await this._runCommand("rm -r test_dir_1 test_dir_2 test_dir_3 nested");
        console.log("Cleanup: Attempt removal of 'deep' (may error harmlessly if parent 'deep' wasn't created)");
        await this._runCommand("rm -r deep");
        console.log("Cleanup: Verify cleanup");
        await this._runCommand("ls");

        console.log("\n--- mkdir command tests finished ---");
    }

    /**
     * @brief Tests the 'echo' command thoroughly.
     * Matches the testing style of testCd.
     */
    async testEcho() {
        console.log("--- Starting echo command tests ---");

        // --- Basic Usage ---
        console.log("\n--- Testing Basic Usage ---");

        // Test 1: Echo a simple string
        console.log("\nTest 1: Echo a simple string 'Hello World'");
        await this._runCommand("echo Hello World");

        // --- Quoting Behavior ---
        console.log("\n--- Testing Quoting Behavior ---");

        // Test 2: Echo a string with multiple spaces, using single quotes (preserves spaces)
        console.log("\nTest 2: Echo string 'String with   multiple spaces' (single quoted)");
        await this._runCommand("echo 'String with   multiple spaces'");

        // Test 3: Echo a string with multiple spaces, without quotes (spaces collapse)
        console.log("\nTest 3: Echo string 'String with   multiple spaces' (unquoted - spaces should collapse)");
        await this._runCommand("echo String with   multiple spaces");

        // Test 4: Echo a string using double quotes (preserves spaces)
        console.log("\nTest 4: Echo string \"Double quoted string\" (double quoted)");
        await this._runCommand('echo "Double quoted string"');

        // --- Edge Cases ---
        console.log("\n--- Testing Edge Cases ---");

        // Test 5: Echo with no arguments (should print a newline)
        console.log("\nTest 5: Echo with no arguments (expect newline)");
        await this._runCommand("echo");

        // Test 6: Echo just single quotes (should print empty string then newline)
        console.log("\nTest 6: Echo empty single quotes '' (expect newline)");
        await this._runCommand("echo ''");

        // Test 7: Echo just double quotes (should print empty string then newline)
        console.log("\nTest 7: Echo empty double quotes \"\" (expect newline)");
        await this._runCommand('echo ""');


        console.log("\n--- echo command tests finished ---");
    }

    /**
     * @brief Tests the 'cat' (concatenate and display files) command.
     * Matches the testing style of testLs/testCd.
     */
    async testCat() {
        console.log("--- Starting cat command tests ---");

        console.log("\n--- Setup ---");
        console.log("Setup: Navigate to Documents directory");
        await this._runCommand("cd ~/Documents");
        console.log("Setup: Verify current directory");
        await this._runCommand("pwd");
        console.log("Setup: Show initial contents for context");
        await this._runCommand("ls");

        // --- Testing Basic File Display ---
        console.log("\n--- Testing Basic File Display ---");

        // Test 1: Cat a single existing file
        console.log("\nTest 1: cat resume.txt (display single file)");
        await this._runCommand("cat resume.txt");

        // Test 2: Cat multiple existing files (output should be concatenated)
        console.log("\nTest 2: cat notes.txt project_ideas.txt (display multiple files)");
        await this._runCommand("cat notes.txt project_ideas.txt");

        // Test 3: Attempt to cat a file in another directory using relative path
        console.log("\nTest 3: cat project_files/config.json (file in subdirectory)");
        await this._runCommand("cat project_files/config.json");

        // Test 4: Attempt to cat a file using absolute path
        console.log("\nTest 4: cat /home/user/Documents/resume.txt (file via absolute path)");
        await this._runCommand("cat /home/user/Documents/resume.txt"); // Adjust if home path differs

        // --- Testing Error Conditions ---
        console.log("\n--- Testing Error Conditions ---");

        // Test 5: Attempt to cat a non-existent file (expect error)
        console.log("\nTest 5: cat non_existent_file.txt (non-existent file, expect error)");
        await this._runCommand("cat non_existent_file.txt");

        // Test 6: Attempt to cat a directory (expect error)
        console.log("\nTest 6: cat project_files (attempt cat on directory, expect error)");
        await this._runCommand("cat project_files");

        // Test 7: Improper arguments usage (no arguments)
        console.log("\nTest 7: cat (no arguments - expect usage/error)");
        await this._runCommand("cat");

        console.log("\n--- cat command tests finished ---");
    }

    /**
     * @brief Tests the functionality of the 'cp' command.
     * Matches the testing style of testLs/testCd.
     */
    async testCp() {
        /* Bugs
        - copying multiple files to an existent directory (Check Test 8 carefully)
        */

        console.log("--- Starting cp command tests ---");

        console.log("\n--- Setup ---");
        console.log("Setup: Go into Documents directory");
        await this._runCommand("cd ~/Documents");
        console.log("Setup: Verify current directory");
        await this._runCommand("pwd");
        console.log("Setup: Show initial contents");
        await this._runCommand("ls");
        // Cleanup potentially leftover items from previous failed runs
        console.log("Setup: (Cleanup) Remove potential leftovers: project_files_copy, resume_copy.txt, ../another_dir");
        await this._runCommand("rm -r project_files_copy resume_copy.txt ../another_dir"); // Ignore errors if they don't exist
        await this._runCommand("rm ../resume.txt ../resume_copy.txt"); // Clean up potential copies in parent
        await this._runCommand("rm -r ../project_files"); // Clean up potential dir copy in parent

        // --- SOURCE: Single Directory ---
        console.log("\n--- Testing Single Directory Source ---");

        // Test 1: No parameters (should typically result in an error)
        console.log("\nTest 1: cp (no parameters, expect error)");
        await this._runCommand("cp");

        // Test 2: Non-recursive directory copy to existing directory (should fail)
        console.log("\nTest 2: cp project_files .. (non-recursive dir to existing dir ~, expect error)");
        await this._runCommand("cp project_files .."); // Target: ~/
        console.log("Test 2: Verify 'project_files' not copied to parent");
        await this._runCommand("ls .."); // Should not show project_files (unless it existed before)

        // Test 3: Non-recursive directory copy to existing file (should fail)
        console.log("\nTest 3: cp project_files resume.txt (non-recursive dir to existing file, expect error)");
        await this._runCommand("cp project_files resume.txt");

        // Test 4: Recursive directory copy to non-existent destination
        console.log("\nTest 4: cp -r project_files project_files_copy (recursive dir to new dir)");
        await this._runCommand("cp -r project_files project_files_copy");
        console.log("Test 4: Verify 'project_files_copy' exists");
        await this._runCommand("ls"); // Verify 'project_files_copy' exists in Documents
        console.log("Test 4: Verify contents of 'project_files_copy'");
        await this._runCommand("ls project_files_copy"); // Verify contents were copied

        // --- SOURCE: Single File ---
        console.log("\n--- Testing Single File Source ---");

        // Test 5: File to non-existent file (creates a copy)
        console.log("\nTest 5: cp resume.txt resume_copy.txt (file to new file)");
        await this._runCommand("cp resume.txt resume_copy.txt");
        console.log("Test 5: Verify 'resume_copy.txt' exists");
        await this._runCommand("ls"); // Verify 'resume_copy.txt' exists

        // Test 6: File to existing file (overwrites)
        console.log("\nTest 6: cp resume.txt notes.txt (file to existing file, should overwrite)");
        await this._runCommand("cp resume.txt notes.txt"); // Overwrites notes.txt
        console.log("Test 6: Verify contents of 'notes.txt' (should match resume.txt)");
        await this._runCommand("cat notes.txt");

        // Test 7: File to existing directory (copies file into directory)
        console.log("\nTest 7: cp project_ideas.txt project_files (file to existing dir)");
        await this._runCommand("cp project_ideas.txt project_files");
        console.log("Test 7: Verify 'project_ideas.txt' is inside 'project_files'");
        await this._runCommand("ls project_files"); // Verify 'project_ideas.txt' is inside

        // --- SOURCE: Multiple Sources ---
        console.log("\n--- Testing Multiple Sources ---");

        // Test 8: Multiple files to existing directory (valid)
        console.log("\nTest 8: cp resume.txt notes.txt project_files_copy (multiple files to existing dir)");
        await this._runCommand("ls");
        console.log("Final verification: List contents of Documents directory");
        await this._runCommand("ls Documents");


        console.log("\n--- cp command tests finished ---");
    }

    /**
     * @brief Tests the 'mv' (move/rename) command using items copied from the existing filesystem.
     * Matches the testing style of testLs/testCd.
     */
    async testMv() {
        console.log("--- Starting mv command tests ---");

        // --- Setup ---
        console.log("\n--- Setup ---");
        console.log("Setup: Go to home directory");
        await this._runCommand("cd ~");
        console.log("Setup: Verify current directory (~)");
        await this._runCommand("pwd");
        console.log("Setup: Clean up any previous test area 'mv_test_area' (ignore errors)");
        await this._runCommand("rm -r mv_test_area");

        console.log("Setup: Create main test directory 'mv_test_area'");
        await this._runCommand("mkdir mv_test_area");
        console.log("Setup: Enter test area 'mv_test_area'");
        await this._runCommand("cd mv_test_area");
        console.log("Setup: Verify current directory is mv_test_area");
        await this._runCommand("pwd");

        console.log("Setup: Copying items into test area...");
        console.log("Setup: Copy resume.txt for renaming test");
        await this._runCommand("cp ~/Documents/resume.txt file_to_rename.txt");
        console.log("Setup: Copy notes.txt for moving test");
        await this._runCommand("cp ~/Documents/notes.txt file_to_move.txt");
        console.log("Setup: Copy project_files/ dir for renaming test");
        await this._runCommand("cp -r ~/Documents/project_files dir_to_rename");
        console.log("Setup: Copy vacation/ dir for moving test");
        await this._runCommand("cp -r ~/Pictures/Photos/vacation dir_to_move"); // Copies 'vacation' dir
        console.log("Setup: Create an empty destination directory 'existing_dest_dir'");
        await this._runCommand("mkdir existing_dest_dir");
        console.log("Setup: Copy project_ideas.txt into dest dir for overwrite test");
        await this._runCommand("cp ~/Documents/project_ideas.txt existing_dest_dir/target_to_overwrite.txt");
        console.log("Setup: Copy wallpaper.jpg for multi-move error test");
        await this._runCommand("cp ~/Downloads/wallpaper.jpg another_file.jpg");

        console.log("Setup: Initial listing of mv_test_area top-level");
        await this._runCommand("ls");
        console.log("Setup: List initial dir_to_rename");
        await this._runCommand("ls dir_to_rename");
        console.log("Setup: List initial dir_to_move (should show beach.jpg etc.)");
        await this._runCommand("ls dir_to_move");
        console.log("Setup: List initial existing_dest_dir");
        await this._runCommand("ls existing_dest_dir");

        // --- File Operations ---
        console.log("\n--- Testing File Operations ---");

        // Test 1: Rename file in the same directory
        console.log("\nTest 1: Rename file_to_rename.txt -> renamed_file.txt");
        await this._runCommand("mv file_to_rename.txt renamed_file.txt");
        console.log("Test 1: Verify renamed_file.txt exists, original is gone");
        await this._runCommand("ls");

        // Test 2: Move file into an existing directory
        console.log("\nTest 2: Move file_to_move.txt into existing_dest_dir/");
        await this._runCommand("mv file_to_move.txt existing_dest_dir/");
        console.log("Test 2: Verify file_to_move.txt gone from top-level");
        await this._runCommand("ls");
        console.log("Test 2: Verify file_to_move.txt is inside existing_dest_dir");
        await this._runCommand("ls existing_dest_dir");

        // Test 3: Overwrite an existing file with a moved file
        console.log("\nTest 3: Move renamed_file.txt onto existing_dest_dir/target_to_overwrite.txt (Overwrite)");
        await this._runCommand("mv renamed_file.txt existing_dest_dir/target_to_overwrite.txt");
        console.log("Test 3: Verify renamed_file.txt is gone from top-level");
        await this._runCommand("ls");
        console.log("Test 3: Verify target_to_overwrite.txt still exists (content changed)");
        await this._runCommand("ls existing_dest_dir");
        // Optional: Check content if cat is reliable
        // console.log("Test 3: Verify content (should be from resume.txt)");
        // await this._runCommand("cat existing_dest_dir/target_to_overwrite.txt");

        // --- Directory Operations ---
        console.log("\n--- Testing Directory Operations ---");

        // Test 4: Rename directory in the same directory
        console.log("\nTest 4: Rename dir_to_rename -> renamed_dir");
        await this._runCommand("mv dir_to_rename renamed_dir");
        console.log("Test 4: Verify renamed_dir exists, original is gone");
        await this._runCommand("ls");
        console.log("Test 4: Verify contents (README.md, etc.) moved with renamed_dir");
        await this._runCommand("ls renamed_dir");

        // Test 5: Move directory into an existing directory
        console.log("\nTest 5: Move dir_to_move (vacation/) into existing_dest_dir/");
        await this._runCommand("mv dir_to_move existing_dest_dir/"); // Should become existing_dest_dir/vacation
        console.log("Test 5: Verify dir_to_move gone from top-level");
        await this._runCommand("ls");
        console.log("Test 5: Verify 'vacation' directory is inside existing_dest_dir");
        await this._runCommand("ls existing_dest_dir");
        console.log("Test 5: Verify contents (beach.jpg, etc.) moved with vacation/");
        await this._runCommand("ls existing_dest_dir/vacation");

        // --- Error Conditions ---
        console.log("\n--- Testing Error Conditions ---");

        // Test 6: Source does not exist
        console.log("\nTest 6: Attempt move non_existent_file.txt to . (expect error)");
        await this._runCommand("mv non_existent_file.txt .");

        // Test 7: Attempt to move a directory onto an existing file
        console.log("\nTest 7: Attempt move directory 'renamed_dir' onto file 'existing_dest_dir/file_to_move.txt' (expect error)");
        await this._runCommand("mv renamed_dir existing_dest_dir/file_to_move.txt"); // Use the file moved in Test 2
        console.log("Test 7: Verify 'renamed_dir' still exists after failed move");
        await this._runCommand("ls");
        console.log("Test 7: Verify 'file_to_move.txt' still exists after failed move");
        await this._runCommand("ls existing_dest_dir");

        // Test 8: Attempt to move multiple sources to a file destination
        console.log("\nTest 8 (Setup): Create a temporary file target 'temp_target_file.txt'");
        await this._runCommand("cp existing_dest_dir/file_to_move.txt temp_target_file.txt");
        console.log("Test 8: Attempt move multiple items (renamed_dir, another_file.jpg) onto file 'temp_target_file.txt' (expect error)");
        await this._runCommand("mv renamed_dir another_file.jpg temp_target_file.txt");
        console.log("Test 8 (Cleanup): Remove temp target 'temp_target_file.txt'");
        await this._runCommand("rm temp_target_file.txt");

        // Test 9: Attempt to move item onto itself
        console.log("\nTest 9: Attempt move 'renamed_dir' onto itself (expect error or no-op)");
        await this._runCommand("mv renamed_dir renamed_dir");
        console.log("Test 9: Verify 'renamed_dir' still exists");
        await this._runCommand("ls");

        // Test 10: Attempt to move a parent directory into its child
        console.log("\nTest 10: Attempt move 'existing_dest_dir' into its child 'existing_dest_dir/vacation' (expect error)");
        await this._runCommand("mv existing_dest_dir existing_dest_dir/vacation");
        console.log("Test 10: Verify 'existing_dest_dir' still exists");
        await this._runCommand("ls");


        // --- Cleanup ---
        console.log("\n--- Cleanup ---");
        console.log("Cleanup: Go back to home directory");
        await this._runCommand("cd .."); // Exit mv_test_area
        console.log("Cleanup: Remove the main test directory 'mv_test_area'");
        await this._runCommand("rm -r mv_test_area");
        console.log("Cleanup: Final listing of home directory");
        await this._runCommand("ls");

        console.log("\n--- mv command tests finished ---");
    }

    /**
     * @brief Tests the 'rm' (remove) command.
     * Matches the testing style of testLs/testCd.
     */
    async testRm() {
        console.log("--- Starting rm command tests ---");

        // --- Setup ---
        console.log("\n--- Setup ---");
        console.log("Setup: Go to home directory");
        await this._runCommand("cd ~");
        console.log("Setup: Clean up potential leftovers from previous runs");
        await this._runCommand("rm -r rm_test_dir_empty rm_test_dir_nested rm_test_file1.txt rm_test_file2.txt rm_multi1.txt rm_multi2.txt"); // Ignore errors
        console.log("Setup: Create files and directories for removal tests");
        await this._runCommand("mkdir rm_test_dir_empty rm_test_dir_nested");
        await this._runCommand("touch rm_test_file1.txt rm_test_file2.txt"); // Use touch for empty files
        await this._runCommand("touch rm_test_dir_nested/nested.txt"); // Use touch for nested file

        console.log("Setup: List contents before rm tests");
        await this._runCommand("ls");
        console.log("Setup: List nested directory contents");
        await this._runCommand("ls rm_test_dir_nested");

        // --- File Removal ---
        console.log("\n--- Testing File Removal ---");

        // Test 1: Remove a single existing file
        console.log("\nTest 1: Remove single file 'rm_test_file1.txt'");
        await this._runCommand("rm rm_test_file1.txt");
        console.log("Test 1: Verify file 'rm_test_file1.txt' removed");
        await this._runCommand("ls");

        // Test 2: Remove multiple files at once
        console.log("\nTest 2 (Setup): Create multiple files for removal");
        await this._runCommand("touch rm_multi1.txt rm_multi2.txt");
        console.log("Test 2: Remove multiple files 'rm_multi1.txt' 'rm_multi2.txt'");
        await this._runCommand("rm rm_multi1.txt rm_multi2.txt");
        console.log("Test 2: Verify multiple files removed");
        await this._runCommand("ls");

        // --- Directory Removal ---
        console.log("\n--- Testing Directory Removal ---");

        // Test 3: Attempt to remove an empty directory without '-r' flag (should fail on standard rm)
        console.log("\nTest 3: Attempt remove empty directory 'rm_test_dir_empty' without -r (expect error)");
        await this._runCommand("rm rm_test_dir_empty");
        console.log("Test 3: Verify empty directory 'rm_test_dir_empty' still exists");
        await this._runCommand("ls");

        // Test 4: Attempt to remove a non-empty directory without '-r' flag (expect error)
        console.log("\nTest 4: Attempt remove non-empty directory 'rm_test_dir_nested' without -r (expect error)");
        await this._runCommand("rm rm_test_dir_nested");
        console.log("Test 4: Verify non-empty directory 'rm_test_dir_nested' still exists");
        await this._runCommand("ls");


        // --- Recursive Removal (-r) ---
        console.log("\n--- Testing Recursive Removal (-r) ---");

        // Test 5: Remove an empty directory using the '-r' flag
        console.log("\nTest 5: Remove empty directory 'rm_test_dir_empty' with -r");
        await this._runCommand("rm -r rm_test_dir_empty");
        console.log("Test 5: Verify empty directory 'rm_test_dir_empty' removed");
        await this._runCommand("ls");

        // Test 6: Remove a non-empty directory using the '-r' flag
        console.log("\nTest 6: Remove non-empty directory 'rm_test_dir_nested' with -r");
        await this._runCommand("rm -r rm_test_dir_nested");
        console.log("Test 6: Verify non-empty directory 'rm_test_dir_nested' removed");
        await this._runCommand("ls");

        // --- Error Handling ---
        console.log("\n--- Testing Error Handling ---");

        // Test 7: Attempt to remove a non-existent file (expect error)
        console.log("\nTest 7: Attempt remove non-existent file 'rm_test_file_nonexistent.txt' (expect error)");
        await this._runCommand("rm rm_test_file_nonexistent.txt");

        // Test 8: Attempt to remove root '/' (should be prevented)
        console.log("\nTest 8: Attempt remove root directory '/' (expect error)");
        await this._runCommand("rm -r /");

        // Test 9: Attempt to remove current directory '.' (should be prevented)
        console.log("\nTest 9: Attempt remove current directory '.' (expect error)");
        await this._runCommand("rm -r ."); // Use -r as '.' refers to a directory

        // Test 10: Attempt to remove parent directory '..' (should be prevented)
        console.log("\nTest 10: Attempt remove parent directory '..' (expect error)");
        await this._runCommand("rm -r .."); // Use -r as '..' refers to a directory


        // --- Cleanup ---
        console.log("\n--- Cleanup ---");
        console.log("Cleanup: Remove remaining test file 'rm_test_file2.txt'");
        await this._runCommand("rm rm_test_file2.txt");
        console.log("Cleanup: Verify final state");
        await this._runCommand("ls");

        console.log("\n--- rm command tests finished ---");
    }

    /**
     * @brief Tests the 'touch' command.
     * Matches the testing style of testLs/testCd.
     */
    async testTouch() {
        console.log("--- Starting touch command tests ---");

        // --- Setup ---
        console.log("\n--- Setup ---");
        console.log("Setup: Ensure home directory");
        await this._runCommand("cd ~");
        console.log("Setup: Clean up previous test area 'touch_test_area' (ignore errors)");
        await this._runCommand("rm -r touch_test_area");
        console.log("Setup: Create main test directory 'touch_test_area'");
        await this._runCommand("mkdir touch_test_area");
        console.log("Setup: Enter test area 'touch_test_area'");
        await this._runCommand("cd touch_test_area");
        console.log("Setup: Verify current directory is touch_test_area");
        await this._runCommand("pwd");

        console.log("Setup: Create pre-existing file 'existing_file.txt'");
        await this._runCommand("touch existing_file.txt");
        console.log("Setup: Create pre-existing directory 'existing_dir'");
        await this._runCommand("mkdir existing_dir");
        console.log("Setup: Initial listing of touch_test_area");
        await this._runCommand("ls");

        // --- File Creation ---
        console.log("\n--- Testing File Creation ---");

        // Test 1: Create a single new file
        console.log("\nTest 1: Create single new file 'new_single_file.txt'");
        await this._runCommand("touch new_single_file.txt");
        console.log("Test 1: Verify 'new_single_file.txt' exists");
        await this._runCommand("ls");

        // Test 2: Create multiple new files at once (with and without extensions)
        console.log("\nTest 2: Create multiple files ('multi_file1.log', 'multi_file2', 'multi_file3.txt')"); // Changed .js to .txt
        await this._runCommand("touch multi_file1.log multi_file2 multi_file3.txt");
        console.log("Test 2: Verify multiple files exist");
        await this._runCommand("ls");

        // Test 3: Create a file inside an existing subdirectory
        console.log("\nTest 3: Create file 'nested_new_file.txt' inside 'existing_dir'"); // Changed .dat to .txt
        await this._runCommand("touch existing_dir/nested_new_file.txt");
        console.log("Test 3: Verify 'nested_new_file.txt' exists in 'existing_dir'");
        await this._runCommand("ls existing_dir");

        // --- Timestamp Update ---
        console.log("\n--- Testing Timestamp Update ---");

        // Test 4: Touch an existing file (updates timestamp, no visible output change usually)
        console.log("\nTest 4: Touch existing file 'existing_file.txt'");
        await this._runCommand("touch existing_file.txt");
        console.log("Test 4: Verify 'existing_file.txt' still exists after touch");
        await this._runCommand("ls");

        // Test 5: Touch an existing directory (updates timestamp)
        console.log("\nTest 5: Touch existing directory 'existing_dir'");
        await this._runCommand("touch existing_dir");
        console.log("Test 5: Verify 'existing_dir' still exists after touch");
        await this._runCommand("ls");

        // --- Error Conditions ---
        console.log("\n--- Testing Error Conditions ---");

        // Test 6: Attempt to touch with no arguments
        console.log("\nTest 6: Attempt touch with no arguments (expect 'too few arguments' error)");
        await this._runCommand("touch");

        // Test 7: Attempt to touch a file where the parent directory does not exist
        console.log("\nTest 7: Attempt touch in non-existent dir 'non_existent_dir/some_file.txt' (expect path resolution error)");
        await this._runCommand("touch non_existent_dir/some_file.txt");

        // Test 8: Attempt to touch a file with an invalid name (assuming '/' is invalid)
        console.log("\nTest 8: Attempt touch with invalid character '/' in name 'invalid/name.txt' (expect 'invalid file name' error)");
        await this._runCommand("touch 'invalid/name.txt'"); // Depends on FSUtil.isValidFileName

        // --- Cleanup ---
        console.log("\n--- Cleanup ---");
        console.log("Cleanup: Go back to home directory");
        await this._runCommand("cd .."); // Exit touch_test_area
        console.log("Cleanup: Remove the main test directory 'touch_test_area'");
        await this._runCommand("rm -r touch_test_area");
        console.log("Cleanup: Final listing of home directory");
        await this._runCommand("ls");

        console.log("\n--- touch command tests finished ---");
    }

    /**
     * @brief Tests the 'todo' command.
     * Matches the testing style of testLs/testCd.
     */
    async testTodo() {
        console.log("--- Starting todo command tests ---");

        // Test 1: Display the TODO list
        console.log("\nTest 1: Display the TODO list");
        await this._runCommand("todo");

        console.log("\n--- todo command tests finished ---");
    }

    /**
     * Runs all defined test methods sequentially.
     * Ensures a clean state before starting and provides overall status logs.
     */
    async runFullSuite() {
        console.log("\n------------------------------");
        console.log("--- Running Full Test Suite ---");
        console.log("------------------------------");

        // Reset to a known state (home directory) before starting tests
        console.log("Suite Setup: Resetting to home directory");
        await this._runCommand("cd ~", 100); // Added small delay

        // Execute tests sequentially, awaiting each completion
        await this.testPwd();
        await this.testLs();
        await this.testCd();    // Test cd early as it's fundamental for navigation
        await this.testMkdir(); // Test mkdir before commands that need directories
        await this.testTouch(); // Test touch before commands that might modify files (cat, cp, rm)
        await this.testEcho();  // Test echo before commands that might use its output conceptually
        await this.testCat();
        await this.testCp();
        await this.testMv();
        await this.testRm();    // Test rm after commands that create files/dirs
        // await this.testTree(); // Uncomment when testTree is implemented
        await this.testTodo();

        console.log("\n------------------------------");
        console.log("--- Test Suite Complete ---");
        console.log("------------------------------");
    }
}

// --- How to Use ---
// 1. Ensure this file ('testsuit.js') is correctly placed in your project structure.
// 2. Import the TestSuite class where you initialize your Terminal (e.g., in `main.js`):
//    import { TestSuite } from './testing/testsuit.js'; // Adjust path if necessary
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