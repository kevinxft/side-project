import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ============= 物品结构类型 =============
// 'stock' - 库存类：日用品、食品、保健品等
// 'card'  - 卡类：会员卡、充值卡
// 'phone' - 手机类：保号卡

// ============= 物品表 =============
export const items = sqliteTable("items", {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(), // 'stock' | 'card' | 'phone'
    name: text("name").notNull(),
    icon: text("icon"), // emoji 或图标名

    // ====== 通用字段 ======
    expiryDate: int("expiry_date"), // 到期/过期时间戳
    notes: text("notes"),

    // ====== 库存类字段 (kind: 'stock') ======
    quantity: real("quantity"), // 数量（支持小数）
    unit: text("unit"), // 单位
    minQuantity: real("min_quantity"), // 警戒库存
    location: text("location"), // 存放位置

    // ====== 卡类字段 (kind: 'card') ======
    balance: real("balance"), // 余额
    totalTimes: int("total_times"), // 总次数
    remainingTimes: int("remaining_times"), // 剩余次数
    merchantName: text("merchant_name"), // 商家名
    merchantPhone: text("merchant_phone"), // 商家电话

    // ====== 手机类字段 (kind: 'phone') ======
    phoneNumber: text("phone_number"), // 手机号
    carrier: text("carrier"), // 运营商
    monthlyFee: real("monthly_fee"), // 月租
    billingDate: int("billing_date"), // 扣费日 1-31
    lastActiveDate: int("last_active_date"), // 最后活跃

    // ====== 元数据 ======
    createdAt: int("created_at").notNull(),
    updatedAt: int("updated_at").notNull(),
});

// ============= 标签表 =============
export const tags = sqliteTable("tags", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color"), // 标签颜色
    icon: text("icon"), // 标签图标
    order: int("order").notNull().default(0),
});

// ============= 物品-标签关联表 =============
export const itemTags = sqliteTable("item_tags", {
    itemId: text("item_id")
        .notNull()
        .references(() => items.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
        .notNull()
        .references(() => tags.id, { onDelete: "cascade" }),
});

// ============= 交易记录表（会员卡消费等）=============
export const transactions = sqliteTable("transactions", {
    id: text("id").primaryKey(),
    itemId: text("item_id")
        .notNull()
        .references(() => items.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'recharge' | 'consume' | 'adjust'
    amount: real("amount").notNull(), // 金额或次数变化
    balanceAfter: real("balance_after"), // 交易后余额
    description: text("description"),
    createdAt: int("created_at").notNull(),
});

// ============= 类型推导 =============
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type ItemTag = typeof itemTags.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// ============= 辅助类型 =============
export type ItemKind = "stock" | "card" | "phone";
export type TransactionType = "recharge" | "consume" | "adjust";
