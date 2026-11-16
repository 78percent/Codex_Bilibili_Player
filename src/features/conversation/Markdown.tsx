import { Fragment } from "react";
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
        .map((part, i) =>
          part.startsWith("`") ? (
            <code key={i}>{part.slice(1, -1)}</code>
          ) : part.startsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
    </>
  );
}
export function Markdown({ text }: { text: string }) {
  const blocks = text.split("```");
  return (
    <div className="markdown">
      {blocks.map((block, b) =>
        b % 2 ? (
          <pre key={b}>
            <code>{block.replace(/^\w*\n/, "")}</code>
          </pre>
        ) : (
          block.split("\n").map((line, i) =>
            line.startsWith("### ") ? (
              <h3 key={`${b}-${i}`}>
                <Inline text={line.slice(4)} />
              </h3>
            ) : line.startsWith("# ") ? (
              <h2 key={`${b}-${i}`}>
                <Inline text={line.slice(2)} />
              </h2>
            ) : line.startsWith("- ") ? (
              <div className="markdown-bullet" key={`${b}-${i}`}>
                <span>•</span>
                <Inline text={line.slice(2)} />
              </div>
            ) : line.trim() ? (
              <p key={`${b}-${i}`}>
                <Inline text={line} />
              </p>
            ) : (
              <div className="paragraph-gap" key={`${b}-${i}`} />
            ),
          )
        ),
      )}
    </div>
  );
}
