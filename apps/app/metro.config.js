const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot, {
  isCSSEnabled: true,
});

// Support monorepo workspace packages
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Note: Expo's getDefaultConfig already handles web platform resolution.
// Do NOT prepend web.* extensions here — it causes Metro to resolve web-only
// files (e.g. DevLoadingView.web.js) on native builds, breaking the simulator.

// Resolve workspace package symlinks
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
