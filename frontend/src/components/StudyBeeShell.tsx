import type { PropsWithChildren } from "react";

export type StudyBeeShellProps = PropsWithChildren;

export function StudyBeeShell({ children }: StudyBeeShellProps) {
  return (
    <div className="min-h-[100dvh] bg-background text-on-background">
      {children}
    </div>
  );
}
