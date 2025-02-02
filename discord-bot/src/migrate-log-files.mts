import * as fs from "fs";
import * as path from "path";

// This script loops through all subdirectories of the current folder.
// For each subdirectory:
//   - It creates a 'log.txt' file if it doesn't exist.
//   - It finds all files ending with .ogg and appends each filename to log.txt on a new line.

function processDirectory(directory: string) {
  console.log(`Processing directory: ${directory}`);
  const logFilePath = path.join(directory, "log.txt");
  // Create log.txt if it doesn't exist.
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "", "utf8");
  }

  // Read all entries in the directory.
  const entries = fs.readdirSync(directory);

  // Loop through entries in the directory.
  entries.forEach((entry) => {
    // Check if the entry is a file that ends with .ogg (case-insensitive).
    if (entry.toLowerCase().endsWith(".ogg")) {
      // Append the filename to log.txt
      fs.appendFileSync(logFilePath, entry + "\n", "utf8");
    }
  });
}

function main() {
  // Assume the base folder is the current working directory.
  const baseFolder = process.cwd();

  // Read all items in the base folder with their types.
  const items = fs.readdirSync(path.join(baseFolder, "src", "recordings"), {
    withFileTypes: true,
  });

  // Process only directories.
  items.forEach((item) => {
    if (item.isDirectory()) {
      const dirPath = path.join(baseFolder, "src", "recordings", item.name);
      processDirectory(dirPath);
    }
  });

  console.log("Log file migration completed.");
}

main();
