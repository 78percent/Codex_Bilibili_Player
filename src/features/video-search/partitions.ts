// The search API's `tids` uses the tid table, not the newer tid_v2 IDs.
// Source and fixed revision: docs/sources.md, API references.
export const searchPartitions: { value: number; label: string }[] = [
  { value: 0, label: '全部分区' },
  { value: 1, label: '动画' },
  { value: 3, label: '音乐' },
  { value: 129, label: '舞蹈' },
  { value: 4, label: '游戏' },
  { value: 36, label: '知识' },
  { value: 188, label: '科技' },
  { value: 234, label: '运动' },
  { value: 223, label: '汽车' },
  { value: 160, label: '生活' },
  { value: 211, label: '美食' },
  { value: 217, label: '动物圈' },
  { value: 119, label: '鬼畜' },
  { value: 155, label: '时尚' },
  { value: 202, label: '资讯' },
  { value: 5, label: '娱乐' },
  { value: 181, label: '影视' },
];
