import * as Icons from "lucide-react";
export function Icon({
  name,
  size = 18,
  ...props
}: {
  name: string;
  size?: number;
  [key: string]: any;
}) {
  const Component = (Icons as any)[name] || Icons.Circle;
  return (
    <Component size={size} strokeWidth={1.65} aria-hidden="true" {...props} />
  );
}
