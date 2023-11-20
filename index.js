const fs = require("fs").promises;
const path = require("path");

const dockerRegex = /FROM\snode:([0-9]+(\.[0-9]+)?(\.[0-9]+)?)/i;
const workflowRegex =
  /node-version:\s\[?"?([0-9]+(\.[0-9]+)?(\.[0-9]+)?)"?\]?/i;

const checkVersionConsistency = async (additionalFilePaths) => {
  const rootPath = ".";
  const predefinedPaths = {
    packageJson: path.join(rootPath, "package.json"),
    nvmrc: path.join(rootPath, ".nvmrc"),
    dockerfile: path.join(rootPath, "Dockerfile"),
    workflow: path.join(rootPath, ".github", "workflows", "nodejs.yml"),
  };

  const allPaths = { ...predefinedPaths };

  // Add additional file paths
  additionalFilePaths.forEach((filePath) => {
    const key = filePath.split("/").pop(); // Generating a unique key based on file name
    allPaths[key] = path.join(rootPath, filePath);
  });

  // Function to read file content
  const readFileContent = async (filePath) => {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (
        error.code === "ENOENT" &&
        filePath !== allPaths.packageJson &&
        filePath !== allPaths.dockerfile
      ) {
        return null; // File not essential
      }
      throw error; // Rethrow for essential files
    }
  };

  // Reading all files
  const fileContents = await Promise.all(
    Object.values(allPaths).map((filePath) => readFileContent(filePath))
  );

  // Extracting versions
  const versions = fileContents
    .map((content, index) => {
      if (!content) return null;
      const key = Object.keys(allPaths)[index];
      if (key === "packageJson") return JSON.parse(content).engines.node;
      if (key === "nvmrc") return content.trim();
      if (key === "dockerfile") return content.match(dockerRegex)?.[1];
      if (key.includes("yml")) return content.match(workflowRegex)?.[1];
      return null;
    })
    .filter(Boolean);

  // Checking consistency
  if (new Set(versions).size !== 1) {
    throw new Error(`Node.js version mismatch: ${JSON.stringify(versions)}`);
  }

  console.log(`Node.js version is consistent across all files: ${versions[0]}`);
};

// Parse additional file paths from environment variable as JSON
const additionalFilePaths = process.env.INPUT_ADDITIONALFILES
  ? process.env.INPUT_ADDITIONALFILES.split(/ ?, ?/g)
  : [];

checkVersionConsistency(additionalFilePaths).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
