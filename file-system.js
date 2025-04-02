
/*==================================================================================================
* @proj Web-Based Terminal
====================================================================================================
* @file: file-system.js
* @date: 03/23/2025
* @author: Tyler Neal
* @github: github.com/tn-dev
* @brief: A web-based terminal emulator with command history and UI controls
==================================================================================================*/

const SUPPORTED_TYPES = {
    dir: 'Directory',
    txt: 'Text File',
    jpg: 'JPEG Image',
    png: 'PNG Image'
}

/*==================================================================================================
    Filesystem Class
==================================================================================================*/
export class Filesystem {
    constructor(initialDirectory) {
        const {root, home, cwd} = this.createTestFilesystem();
        this.root = root;
        this.home = home;
        this.cwd = cwd;
    }

    /*  General
    ***********************************************************************************************/
    isValidName(name) {
        const errors = [];
        
        if (!name || name.length === 0) errors.push("empty");
        if (name.includes('/')) errors.push("contains slash");
        if (name.includes('\0')) errors.push("contains null character");
        if (name.length > 255) errors.push("exceeds max length");
        
        if (errors.length > 0) {
          console.error(`Error: file/folder name "${name}" is not valid: ${errors.join(", ")}`);
          return false;
        }
        
        return true;
    }

    abbreviateHomeDir(path) {
        const homeNameLength = this.home.getFilePath().length;
        if (path.substring(0, homeNameLength) == this.home.getFilePath()) {
            path = `~` + path.substring(homeNameLength);
        }
        return path;
    }

    /**
     * @brief Navigates to an absolute or relative path.
     * @param {string} path Path to directory to navigate to.
     * @returns 
     */
    navigateTo(path) {
        const status = {
          success: false,
          info: ''
        };
        
        // Root directory navigation
        if (path === '/') {
            this.cwd = this.root;
            status.success = true;
            return status;
        }

        // Home directory navigation
        if (path === '') {
            this.cwd = (this.home) ? this.home : this.root;
            status.success = true;
            return status;
        }
        
        // Tokenize filepath
        const isAbsolute = path[0] === '/';
        const folders = path.split('/').filter(item => item !== '' && this.isValidName(item));
        let cursor = isAbsolute ? this.root : this.cwd;
        
        // Iterate through directories
        for (const folder of folders) {
            if (folder === '.') {
                continue;
            } else if (folder === '..') {
                if (cursor.parent)
                    cursor = cursor.parent;
            } else {
                if (!cursor.hasChild(folder, 'dir')) {
                    status.info = 'Path does not exist';
                    return status;
                }
                cursor = cursor.getChild(folder);
            }
            
        }
        
        // Update current working directory
        this.cwd = cursor;
        status.success = true;
        return status;
    }

    /*  Printing
    ***********************************************************************************************/
    stringifyFilesystem() {
        let filesystemString = ''
        filesystemString += 'Filesystem:';
        filesystemString += '-----------';
        filesystemString += this.printSubsystem(this.root, 0);
        filesystemString += '-----------';

        return filesystemString;
    }

    stringifySubsystem(root, layer, string) {
        if (!root) return string;
        
        // Create indentation based on the current layer
        const spaces = layer * 3; // Assuming 2 spaces per level
        let indent = '';
        for (let i = 0; i < spaces; i++) {
            indent += ' ';
        }
        
        // Add the current node to output
        string += indent + root.name + '\n';

        // If node is a not a directory, return before child check
        if (!root.isDirectory) return string;
        
        // Recursively process children with incremented layer
        root.children.forEach((child) => {
            this.stringifySubsystem(child, layer + 1, string);
        });
    }

    /*  Testing
    ***********************************************************************************************/
    createTestFilesystem() {
        // Root level directories
        let root = new FSNode('/', 'dir');
        let home = new FSNode('home', 'dir');
        let usr = new FSNode('usr', 'dir');
        let etc = new FSNode('etc', 'dir');
        let vars = new FSNode('var', 'dir');
        let tmp = new FSNode('tmp', 'dir');
        
        // Add root level directories
        root.addChild(home);
        root.addChild(usr);
        root.addChild(etc);
        root.addChild(vars);
        root.addChild(tmp);
        
        // Home directory structure
        let userDir = new FSNode('user', 'dir');
        home.addChild(userDir);
        
        // User's personal directories
        let documents = new FSNode('Documents', 'dir');
        let pictures = new FSNode('Pictures', 'dir');
        let downloads = new FSNode('Downloads', 'dir');
        let desktop = new FSNode('Desktop', 'dir');
        userDir.addChild(documents);
        userDir.addChild(pictures);
        userDir.addChild(downloads);
        userDir.addChild(desktop);
        
        // Some hidden configuration files
        let bashrc = new FSNode('.bashrc', 'txt');
        bashrc.isHidden = true;
        let gitconfig = new FSNode('.gitconfig', 'txt');
        gitconfig.isHidden = true;
        userDir.addChild(bashrc);
        userDir.addChild(gitconfig);
        
        // Document files
        let resume = new FSNode('resume', 'txt');
        let notes = new FSNode('notes', 'txt');
        let project = new FSNode('project', 'txt');
        documents.addChild(resume);
        documents.addChild(notes);
        documents.addChild(project);
        
        // Project directory
        let projectDir = new FSNode('project_files', 'dir');
        documents.addChild(projectDir);
        let readme = new FSNode('README', 'txt');
        let config = new FSNode('config', 'txt');
        projectDir.addChild(readme);
        projectDir.addChild(config);
        
        // Pictures with image files
        let vacation = new FSNode('vacation', 'dir');
        pictures.addChild(vacation);
        let photo1 = new FSNode('beach', 'jpg');
        let photo2 = new FSNode('mountains', 'jpg');
        let photo3 = new FSNode('sunset', 'png');
        vacation.addChild(photo1);
        vacation.addChild(photo2);
        vacation.addChild(photo3);
        
        // Screenshots folder
        let screenshots = new FSNode('screenshots', 'dir');
        pictures.addChild(screenshots);
        let screen1 = new FSNode('screenshot1', 'png');
        let screen2 = new FSNode('screenshot2', 'png');
        screenshots.addChild(screen1);
        screenshots.addChild(screen2);
        
        // Downloads with mixed content
        let installer = new FSNode('app_installer', 'txt');
        let wallpaper = new FSNode('wallpaper', 'jpg');
        downloads.addChild(installer);
        downloads.addChild(wallpaper);
        
        // Desktop items
        let shortcut = new FSNode('shortcut', 'txt');
        let presentation = new FSNode('presentation', 'txt');
        desktop.addChild(shortcut);
        desktop.addChild(presentation);
        
        // System directories and files
        let bin = new FSNode('bin', 'dir');
        usr.addChild(bin);
        let systemConfig = new FSNode('system', 'txt');
        etc.addChild(systemConfig);
        let logs = new FSNode('logs', 'dir');
        vars.addChild(logs);
        let tempFile = new FSNode('temp', 'txt');
        tmp.addChild(tempFile);

        return { 
            root: root, 
            home: userDir, 
            cwd: userDir };
    }
}

/*==================================================================================================
    File/Folder Class
==================================================================================================*/
export class FSNode {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.isDirectory = (type === 'dir') ? true: false;
        this.isHidden = false;

        this.parent = null;
        this.children = (!this.isDirectory) ? null : new Map();

        this.metadata = {
            created: Date.now(),
            modified: Date.now(),
            size: 0
        };
        this.content = (this.isDirectory) ? null : '';
    }

    getFullName() {
        return (this.isDirectory) ? this.name : this.name + '.' + this.type;
    }

    getFilePath() {
        let node = this;
        let path = '';
        while (node) {
            path = node.name + path;
            // If the node has a parent and its not the root add a '/'
            if (node.parent && node.parent.name !== '/')
                path = '/' + path;
            node = node.parent;
        }
        return path;
    }

    hasChild(name, type) {
        // Check if child exists
        const child = this.children.get(name);
        if (child === undefined)
            return false;

        // If type specified, check if child's type matches
        if (type) {
            if (!(type in SUPPORTED_TYPES)) 
                return false;
            if (child.type !== type)
                return false;
        }

        return true;
    }

    getChild(childName) {
        if (!this.hasChild(childName)) {
            console.error(`Folder '${this.name}' has no child named '${childName}'`)
            return false;
        }

        return this.children.get(childName);
    }

    addChild(child) {
        if (this.hasChild(child.name)) {
            console.error(`Folder '${this.name}' already has child '${child.name}'`)
            return null;
        }
        child.parent = this;
        this.children.set(child.name, child);
        
        return true;
    }

    removeChild(childName) {
        if (!this.hasChild(childName)) {
            console.error(`Folder '${this.name}' has no child named '${childName}'`)
            return false;
        }

        this.children.delete(childName);
        return true;
    } 

    hide() {
        if (this.name[0] !== '.')
            this.name = '.' + this.name;
        this.isHidden = true;
    }

    unhide() {
        if (this.name[0] === '.') {
            this.name = this.name.substring(1);
        }
        this.isHidden = false;
    }
}