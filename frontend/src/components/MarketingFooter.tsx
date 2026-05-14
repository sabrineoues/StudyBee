import { SiteFooter } from "./SiteFooter";

export function MarketingFooter() {
  return (
    <SiteFooter
      brand="StudyBee"
      copyright={`© ${new Date().getFullYear()} StudyBee`}
      links={["Privacy", "Terms", "Support"]}
      layout="brand-links-copyright"
    />
  );
}
