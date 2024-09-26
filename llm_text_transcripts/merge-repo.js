const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptUser(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

const MAX_LINES_PER_FILE = 3300;

const noTextList = ["n", "no", "nope"];
const certainTextList = ["c", "certain"];
// Add more extensions if needed
const excludeExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
  ".tiff",
  ".ico",
  ".mp4",
  ".mp3",
];
// Add more patterns if needed
const excludePatterns = [
  "node_modules",
  ".env",
  ".DS_Store",
  ".git",
  ".gitignore",
  ".dockerignore",
  ".nvmrc",
  "lib",
  "yarn.lock",
  "package-lock.json",
  "llm_text_transcripts",
  "docs",
  "build",
  "assets",
  "dist",
  "app.log",
  "LICENSE",
  ".editorconfig",
  "public",
];
const userExcludedItems = [];

async function selectFiles(currentDir, excludePatterns, baseDir) {
  const selectedFiles = [];

  const files = await fs.promises.readdir(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      if (!excludePatterns.includes(file)) {
        const includeFolder = await promptUser(
          `Include folder '${file}'? (y/n/c) `
        );
        if (!noTextList.includes(includeFolder.toLowerCase())) {
          if (certainTextList.includes(includeFolder.toLowerCase())) {
            const subFiles = await selectFiles(
              filePath,
              excludePatterns,
              baseDir
            );
            selectedFiles.push(...subFiles);
          } else {
            const allFiles = await getAllFiles(filePath, excludePatterns);
            selectedFiles.push(...allFiles);
          }
        } else {
          userExcludedItems.push("/" + path.relative(baseDir, filePath)); // Add leading slash
        }
      }
    } else {
      if (
        !excludePatterns.includes(file) &&
        !excludeExtensions.includes(path.extname(file).toLowerCase())
      ) {
        const includeFile = await promptUser(`Include file '${file}'? (y/n) `);
        if (!noTextList.includes(includeFile.toLowerCase())) {
          selectedFiles.push(filePath);
        } else {
          userExcludedItems.push("/" + path.relative(baseDir, filePath)); // Add leading slash
        }
      }
    }
  }

  return selectedFiles;
}

async function getAllFiles(dir, excludePatterns) {
  const files = [];
  const items = await fs.promises.readdir(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = await fs.promises.stat(itemPath);
    if (stats.isDirectory()) {
      if (!excludePatterns.includes(item)) {
        const subFiles = await getAllFiles(itemPath, excludePatterns);
        files.push(...subFiles);
      }
    } else {
      if (
        !excludePatterns.includes(item) &&
        !excludeExtensions.includes(path.extname(item).toLowerCase())
      ) {
        files.push(itemPath);
      }
    }
  }
  return files;
}

async function mergeFiles(selectedFiles, outputFilePath, baseDir) {
  let mergedContent = "";
  let totalLines = 0;
  let filePart = 1;

  for (const filePath of selectedFiles) {
    try {
      const fileContent = await fs.promises.readFile(filePath, "utf-8");
      const relativeFilePath = "/" + path.relative(baseDir, filePath);
      const sectionHeader = `\n${relativeFilePath.toUpperCase()} CODE IS BELOW\n`;
      const newContent = sectionHeader + fileContent + "\n";
      const newContentLines = newContent.split("\n").length;

      // Check if adding this content would exceed the line limit
      if (totalLines + newContentLines > MAX_LINES_PER_FILE) {
        // Write current merged content to a new part file
        const partFilePath = getPartFileName(outputFilePath, filePart);
        await fs.promises.writeFile(partFilePath, mergedContent);
        console.log(`Merged repository saved to: ${partFilePath}`);

        // Reset for the next part
        mergedContent = "";
        totalLines = 0;
        filePart++;
      }

      // Add the new content
      mergedContent += newContent;
      totalLines += newContentLines;
    } catch (error) {
      console.error(`Error reading file '${filePath}':`, error.message);
    }
  }

  // Write any remaining content to the last part file
  if (mergedContent) {
    const partFilePath = getPartFileName(outputFilePath, filePart);
    await fs.promises.writeFile(partFilePath, mergedContent);
    console.log(`Merged repository saved to: ${partFilePath}`);
  }
}

function getPartFileName(baseFileName, part) {
  const ext = path.extname(baseFileName);
  const name = path.basename(baseFileName, ext);
  // replace name with name-part1
  return baseFileName.replace(name, `${name}-part${part}`);
}

async function createOutputDirectory(outputDirPath) {
  try {
    await fs.promises.access(outputDirPath);
  } catch (error) {
    try {
      await fs.promises.mkdir(outputDirPath);
    } catch (mkError) {
      console.error(
        `Error creating directory '${outputDirPath}':`,
        mkError.message
      );
    }
  }
}

function getTimestampedFileName() {
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  return `merged-repo-${timestamp}.txt`;
}

async function main() {
  const currentDir = process.cwd();

  console.log("Select files and folders to include in the merge:");
  console.log(
    '- "y"(yes): press just enter to include file or all files in the folder, default is "y"(yes)'
  );
  console.log(
    '- "c"(certain): to only include certain files in a folder, you will be prompted per file'
  );
  console.log('- "n"(no): to not include the file or folder');

  let selectedFiles;
  try {
    selectedFiles = await selectFiles(currentDir, excludePatterns, currentDir);
  } catch (error) {
    console.error("Error selecting files:", error.message);
    rl.close();
    return;
  }

  const outputDirName = "llm_text_transcripts";
  const outputDirPath = path.join(currentDir, outputDirName);

  try {
    await createOutputDirectory(outputDirPath);
  } catch (error) {
    console.error("Error creating output directory:", error.message);
    rl.close();
    return;
  }

  const outputFileName = getTimestampedFileName();
  const outputFilePath = path.join(outputDirPath, outputFileName);

  try {
    await mergeFiles(selectedFiles, outputFilePath, currentDir);
    console.log(`Merged repository saved to: ${outputFilePath}`);
  } catch (error) {
    console.error("Error merging files:", error.message);
  }

  if (userExcludedItems.length > 0) {
    console.log(
      "\nThe following files and folders were excluded, for if you want to add it to constant excludePatterns:"
    );
    userExcludedItems.forEach((item) => console.log(item));
  }

  rl.close();
}

// Execute the script
main().catch((error) => {
  console.error("An error occurred during execution:", error.message);
  rl.close();
});
