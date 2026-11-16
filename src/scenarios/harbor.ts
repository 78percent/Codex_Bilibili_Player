export default {
  title: "修复订单重复消费与幂等边界",
  branch: "fix/order-idempotency",
  pr: 91,
  prompt:
    "支付回调在 Redis 重新连接后出现重复消费。请检查幂等逻辑，把处理边界放在数据库事务里，并补上迁移方案。",
  intro:
    "我先把事件接收、幂等记录与订单落库的顺序串起来，确认重复事件从哪里进入事务。",
  plan: [
    "追踪 webhook 到订单事务的调用链",
    "将幂等键与订单写入绑定",
    "补齐迁移和运行记录",
  ],
  command: 'rg "idempotency|webhook|transaction" app/orders app/payments',
  output:
    "app/payments/webhook.py:27: process_event(event)\napp/orders/service.py:58: await order_repository.save(order)\napp/orders/idempotency.py:14: redis.set(key, value, nx=True)",
  read: "读取 app/orders/service.py 与 migrations/20261112_events.sql",
  analysis:
    "Redis 的短期 key 与订单事务不是原子操作。重连后幂等 key 可以丢失，而订单已提交。将 event_id 的唯一约束放进同一事务后，重复事件可以在数据库层确定性跳过。",
  response:
    "订单幂等边界已移入数据库事务。\n\n### 处理流程\n1. 事务内写入 `processed_events`。\n2. 重复 `event_id` 直接返回已有结果。\n3. 订单写入成功后提交同一事务。\n\nRedis 继续承担短期缓存，数据库唯一约束负责最终幂等。迁移文件采用独立表，不改变现有订单字段；回滚路径已记录在迁移说明中。",
  followups: [
    "追踪队列积压与重试退避",
    "支付事件字段兼容改造",
    "数据库迁移回滚说明",
    "梳理 webhook 错误分类",
  ],
  files: [
    {
      path: "app/orders/service.py",
      before:
        'async def process_event(event):\n    if await redis.exists(event.id):\n        return\n    await orders.save(event.order)\n    await redis.set(event.id, "done")\n',
      after:
        "async def process_event(event):\n    async with database.transaction():\n        inserted = await processed_events.claim(event.id)\n        if not inserted:\n            return await orders.by_event(event.id)\n        return await orders.save(event.order)\n",
      staged: false,
    },
    {
      path: "migrations/20261112_events.sql",
      before: "",
      after:
        "CREATE TABLE processed_events (\n  event_id TEXT PRIMARY KEY,\n  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n",
      staged: false,
    },
    {
      path: "app/orders/repository.py",
      before:
        "async def claim(event_id):\n    return await cache.set(event_id, True)\n",
      after:
        'async def claim(event_id):\n    return await db.fetchval(\n        "INSERT INTO processed_events(event_id) VALUES($1) "\n        "ON CONFLICT DO NOTHING RETURNING event_id", event_id\n    )\n',
      staged: false,
    },
    {
      path: "docs/order-events.md",
      before: "## Event handling\nEvents use Redis keys.\n",
      after:
        "## Event handling\nThe database transaction owns idempotency.\nRedis is a cache, never the source of truth.\nRollback: keep processed_events until workers are drained.\n",
      staged: false,
    },
  ],
};
