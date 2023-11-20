const fs = require("fs").promises;
const path = require("path");
const core = require("@actions/core");

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
        filePath !== allPaths.nvmrc &&
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

  const multipleVersions = new Set(versions).size !== 1;

  const heading = multipleVersions
    ? "❌ Node.js versions (multiple versions detected)"
    : "✅ Node.js versions";

  const table = allPaths.map((filePath, index) => {
    const key = Object.keys(allPaths)[index];
    return [key, versions[index] ?? "Not found"];
  });

  await core.summary
    .addHeading(heading)
    .addTable([
      [
        { data: "File", header: true },
        { data: "Node.js version", header: true },
      ],
      ...table,
    ])
    .write();

  if (multipleVersions) throw new Error("Multiple Node.js versions detected");

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
