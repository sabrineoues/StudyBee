import { useTranslation } from "react-i18next";

export function AdminJournalsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-w-0">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
          {t("admin.journals.title")}
        </h1>
        <p className="mt-2 text-on-surface-variant">{t("admin.journals.subtitle")}</p>
      </header>

      <div className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
        <p className="text-sm font-semibold text-on-surface-variant">{t("admin.journals.comingSoon")}</p>
      </div>
    </main>
  );
}
