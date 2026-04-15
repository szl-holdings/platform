const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;

config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, "lib/api-client-react"),
  path.resolve(workspaceRoot, "lib/mobile-shared"),
  path.resolve(workspaceRoot, "lib/api-zod"),
  path.resolve(workspaceRoot, "packages"),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = true;
config.resolver.useWatchman = false;

module.exports = config;
