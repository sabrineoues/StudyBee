type SiteFooterLayout = "brand-links-copyright" | "brand-copyright-links";

type Props = {
  brand: string;
  copyright: string;
  links: string[];
  layout: SiteFooterLayout;
  linksContainerClassName?: string;
  linkClassName?: string;
  copyrightClassName?: string;
};

export function SiteFooter({
  brand,
  copyright,
  links,
  layout,
  linksContainerClassName,
  linkClassName,
  copyrightClassName,
}: Props) {
  const brandNode = (
    <div className="text-lg font-bold text-primary dark:text-inverse-primary">
      {brand}
    </div>
  );

  const linksNode = (
    <div className={linksContainerClassName ?? "flex gap-6"}>
      {links.map((t) => (
        <a
          key={t}
          href="#"
          className={
            linkClassName ??
            "font-body text-sm text-on-surface-variant transition-colors hover:text-primary dark:text-surface-variant dark:hover:text-inverse-primary"
          }
        >
          {t}
        </a>
      ))}
    </div>
  );

  const copyrightNode = (
    <div
      className={
        copyrightClassName ??
        "font-body text-sm leading-relaxed text-on-surface-variant dark:text-surface-variant"
      }
    >
      {copyright}
    </div>
  );

  return (
    <footer className="flex w-full flex-col items-center justify-between gap-6 border-t border-outline-variant/15 bg-surface-container-low px-8 py-12 dark:bg-inverse-surface md:flex-row">
      {layout === "brand-links-copyright" ? (
        <>
          {brandNode}
          {linksNode}
          {copyrightNode}
        </>
      ) : (
        <>
          {brandNode}
          {copyrightNode}
          {linksNode}
        </>
      )}
    </footer>
  );
}
