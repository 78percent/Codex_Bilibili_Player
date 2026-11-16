const tokens = /(\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|export|const|let|function|return|if|else|class|def|async|await|type|interface|true|false|None|self)\b|\b\d+(?:\.\d+)?\b)/g;
export function CodeLine({ text }: { text: string }) {
  return <>{text.split(tokens).map((part, i) => {
    const kind = /^(\/\/|#)/.test(part) ? "comment" : /^["']/.test(part) ? "string" : /^\d/.test(part) ? "number" : /^(import|from|export|const|let|function|return|if|else|class|def|async|await|type|interface|true|false|None|self)$/.test(part) ? "keyword" : "";
    return kind ? <span className={`syntax-${kind}`} key={i}>{part}</span> : part;
  })}</>;
}

