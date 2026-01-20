import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "./client";
import {
    items,
    reminderLogs,
    reminders,
    type Item,
    type NewItem,
    type NewReminder,
    type RecurrenceUnit,
    type Reminder,
    type ReminderLog
} from "./schema";

// ============= 工具函数 =============
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function now(): number {
    return Date.now();
}

/**
 * 计算下次到期日期
 * @param currentDueDate 当前到期日期
 * @param interval 间隔
 * @param unit 单位
 */
function calculateNextDate(currentDueDate: number, interval: number, unit: RecurrenceUnit): number {
    const date = new Date(currentDueDate);
    switch (unit) {
        case "day":
            date.setDate(date.getDate() + interval);
            break;
        case "week":
            date.setDate(date.getDate() + interval * 7);
            break;
        case "month":
            date.setMonth(date.getMonth() + interval);
            break;
        case "year":
            date.setFullYear(date.getFullYear() + interval);
            break;
    }
    return date.getTime();
}

// ============= 物品操作 =============
export const itemService = {
    // 获取所有非归档物品
    async getAll(): Promise<Item[]> {
        return db.select().from(items).where(eq(items.archived, 0));
    },

    // 获取单个物品及其所有提醒
    async getById(id: string): Promise<(Item & { reminders: Reminder[] }) | undefined> {
        const itemResult = await db.select().from(items).where(eq(items.id, id));
        if (itemResult.length === 0) return undefined;

        const itemReminders = await db
            .select()
            .from(reminders)
            .where(eq(reminders.itemId, id));

        return {
            ...itemResult[0],
            reminders: itemReminders,
        };
    },

    // 创建物品
    async create(data: Omit<NewItem, "id" | "createdAt" | "updatedAt">): Promise<Item> {
        const id = generateId();
        const newItem: NewItem = {
            ...data,
            id,
            createdAt: now(),
            updatedAt: now(),
        };
        await db.insert(items).values(newItem);
        return newItem as Item;
    },

    // 更新物品
    async update(id: string, data: Partial<Omit<NewItem, "id" | "createdAt">>): Promise<void> {
        await db
            .update(items)
            .set({ ...data, updatedAt: now() })
            .where(eq(items.id, id));
    },

    // 删除物品（物理删除，包含级联删除提醒）
    async delete(id: string): Promise<void> {
        await db.delete(items).where(eq(items.id, id));
    },

    // 归档物品
    async archive(id: string): Promise<void> {
        await db.update(items).set({ archived: 1, updatedAt: now() }).where(eq(items.id, id));
    },

    // 搜索物品（模糊匹配名称、备注、元数据）
    async search(query: string): Promise<Item[]> {
        if (!query.trim()) return [];
        const pattern = `%${query}%`;
        return db
            .select()
            .from(items)
            .where(
                and(
                    eq(items.archived, 0),
                    or(
                        like(items.name, pattern),
                        like(items.notes, pattern),
                        like(items.metadata, pattern)
                    )
                )
            );
    },
};

// ============= 提醒操作 =============
export const reminderService = {
    // 获取所有活动的提醒
    async getAllActive(): Promise<(Reminder & { item: Item })[]> {
        const result = await db
            .select({
                reminder: reminders,
                item: items,
            })
            .from(reminders)
            .innerJoin(items, eq(reminders.itemId, items.id))
            .where(eq(reminders.isActive, 1));

        return result.map((r) => ({ ...r.reminder, item: r.item }));
    },

    // 获取指定日期之前的到期提醒（包括一次性和周期性）
    async getDueByDate(date: Date): Promise<(Reminder & { item: Item })[]> {
        const timestamp = date.getTime();

        // 查询逻辑：
        // 1. 一次性提醒：dueDate <= timestamp
        // 2. 周期性提醒：nextDueDate <= timestamp
        const result = await db
            .select({
                reminder: reminders,
                item: items,
            })
            .from(reminders)
            .innerJoin(items, eq(reminders.itemId, items.id))
            .where(
                and(
                    eq(reminders.isActive, 1),
                    sql`(${reminders.reminderType} = 'one_time' AND ${reminders.dueDate} <= ${timestamp}) OR 
              (${reminders.reminderType} = 'recurring' AND ${reminders.nextDueDate} <= ${timestamp})`
                )
            );

        return result.map((r) => ({ ...r.reminder, item: r.item }));
    },

    // 为日历获取标记日期
    async getMarkedDates(): Promise<Set<string>> {
        const activeReminders = await db
            .select({
                dueDate: reminders.dueDate,
                nextDueDate: reminders.nextDueDate,
                type: reminders.reminderType,
            })
            .from(reminders)
            .where(eq(reminders.isActive, 1));

        const dates = new Set<string>();
        activeReminders.forEach((r) => {
            const targetDate = r.type === "one_time" ? r.dueDate : r.nextDueDate;
            if (targetDate) {
                const d = new Date(targetDate);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                    d.getDate()
                ).padStart(2, "0")}`;
                dates.add(dateStr);
            }
        });
        return dates;
    },

    // 创建提醒
    async create(data: Omit<NewReminder, "id" | "createdAt" | "updatedAt">): Promise<Reminder> {
        const id = generateId();
        // 如果是周期性提醒且没有设置 nextDueDate，则初始化为 startDate
        let nextDueDate = data.nextDueDate;
        if (data.reminderType === "recurring" && !nextDueDate && data.startDate) {
            nextDueDate = data.startDate;
        }

        const newReminder: NewReminder = {
            ...data,
            id,
            nextDueDate,
            createdAt: now(),
            updatedAt: now(),
        };
        await db.insert(reminders).values(newReminder);
        return newReminder as Reminder;
    },

    // 标记完成
    async complete(id: string, notes?: string): Promise<void> {
        const reminder = await db
            .select()
            .from(reminders)
            .where(eq(reminders.id, id))
            .then((res) => res[0]);

        if (!reminder) return;

        const currentTime = now();

        // 1. 创建完成记录
        await db.insert(reminderLogs).values({
            id: generateId(),
            reminderId: id,
            completedAt: currentTime,
            notes,
            createdAt: currentTime,
        });

        // 2. 如果是周期性提醒，更新下次日期
        if (reminder.reminderType === "recurring" && reminder.recurrenceInterval && reminder.recurrenceUnit) {
            const currentDue = reminder.nextDueDate || reminder.startDate || currentTime;
            const nextDue = calculateNextDate(
                currentDue,
                reminder.recurrenceInterval,
                reminder.recurrenceUnit as RecurrenceUnit
            );

            await db
                .update(reminders)
                .set({
                    nextDueDate: nextDue,
                    updatedAt: currentTime,
                })
                .where(eq(reminders.id, id));
        } else {
            // 如果是一次性提醒，标记为不活跃
            await db
                .update(reminders)
                .set({
                    isActive: 0,
                    updatedAt: currentTime,
                })
                .where(eq(reminders.id, id));
        }
    },

    // 删除提醒
    async delete(id: string): Promise<void> {
        await db.delete(reminders).where(eq(reminders.id, id));
    },

    // 获取物品关联的所有提醒完成记录
    async getLogsForItem(itemId: string): Promise<(ReminderLog & { reminder: Reminder })[]> {
        const result = await db
            .select({
                log: reminderLogs,
                reminder: reminders,
            })
            .from(reminderLogs)
            .innerJoin(reminders, eq(reminderLogs.reminderId, reminders.id))
            .where(eq(reminders.itemId, itemId))
            .orderBy(desc(reminderLogs.completedAt));

        return result.map((r) => ({ ...r.log, reminder: r.reminder }));
    },
};

// 这里的 sql 模板字符串需要从 drizzle-orm 导入
import { sql } from "drizzle-orm";
