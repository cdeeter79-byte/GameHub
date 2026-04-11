const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
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

// React Native Web: resolve .web.tsx/.web.ts before .tsx/.ts
config.resolver.sourceExts = [
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
  ...config.resolver.sourceExts,
];

// Resolve workspace package symlinks
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
