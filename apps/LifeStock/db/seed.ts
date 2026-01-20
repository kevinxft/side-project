import { db } from "./client";
import { items, reminderLogs, reminders } from "./schema";
import { itemService, reminderService } from "./services";

export async function seedTestData() {
  console.log("🌱 Starting dynamic seed...");

  try {
    // 1. 清理现有全部数据，确保干净的调试环境
    await db.delete(reminderLogs);
    await db.delete(reminders);
    await db.delete(items);

    const nowTimestamp = Date.now();
    const today = new Date(nowTimestamp);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    // --- 1. [今天到期] 一次性：鲜牛奶 ---
    const milk = await itemService.create({
      type: "product",
      name: "鲜牛奶 (今日到期)",
      icon: "🥛",
      notes: "今天必须喝完，不然就坏了",
      metadata: JSON.stringify({ quantity: 1, unit: "盒", location: "冰箱" }),
      archived: 0,
    });
    await reminderService.create({
      itemId: milk.id,
      reminderType: "one_time",
      title: "记得喝牛奶",
      dueDate: todayStart + (18 * 60 * 60 * 1000), // 今天下午6点
      advanceDays: 0,
      isActive: 1,
    });

    // --- 2. [明天到期] 一次性：快递代收 ---
    const packageItem = await itemService.create({
      type: "other",
      name: "丰巢快递 (明天到期)",
      icon: "📦",
      notes: "取件码：123456",
      metadata: JSON.stringify({ location: "北门丰巢" }),
      archived: 0,
    });
    await reminderService.create({
      itemId: packageItem.id,
      reminderType: "one_time",
      title: "取快递",
      dueDate: todayStart + oneDay + (10 * 60 * 60 * 1000), // 明天上午10点
      advanceDays: 1,
      isActive: 1,
    });

    // --- 3. [已逾期] 一次性：信用卡还款 ---
    const bankCard = await itemService.create({
      type: "account",
      name: "招商银行 (已逾期)",
      icon: "💳",
      notes: "忘了还款会影响征信",
      metadata: JSON.stringify({ balance: 5000, merchantName: "招商银行" }),
      archived: 0,
    });
    await reminderService.create({
      itemId: bankCard.id,
      reminderType: "one_time",
      title: "信用卡还款",
      dueDate: todayStart - oneDay + (9 * 60 * 60 * 1000), // 昨天上午9点
      advanceDays: 3,
      isActive: 1,
    });

    // --- 4. [今日待办] 周期性：保号卡充值 ---
    const simCard = await itemService.create({
      type: "phone",
      name: "流量卡 (今日扣费)",
      icon: "📱",
      notes: "每月一次，确保不欠费",
      metadata: JSON.stringify({ phoneNumber: "17012345678", carrier: "移动" }),
      archived: 0,
    });
    await reminderService.create({
      itemId: simCard.id,
      reminderType: "recurring",
      title: "话费充值",
      recurrenceInterval: 1,
      recurrenceUnit: "month",
      startDate: todayStart,
      nextDueDate: todayStart, // 正好今天需要处理
      advanceDays: 1,
      isActive: 1,
    });

    // --- 5. [近期提醒] 周期性：换滤芯 ---
    const filter = await itemService.create({
      type: "supply",
      name: "净水器滤芯 (常态提醒)",
      icon: "🚰",
      notes: "每半年换一次",
      metadata: JSON.stringify({ location: "厨房" }),
      archived: 0,
    });
    await reminderService.create({
      itemId: filter.id,
      reminderType: "recurring",
      title: "更换滤芯",
      recurrenceInterval: 6,
      recurrenceUnit: "month",
      startDate: todayStart,
      nextDueDate: todayStart + oneWeek, // 下周到期
      advanceDays: 3,
      isActive: 1,
    });

    console.log("✅ Dynamic seed completed!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
}
