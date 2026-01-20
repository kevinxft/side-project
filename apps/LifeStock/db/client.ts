import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

// 打开数据库
const expo = SQLite.openDatabaseSync("lifestock_v3.db");

// 创建 Drizzle 实例，带 schema 用于关系查询
export const db = drizzle(expo, { schema });

// 导出类型
export type Database = typeof db;
