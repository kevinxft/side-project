import { eq } from "drizzle-orm";
import { db } from "./client";
import { items, itemTags, tags, transactions, type Item, type ItemKind, type NewItem, type NewTag, type NewTransaction } from "./schema";

// ============= 工具函数 =============
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function now(): number {
    return Date.now();
}

// ============= 物品操作 =============
export const itemService = {
    // 获取所有物品
    async getAll(): Promise<Item[]> {
        return db.select().from(items);
    },

    // 获取有到期日期的物品（按到期日期排序）
    async getWithExpiry(): Promise<Item[]> {
        return db
            .select()
            .from(items)
            .where(isNotNull(items.expiryDate))
            .orderBy(asc(items.expiryDate));
    },

    // 按类型获取物品
    async getByKind(kind: ItemKind): Promise<Item[]> {
        return db.select().from(items).where(eq(items.kind, kind));
    },

    // 获取单个物品
    async getById(id: string): Promise<Item | undefined> {
        const result = await db.select().from(items).where(eq(items.id, id));
        return result[0];
    },

    // 创建物品
    async create(data: Omit<NewItem, "id" | "createdAt" | "updatedAt">): Promise<Item> {
        const newItem: NewItem = {
            ...data,
            id: generateId(),
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

    // 删除物品
    async delete(id: string): Promise<void> {
        await db.delete(items).where(eq(items.id, id));
    },

    // 获取物品的标签
    async getTags(itemId: string): Promise<string[]> {
        const result = await db
            .select({ tagId: itemTags.tagId })
            .from(itemTags)
            .where(eq(itemTags.itemId, itemId));
        return result.map((r) => r.tagId);
    },

    // 设置物品的标签
    async setTags(itemId: string, tagIds: string[]): Promise<void> {
        // 先删除现有标签关联
        await db.delete(itemTags).where(eq(itemTags.itemId, itemId));
        // 再添加新的标签关联
        if (tagIds.length > 0) {
            await db.insert(itemTags).values(
                tagIds.map((tagId) => ({ itemId, tagId }))
            );
        }
    },
};

// ============= 标签操作 =============
export const tagService = {
    // 获取所有标签
    async getAll() {
        return db.select().from(tags);
    },

    // 创建标签
    async create(data: Omit<NewTag, "id">): Promise<NewTag> {
        const newTag: NewTag = {
            ...data,
            id: generateId(),
        };
        await db.insert(tags).values(newTag);
        return newTag;
    },

    // 更新标签
    async update(id: string, data: Partial<Omit<NewTag, "id">>): Promise<void> {
        await db.update(tags).set(data).where(eq(tags.id, id));
    },

    // 删除标签
    async delete(id: string): Promise<void> {
        await db.delete(tags).where(eq(tags.id, id));
    },
};

// ============= 交易记录操作 =============
export const transactionService = {
    // 获取物品的交易记录
    async getByItemId(itemId: string) {
        return db
            .select()
            .from(transactions)
            .where(eq(transactions.itemId, itemId));
    },

    // 创建交易记录
    async create(data: Omit<NewTransaction, "id" | "createdAt">): Promise<NewTransaction> {
        const newTx: NewTransaction = {
            ...data,
            id: generateId(),
            createdAt: now(),
        };
        await db.insert(transactions).values(newTx);
        return newTx;
    },

    // 删除交易记录
    async delete(id: string): Promise<void> {
        await db.delete(transactions).where(eq(transactions.id, id));
    },
};
