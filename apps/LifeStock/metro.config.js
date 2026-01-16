// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Drizzle ORM 需要 .sql 文件支持
config.resolver.sourceExts.push('sql');

// 启用 Package Exports 支持，解决 drizzle-orm 导入问题
config.resolver.unstable_enablePackageExports = true;


module.exports = withUniwindConfig(config, {
    // relative path to your global.css file (from previous step)
    cssEntryFile: './global.css',
    // (optional) path where we gonna auto-generate typings
    // defaults to project's root
    dtsFile: './uniwind-types.d.ts'
});