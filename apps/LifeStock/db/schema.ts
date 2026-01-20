import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ============= 物品类型枚举 =============
export type ItemType = "phone" | "product" | "account" | "supply" | "other";

// ============= 提醒类型枚举 =============
export type ReminderType = "one_time" | "recurring";

// ============= 周期单位枚举 =============
export type RecurrenceUnit = "day" | "week" | "month" | "year";

// ============= 物品表 =============
export const items = sqliteTable("items", {
    id: text("id").primaryKey(),
    type: text("type").notNull(), // 'phone' | 'product' | 'account' | 'supply' | 'other'
    name: text("name").notNull(), // 名称
    icon: text("icon"), // emoji 图标
    category: text("category"), // 分类（可选）
    notes: text("notes"), // 备注
    metadata: text("metadata"), // JSON 格式存储类型特定字段
    archived: int("archived").notNull().default(0), // 是否归档（0=否，1=是）
    createdAt: int("created_at").notNull(),
    updatedAt: int("updated_at").notNull(),
});

// ============= 提醒表 =============
export const reminders = sqliteTable("reminders", {
    id: text("id").primaryKey(),
    itemId: text("item_id")
        .notNull()
        .references(() => items.id, { onDelete: "cascade" }),
    reminderType: text("reminder_type").notNull(), // 'one_time' | 'recurring'
    title: text("title").notNull(), // 提醒标题
    description: text("description"), // 描述说明

    // ====== 一次性提醒字段 ======
    dueDate: int("due_date"), // 到期日期（时间戳，毫秒）

    // ====== 周期性提醒字段 ======
    recurrenceInterval: int("recurrence_interval"), // 间隔数（如3表示每3个月）
    recurrenceUnit: text("recurrence_unit"), // 'day' | 'week' | 'month' | 'year'
    startDate: int("start_date"), // 开始日期（时间戳，毫秒）
    nextDueDate: int("next_due_date"), // 下次提醒日期（时间戳，毫秒）

    // ====== 提醒配置 ======
    advanceDays: int("advance_days").notNull().default(0), // 提前多少天提醒
    isActive: int("is_active").notNull().default(1), // 是否启用（0=否，1=是）

    createdAt: int("created_at").notNull(),
    updatedAt: int("updated_at").notNull(),
});

// ============= 提醒完成记录表 =============
export const reminderLogs = sqliteTable("reminder_logs", {
    id: text("id").primaryKey(),
    reminderId: text("reminder_id")
        .notNull()
        .references(() => reminders.id, { onDelete: "cascade" }),
    completedAt: int("completed_at").notNull(), // 完成时间（时间戳，毫秒）
    notes: text("notes"), // 操作备注
    createdAt: int("created_at").notNull(),
});

// ============= 类型推导 =============
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type NewReminderLog = typeof reminderLogs.$inferInsert;

// ============= 扩展类型（带关联数据）=============
export type ItemWithReminders = Item & {
    reminders: Reminder[];
};

export type ReminderWithItem = Reminder & {
    item: Item;
};

export type ReminderWithLogs = Reminder & {
    logs: ReminderLog[];
};
