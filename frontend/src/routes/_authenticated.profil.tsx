import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "../components/PageHeader";
import { CheckCircle2, Edit2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profilim — E-Kurs" },
      { name: "description", content: "Kullanıcı profilini görüntüle ve güncelle." },
    ],
  }),
  component: ProfilePage,
});

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

interface EnrollmentDto {
  id?: number;
  Id?: number;
  studentFullName?: string;
  StudentFullName?: string;
  studentNumber?: string;
  StudentNumber?: string;
  courseTitle?: string;
  CourseTitle?: string;
}

interface ProfileDto {
  source?: string;
  aboutMe?: string;
  AboutMe?: string;
  profilePictureUrl?: string;
  ProfilePictureUrl?: string;
  // BACKEND'DEN GELECEK İSİMLER İÇİN GÜVENLİK AĞI (BÜYÜK/KÜÇÜK HARF)
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  isProfilePublic?: boolean;
  IsProfilePublic?: boolean;
}

const translateRole = (role: string, t: TFunction) => {
  const r = String(role).toLowerCase();
  if (r === "user") return t("profile.roles.student");
  if (r === "teacher") return t("profile.roles.teacher");
  if (r === "admin") return t("profile.roles.admin");
  return String(role).toUpperCase();
};

function ProfilePage() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [role, setRole] = useState(t("profile.roles.student"));
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    let currentUserName = t("profile.defaultUser");

    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        const tokenName =
          payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
          payload.name ||
          payload.unique_name ||
          payload.sub;

        // YENİ KOD BURADA OLMALI (payload tanımlandıktan sonra)
        const tokenRole =
          payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
          payload.role ||
          "user";

        if (tokenName) {
          currentUserName = tokenName;
        }

        // Çeviri fonksiyonunu burada çağırıyoruz
        setRole(translateRole(tokenRole, t));
      }
    }

    setName(currentUserName);

    const loadProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5157/api/profile/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data: ProfileDto = await res.json();
          setPhotoUrl(data.profilePictureUrl || data.ProfilePictureUrl || "");
          setBio(data.aboutMe || data.AboutMe || "");
          setIsPublic(data.isProfilePublic ?? data.IsProfilePublic ?? true);

          const fName = data.firstName || data.FirstName;
          const lName = data.lastName || data.LastName;

          const fullName = [fName, lName].filter(Boolean).join(" ");

          if (fullName) {
            setName(fullName);

            window.dispatchEvent(
              new CustomEvent("profile-updated", {
                detail: {
                  name: fullName,
                  photoUrl: data.profilePictureUrl || data.ProfilePictureUrl || "",
                },
              }),
            );
          }
        }
      } catch (err) {
        console.warn("Profil bilgisi alınamadı:", err);
      } finally {
        setProfileLoaded(true);
      }
    };

    loadProfile();
  }, [t]);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    const fetchEnrollments = async () => {
      try {
        const res = await fetch("http://localhost:5157/api/enrollments", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          setEnrollments(await res.json());
        }
      } catch (error) {
        console.error("Profilde kayıtlı kurslar yüklenirken hata:", error);
      }
    };

    fetchEnrollments();
  }, []);

  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string; photoUrl?: string } | undefined;
      if (detail?.name) setName(detail.name);
      if (detail?.photoUrl) setPhotoUrl(detail.photoUrl);
    };

    window.addEventListener("profile-updated", onProfileUpdated as EventListener);
    return () => window.removeEventListener("profile-updated", onProfileUpdated as EventListener);
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserName = name.trim();
    if (!currentUserName) {
      showToast(t("profile.errors.nameRequired"), "error");
      return;
    }

    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5157/api/profile/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AboutMe: bio,
          ProfilePictureUrl: photoUrl,
          IsProfilePublic: isPublic,
        }),
      });

      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("profile-updated", { detail: { name: currentUserName, photoUrl } }),
        );
        showToast(t("profile.errors.updateSuccess"));
      } else {
        showToast(t("profile.errors.updateFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("profile.errors.serverError"), "error");
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("jwt_token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5157/api/uploads/profile-picture", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const fullUrl = `http://localhost:5157${data.url}`;
        setPhotoUrl(fullUrl);
        window.dispatchEvent(
          new CustomEvent("profile-updated", { detail: { name, photoUrl: fullUrl } }),
        );
      } else {
        showToast(t("profile.errors.photoUploadFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("profile.errors.serverError"), "error");
    }
  };

  const displayedCourses = useMemo(() => {
    const normalizedName = name.trim().toLowerCase();
    const matchedEnrollments = enrollments
      .filter((enrollment) => {
        const studentFullName = (
          enrollment.studentFullName ||
          enrollment.StudentFullName ||
          ""
        ).toLowerCase();
        return normalizedName && studentFullName.includes(normalizedName);
      })
      .map((enrollment) => enrollment.courseTitle || enrollment.CourseTitle || "");

    return [...new Set(matchedEnrollments)];
  }, [enrollments, name]);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <PageHeader crumb={t("profile.breadcrumb")} />

      <div className="p-8 space-y-6 animate-reveal">
        <SectionHeader title={t("profile.title")} />

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profil fotoğrafı"
                    className="w-28 h-28 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-muted grid place-items-center text-3xl font-bold text-foreground border border-border">
                    {initials || "SU"}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{name || t("profile.defaultUser")}</h2>
                <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">{role}</p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-1">
                  {t("profile.aboutMe")}
                </h3>
                <p className="mt-2 text-sm text-foreground leading-6">
                  {!profileLoaded ? t("profile.loading") : bio || t("profile.noBio")}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-1">
                  {t("profile.enrolledCourses")}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {displayedCourses.length > 0 ? (
                    displayedCourses.map((course) => (
                      <span
                        key={course}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                      >
                        {i18n.exists(`dynamic.courses.${course}`)
                          ? t(`dynamic.courses.${course}`)
                          : course}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("profile.noCourses")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-muted-foreground">
                  {t("profile.profileInfo")}
                </p>
                <h2 className="text-xl font-bold">{t("profile.updateProfile")}</h2>
              </div>
              <div className="rounded-full bg-foreground/5 p-3 text-foreground">
                <Edit2 className="w-4 h-4" />
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="text-sm font-medium">{t("profile.photoUrl")}</label>
                <input
                  type="url"
                  value={photoUrl && photoUrl.startsWith("data:") ? "" : photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                />
                <div className="mt-2 text-xs text-muted-foreground">{t("profile.or")}</div>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-foreground" />
                    {t("profile.chooseFile")}
                  </button>
                  <div className="text-sm text-muted-foreground">
                    {fileInputRef.current &&
                    fileInputRef.current.files &&
                    fileInputRef.current.files.length > 0
                      ? fileInputRef.current.files[0].name
                      : t("profile.noFileChosen")}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t("profile.displayName")}</label>
                <input
                  type="text"
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t("profile.aboutMe")}</label>
                <textarea
                  rows={4}
                  value={bio}
                  maxLength={1000}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium block">
                  {t("profile.profileVisibility", "Profil Görünürlüğü")}
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="accent-foreground"
                    />
                    <span className="text-sm">{t("profile.public", "Herkese Açık")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="accent-foreground"
                    />
                    <span className="text-sm">{t("profile.hidden", "Gizli")}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-accent transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t("profile.saveProfile")}
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-300 flex items-center gap-3 rounded-lg px-5 py-3.5 text-sm font-bold text-white shadow-xl ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {toast.message}
        </div>
      )}
    </>
  );
}
