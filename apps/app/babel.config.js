module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@gamehub/config': '../../packages/config/src',
            '@gamehub/domain': '../../packages/domain/src',
            '@gamehub/ui': '../../packages/ui/src',
            '@gamehub/adapters': '../../packages/adapters/src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
