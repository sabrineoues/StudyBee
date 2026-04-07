const footerLinks = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "mailto:studybee@mindworkers.tn" },
] as const;

export function MarketingFooter() {
  return (
    <div className="mt-auto">
      <div aria-hidden className="h-6 sm:h-8" />

      <footer
        id="contact"
        className="border-t border-outline-variant/15 bg-surface-container-low px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-16">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tighter text-primary">StudyBee</h3>
            <p className="text-sm text-on-surface-variant">
              Turning Study Time into Prime Time
            </p>
            <p className="text-xs italic text-on-surface-variant/80">
              Learn lighter. Stay consistent.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-12 gap-y-2 text-sm text-on-surface-variant"
          >
            {footerLinks.map((item) => (
              <a
                key={item.label}
                className="transition-colors hover:text-primary"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <p className="text-[0.75rem] text-on-surface-variant opacity-60 md:text-right">
            © 2026 StudyBee Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
