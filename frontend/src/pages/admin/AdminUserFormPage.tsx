import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  adminService,
  type AdminUserCreate,
  type AdminUserUpdate,
} from "../../services/adminService";

function fieldClass() {
  return "w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40";
}

export function AdminUserFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  const userId = useMemo(() => {
    const raw = params.userId;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.userId]);

  const isEdit = userId !== null;

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!isEdit || userId === null) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const u = await adminService.getUser(userId);
        if (!alive) return;
        setEmail(u.email);
        setUsername(u.username);
        setFirstName(u.first_name);
        setLastName(u.last_name);
        setDateOfBirth(u.date_of_birth ?? "");
        setClassLevel(u.class_level ?? "");
        setSpeciality(u.speciality ?? "");
        setParentEmail(u.parent_email ?? "");
        setParentPhone(u.parent_phone ?? "");
        setIsActive(u.is_active);
        setIsStaff(u.is_staff);
        setIsSuperuser(u.is_superuser);
      } catch {
        if (!alive) return;
        setError("Failed to load user.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isEdit, userId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (!email.trim() || !username.trim()) {
        setError("Email and username are required.");
        return;
      }

      if (!isEdit) {
        if (!dateOfBirth.trim() || !classLevel.trim() || !parentEmail.trim() || !parentPhone.trim()) {
          setError("Please fill in all required profile fields.");
          return;
        }
      }

      if (!isEdit) {
        if (!password) {
          setError("Password is required.");
          return;
        }
        const payload: AdminUserCreate = {
          email: email.trim(),
          username: username.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
          date_of_birth: dateOfBirth.trim(),
          class_level: classLevel.trim(),
          speciality: speciality.trim(),
          parent_email: parentEmail.trim(),
          parent_phone: parentPhone.trim(),
          is_active: isActive,
          is_staff: isStaff,
          is_superuser: isSuperuser,
        };
        await adminService.createUser(payload);
        navigate("/admin/users", { replace: true });
        return;
      }

      if (userId === null) return;
      const profilePatch: Record<string, string> = {};
      if (dateOfBirth.trim()) profilePatch.date_of_birth = dateOfBirth.trim();
      if (classLevel.trim()) profilePatch.class_level = classLevel.trim();
      if (speciality.trim()) profilePatch.speciality = speciality.trim();
      if (parentEmail.trim()) profilePatch.parent_email = parentEmail.trim();
      if (parentPhone.trim()) profilePatch.parent_phone = parentPhone.trim();

      const payload: AdminUserUpdate = {
        email: email.trim(),
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        ...(profilePatch as unknown as AdminUserUpdate),
        is_active: isActive,
        is_staff: isStaff,
        is_superuser: isSuperuser,
        ...(password ? { password } : null),
      };
      await adminService.updateUser(userId, payload);
      navigate("/admin/users", { replace: true });
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny?.response?.data;
      if (data && typeof data === "object") {
        setError("Failed to save. Please check the fields.");
      } else {
        setError("Failed to save user.");
      }
    }
  }

  return (
    <main className="min-w-0">
      <header className="mb-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            {isEdit ? "Edit user" : "Add user"}
          </h1>
          <Link
            to="/admin/users"
            className="rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest"
          >
            Back
          </Link>
        </div>
        <p className="text-on-surface-variant">
          {isEdit ? "Update account details." : "Create a new account."}
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15">
        {loading ? (
          <p className="text-on-surface-variant">Loading...</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-label block text-xs uppercase tracking-widest text-outline">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass()} />
              </div>
              <div className="space-y-2">
                <label className="font-label block text-xs uppercase tracking-widest text-outline">Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass()} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-label block text-xs uppercase tracking-widest text-outline">First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={fieldClass()} />
              </div>
              <div className="space-y-2">
                <label className="font-label block text-xs uppercase tracking-widest text-outline">Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldClass()} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label block text-xs uppercase tracking-widest text-outline">
                Password {isEdit ? "(leave empty to keep)" : ""}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass()}
              />
            </div>

            <div className="pt-2">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Profile</div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Date of birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={fieldClass()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Class level</label>
                  <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className={fieldClass()} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Speciality</label>
                  <input value={speciality} onChange={(e) => setSpeciality(e.target.value)} className={fieldClass()} />
                </div>
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Parent email</label>
                  <input
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className={fieldClass()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label block text-xs uppercase tracking-widest text-outline">Parent phone</label>
                <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={fieldClass()} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg bg-surface-container-highest/40 px-4 py-3 text-sm text-on-surface-variant ring-1 ring-outline-variant/10">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 rounded-lg bg-surface-container-highest/40 px-4 py-3 text-sm text-on-surface-variant ring-1 ring-outline-variant/10">
                <input type="checkbox" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} />
                Staff
              </label>
              <label className="flex items-center gap-2 rounded-lg bg-surface-container-highest/40 px-4 py-3 text-sm text-on-surface-variant ring-1 ring-outline-variant/10">
                <input type="checkbox" checked={isSuperuser} onChange={(e) => setIsSuperuser(e.target.checked)} />
                Superuser
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-full bg-gradient-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
