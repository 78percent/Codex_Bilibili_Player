import { Icon } from "../../components/ui/Icon";

export function ReviewFileIcon({ path }: { path: string }) {
  const extension = path.split(".").pop()?.toLowerCase() || "";
  if (extension === "tsx" || extension === "jsx") {
    return <span className="review-file-icon react" aria-hidden="true"><Icon name="Atom" size={17} /></span>;
  }
  const badges: Record<string, [string, string]> = {
    js: ["JS", "javascript"], cjs: ["JS", "javascript"], mjs: ["JS", "javascript"],
    ts: ["TS", "typescript"], mts: ["TS", "typescript"], cts: ["TS", "typescript"],
    css: ["CSS", "css"], scss: ["SC", "css"], less: ["LS", "css"],
    md: ["M↓", "markdown"], mdx: ["M↓", "markdown"],
    json: ["{}", "json"], html: ["<>", "html"],
    vue: ["V", "vue"], py: ["PY", "python"],
  };
  const badge = badges[extension];
  return badge ? (
    <span className={`review-file-icon ${badge[1]}`} aria-hidden="true">{badge[0]}</span>
  ) : (
    <span className="review-file-icon generic" aria-hidden="true"><Icon name="FileCode2" size={15} /></span>
  );
}
