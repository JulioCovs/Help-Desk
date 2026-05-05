// Metro 0.83+ / Expo 54 uses Array.prototype.toReversed (Node 20+). Polyfill for Node 18.
if (typeof Array.prototype.toReversed !== "function") {
  Object.defineProperty(Array.prototype, "toReversed", {
    value: function toReversed() {
      return [...this].reverse();
    },
    configurable: true,
    writable: true,
  });
}

const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch workspace packages (e.g. @workspace/api-client-react)
const watch = new Set([...(config.watchFolders ?? []), workspaceRoot]);
config.watchFolders = [...watch];

// Single React instance for app + workspace libs + react-native-web (fixes Invalid hook call)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

function resolvePackageDir(name) {
  return path.dirname(require.resolve(`${name}/package.json`, { paths: [projectRoot] }));
}

config.resolver.extraNodeModules = {
  react: resolvePackageDir("react"),
  "react-dom": resolvePackageDir("react-dom"),
};

module.exports = config;
