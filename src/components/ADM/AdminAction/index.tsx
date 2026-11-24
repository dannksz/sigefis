import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type StyleProps = {
  variant?: "primary" | "secondary";
  children: ReactNode;
  className?: string;
};

type Props = StyleProps & (
  | { href: string }
  | ({ href?: never } & Pick<ComponentProps<"button">, "type" | "disabled" | "onClick">)
);

export default function AdminAction(props: Props) {
  const { variant = "secondary", className = "", children } = props;
  const color = variant === "primary"
    ? "border-transparent bg-primary hover:bg-primary-light"
    : "border-gray-400 bg-white hover:bg-gray-100";
  const classes = `inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 font-semibold text-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${color} ${className}`;

  if (props.href !== undefined) {
    return <Link href={props.href} className={classes}>{children}</Link>;
  }

  return (
    <button type={props.type ?? "button"} disabled={props.disabled} onClick={props.onClick}
      className={classes}>
      {children}
    </button>
  );
}
