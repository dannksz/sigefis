import type { ComponentProps } from "react";

export default function ConsultationButton({
  children,
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      type={type}
      className={[
        "block w-full cursor-pointer rounded-[10px] text-left text-lg leading-tight",
        "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-secondary",
        "[&:hover>span]:[transform:translateY(-5px)] [&:hover>span]:shadow-[0_7px_10px_-3px_#00000040]",
        className,
      ].filter(Boolean).join(" ")}
    >
      <span
        className="pointer-events-none flex min-h-[42px] items-center gap-3.5 rounded-[10px] border border-[#777] bg-ice px-2.5 py-[7px] shadow-none max-[620px]:min-h-11 [&>svg]:shrink-0"
        style={{ transition: "transform 0.35s ease-in-out, box-shadow 0.35s ease-in-out" }}
      >
        {children}
      </span>
    </button>
  );
}
