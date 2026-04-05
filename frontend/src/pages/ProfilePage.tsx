import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { profileService } from "../services/profileService";
import { userService } from "../services/userService";

function fieldClass() {
  return "w-full rounded-md border-none bg-surface-container-highest px-5 py-4 font-body text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40";
}

function formatDrfError(data: unknown): string {
  if (!data) return "Failed to save. Please check the fields.";
  if (typeof data === "string") return data;

  if (typeof data !== "object") return "Failed to save. Please check the fields.";

  const obj = data as Record<string, unknown>;
  const detail = obj.detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      lines.push(`${key}: ${value}`);
      continue;
    }
    if (Array.isArray(value)) {
      const msgs = value.filter((v) => typeof v === "string").join(" ");
      if (msgs) lines.push(`${key}: ${msgs}`);
      continue;
    }
  }

  return lines.length ? lines.join("\n") : "Failed to save. Please check the fields.";
}

export function ProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  function close() {
    if (confirmDeleteOpen) {
      setConfirmDeleteOpen(false);
      return;
    }
    navigate(-1);
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await profileService.getMe();
        if (!alive) return;
        setEmail(me.email ?? "");
        setUsername(me.username ?? "");
        setFirstName(me.first_name ?? "");
        setLastName(me.last_name ?? "");
        setDateOfBirth(me.date_of_birth ?? "");
        setClassLevel(me.class_level ?? "");
        setSpeciality(me.speciality ?? "");
        setParentEmail(me.parent_email ?? "");
        setParentPhone(me.parent_phone ?? "");
      } catch (err) {
        if (!alive) return;
        const maybeAny = err as { response?: { status?: number } };
        const status = maybeAny?.response?.status;
        if (status === 401) setError("Session expired. Please sign in again.");
        else setError("Failed to load profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedUsername = username.trim();
      const trimmedDob = dateOfBirth.trim();
      const trimmedClass = classLevel.trim();
      const trimmedParentEmail = parentEmail.trim();
      const trimmedParentPhone = parentPhone.trim();

      const payload = {
        email: trimmedEmail,
        username: trimmedUsername,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: trimmedDob,
        class_level: trimmedClass,
        speciality: speciality.trim(),
        parent_email: trimmedParentEmail,
        parent_phone: trimmedParentPhone,
      };

      if (!payload.email || !payload.username) {
        setError("Email and username are required.");
        return;
      }

      if (!payload.date_of_birth || !payload.class_level || !payload.parent_email || !payload.parent_phone) {
        setError("Please fill in all required fields.");
        return;
      }

      if (!/^\+216\d{8}$/.test(payload.parent_phone)) {
        setError("parent_phone: Phone must match +216XXXXXXXX");
        return;
      }

      const updated = await profileService.updateMe(payload);
      setEmail(updated.email ?? "");
      setUsername(updated.username ?? "");
      setFirstName(updated.first_name ?? "");
      setLastName(updated.last_name ?? "");
      setDateOfBirth(updated.date_of_birth ?? "");
      setClassLevel(updated.class_level ?? "");
      setSpeciality(updated.speciality ?? "");
      setParentEmail(updated.parent_email ?? "");
      setParentPhone(updated.parent_phone ?? "");
      setMode("view");
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny?.response?.data;
      setError(formatDrfError(data));
    } finally {
      setSaving(false);
    }
  }

  function requestDelete() {
    setError(null);
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    setError(null);
    setDeleting(true);
    try {
      await profileService.deleteMe();
      userService.signOut();
      navigate("/", { replace: true });
    } catch {
      setError("Failed to delete account.");
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }

  function infoRow(label: string, value: string) {
    return (
      <div className="flex items-start justify-between gap-6 rounded-lg bg-surface-container-highest/40 px-4 py-3 ring-1 ring-outline-variant/10">
        <div className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</div>
        <div className="font-body text-sm font-semibold text-on-surface text-right break-all">{value || "—"}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />

      <div className="absolute left-1/2 top-1/2 w-[min(92vw,740px)] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15 shadow-[0_30px_70px_rgba(0,0,0,0.25)]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Profile</h1>
              <p className="mt-1 text-on-surface-variant">
                {mode === "view" ? "Your student information." : "Edit your student information."}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-surface-container-highest/70 px-4 py-2 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 hover:bg-surface-container-highest"
            >
              Close
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-md bg-error-container/20 px-4 py-3 font-body text-sm font-semibold text-on-error-container whitespace-pre-line">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="text-on-surface-variant">Loading...</p>
          ) : mode === "view" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {infoRow("Email", email)}
                {infoRow("Username", username)}
                {infoRow("First name", firstName)}
                {infoRow("Last name", lastName)}
                {infoRow("Date of birth", dateOfBirth)}
                {infoRow("Class level", classLevel)}
                {infoRow("Speciality", speciality)}
                {infoRow("Parent email", parentEmail)}
                {infoRow("Parent phone", parentPhone)}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className="rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={requestDelete}
                  className="rounded-full bg-error-container/20 px-8 py-3 text-sm font-bold text-on-error-container ring-1 ring-outline-variant/10 transition-colors hover:bg-error-container/30 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onSave}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    Email
                  </label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass()} />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    Username
                  </label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass()} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    First name
                  </label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={fieldClass()} />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    Last name
                  </label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldClass()} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={fieldClass()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    Class level
                  </label>
                  <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className={fieldClass()} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    Speciality
                  </label>
                  <input value={speciality} onChange={(e) => setSpeciality(e.target.value)} className={fieldClass()} />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    Parent email
                  </label>
                  <input value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className={fieldClass()} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant">
                  Parent phone
                </label>
                <input
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+216XXXXXXXX"
                  className={fieldClass()}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className="rounded-full bg-surface-container-highest/70 px-6 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 hover:bg-surface-container-highest"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {confirmDeleteOpen && !loading && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close delete confirmation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDeleteOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-highest/95 p-6 ring-1 ring-outline-variant/15">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Confirm deletion</h2>
            <p className="mt-2 font-body text-on-surface-variant">
              You’re about to permanently delete the account
              <span className="font-semibold text-on-surface"> {email || username || ""}</span>. This action cannot be undone.
            </p>

            <div className="mt-5 rounded-2xl bg-error-container/15 px-4 py-3 ring-1 ring-outline-variant/10">
              <div className="font-body text-sm font-semibold text-on-error-container">This will remove your profile and sign you out.</div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-full bg-surface-container-highest/70 px-6 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 hover:bg-surface-container-highest disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-full bg-error-container/30 px-8 py-3 text-sm font-bold text-on-error-container ring-1 ring-outline-variant/10 transition-colors hover:bg-error-container/40 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
