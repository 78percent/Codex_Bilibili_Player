import { useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
export function EditDialog({
  title,
  initial = "",
  label = "名称",
  onSave,
  onClose,
}: any) {
  const [value, setValue] = useState(initial);
  return (
    <Dialog title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }}
      >
        <label className="field">
          {label}
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <footer>
          <Button type="button" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" disabled={!value.trim()}>
            保存
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
export function ConfirmDialog({ title, children, onConfirm, onClose }: any) {
  return (
    <Dialog title={title} onClose={onClose}>
      <div className="dialog-body">{children}</div>
      <footer>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          确认删除
        </Button>
      </footer>
    </Dialog>
  );
}
