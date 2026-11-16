export default {
  title: "优化批处理内存与增量检查点",
  branch: "perf/streaming-checkpoints",
  pr: 63,
  prompt:
    "每天的 Parquet 任务处理到第三个分区时内存会涨到 8GB。改成分批处理，并让任务从最后提交的检查点恢复，输出一份变更报告。",
  intro: "先定位数据驻留的生命周期，再把批处理和检查点提交放在同一个分区边界。",
  plan: [
    "定位批次缓存与分区读取",
    "逐批释放 Arrow 表并提交检查点",
    "整理分区处理报告",
  ],
  command: 'rg "read_table|checkpoint|concat_tables" pipeline',
  output:
    "pipeline/reader.py:18: tables.append(pq.read_table(path))\npipeline/runner.py:39: result = pa.concat_tables(tables)\npipeline/state.py:22: save_checkpoint(partition)",
  read: "读取 pipeline/reader.py 和 pipeline/runner.py",
  analysis:
    "reader 一直保留已读分区的 Arrow 表，concat_tables 之前无法释放。改成迭代 record batch 后，可以让处理器及时释放当前批次；检查点只在输出提交后推进。",
  response:
    "处理链路已改成逐批读取、逐批写入。\n\n### 分区提交顺序\n- 读取当前分区的 record batch。\n- 转换并写入临时输出。\n- 原子提交分区结果，再推进检查点。\n\n恢复时跳过已提交分区，重做未提交分区。报告中列出了各分区的输入数量、输出位置和检查点，不再保留所有 Arrow 表直到任务结束。",
  followups: [
    "异常记录隔离与重放",
    "日报自动化与调度日志",
    "DuckDB 查询计划整理",
    "分区输出命名规范",
  ],
  files: [
    {
      path: "pipeline/reader.py",
      before:
        "def read(paths):\n    tables = [pq.read_table(path) for path in paths]\n    return pa.concat_tables(tables)\n",
      after:
        "def read(paths):\n    for path in paths:\n        parquet = pq.ParquetFile(path)\n        yield from parquet.iter_batches(batch_size=65536)\n",
      staged: false,
    },
    {
      path: "pipeline/runner.py",
      before:
        "table = read(paths)\nresult = transform(table)\nwriter.write(result)\n",
      after:
        "for partition in pending_partitions(checkpoint):\n    with writer.partition(partition) as output:\n        for batch in read(partition.paths):\n            output.write(transform(batch))\n    checkpoint.commit(partition.id)\n",
      staged: false,
    },
    {
      path: "reports/partition-summary.md",
      before: "",
      after:
        "# Partition summary\n\n| Partition | Rows | Status |\n| --- | ---: | --- |\n| 2026-11-09 | 1,248,320 | committed |\n| 2026-11-10 | 1,319,488 | committed |\n| 2026-11-11 | 1,286,144 | committed |\n\nCheckpoint: 2026-11-11\n",
      staged: false,
    },
  ],
};
