const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  env.mode = 'development';
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add this to handle image loading in web
  config.module.rules.push({
    test: /\.(png|jpe?g|gif|webp)$/i,
    use: ['file-loader']
  });

  return config;
}; 