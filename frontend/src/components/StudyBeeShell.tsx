import type { PropsWithChildren } from "react";

export type StudyBeeShellProps = PropsWithChildren;

export function StudyBeeShell({ children }: StudyBeeShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-on-background">
      {children}
    </div>
  );
}
