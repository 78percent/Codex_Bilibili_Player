import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/ui/Icon";

type Attachment = { id: string; name: string; preview?: string };

export function useComposerAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const urls = useRef(new Set<string>());
  useEffect(() => () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
  }, []);
  const addFiles = (files: File[]) => {
    const added = files.map((file) => {
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      if (preview) urls.current.add(preview);
      return { id: crypto.randomUUID(), name: file.name, preview };
    });
    setAttachments((current) => [...current, ...added]);
  };
  const remove = (id: string) => {
    const preview = attachments.find((item) => item.id === id)?.preview;
    if (preview) {
      URL.revokeObjectURL(preview);
      urls.current.delete(preview);
    }
    setAttachments((current) => current.filter((item) => item.id !== id));
  };
  const clear = () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setAttachments([]);
  };
  return { attachments, addFiles, remove, clear };
}

export function ComposerAttachments({ attachments, onRemove }: {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}) {
  if (!attachments.length) return null;
  return (
    <div className="composer-attachments">
      {attachments.map((item) => (
        <div key={item.id} className={`composer-attachment ${item.preview ? "image-attachment" : "file-attachment"}`}>
          {item.preview ? <img src={item.preview} alt={item.name} title={item.name} /> : <>
            <Icon name="File" size={21} /><span title={item.name}>{item.name}</span>
          </>}
          <button aria-label={`移除 ${item.name}`} title="移除附件" onClick={() => onRemove(item.id)}><Icon name="X" size={13} /></button>
        </div>
      ))}
    </div>
  );
}
