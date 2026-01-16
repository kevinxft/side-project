module.exports = function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            // Drizzle ORM 需要：内联导入 .sql 文件
            ["inline-import", { extensions: [".sql"] }],
        ],
    };
};
