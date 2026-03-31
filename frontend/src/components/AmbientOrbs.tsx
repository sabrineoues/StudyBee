import type { HTMLAttributes } from "react";

type AmbientOrbsProps = HTMLAttributes<HTMLDivElement>;

export function AmbientOrbs({ className, ...props }: AmbientOrbsProps) {
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden " +
        (className ?? "")
      }
      {...props}
    >
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-[-6rem] top-1/3 h-96 w-96 rounded-full bg-tertiary/10 blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-3xl" />
    </div>
  );
}
