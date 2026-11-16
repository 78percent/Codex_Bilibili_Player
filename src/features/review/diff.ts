export type DiffLine = {
  kind: "same" | "add" | "remove";
  text: string;
  old?: number;
  next?: number;
};
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.trimEnd().split("\n"),
    b = after.trimEnd().split("\n");
  if (!before) a.splice(0);
  if (!after) b.splice(0);
  const table = Array.from(
    { length: a.length + 1 },
    () => new Uint32Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
  const result: DiffLine[] = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      result.push({ kind: "same", text: a[i], old: i + 1, next: j + 1 });
      i++;
      j++;
    } else if (
      j < b.length &&
      (i === a.length || table[i][j + 1] >= table[i + 1][j])
    ) {
      result.push({ kind: "add", text: b[j], next: j + 1 });
      j++;
    } else {
      result.push({ kind: "remove", text: a[i], old: i + 1 });
      i++;
    }
  }
  return result;
}
export function stats(files: any[]) {
  const rows = files.flatMap((f) => diffLines(f.before, f.after));
  return {
    added: rows.filter((r) => r.kind === "add").length,
    removed: rows.filter((r) => r.kind === "remove").length,
  };
}
