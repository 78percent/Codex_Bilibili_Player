import { Icon } from "./Icon";
export function Button({
  children,
  icon,
  variant = "ghost",
  className = "",
  ...props
}: any) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
export function IconButton({ icon, label, ...props }: any) {
  return (
    <button className="icon-button" title={label} aria-label={label} {...props}>
      <Icon name={icon} />
    </button>
  );
}
