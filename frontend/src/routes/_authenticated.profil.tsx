import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "../components/PageHeader";
import { CheckCircle2, Camera, Edit2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";

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
}

function ProfilePage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("ÖĞRENCİ");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    let currentUserName = "Kullanıcı";

    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        const tokenName =
          payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
          payload.name ||
          payload.unique_name ||
          payload.sub;
        const tokenRole =
          payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
          payload.role ||
          "ÖĞRENCİ";

        if (tokenName) {
          currentUserName = tokenName;
        }
        setRole(String(tokenRole).toUpperCase());
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

          // EĞER BACKEND'DEN GERÇEK İSİM GELDİYSE ID'Yİ EZ VE ONU KULLAN
          const fName = data.firstName || data.FirstName;
          const lName = data.lastName || data.LastName;

          if (fName && lName) {
            const fullName = `${fName} ${lName}`;
            setName(fullName); // Ekrana Yiğit Cengiz yazdırır

            // Sidebar'ın (Sol alt köşenin) da bunu anında duyması için sinyal gönder
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
  }, []);

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
      showToast("Görünen ad boş olamaz.", "error");
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
        }),
      });

      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("profile-updated", { detail: { name: currentUserName, photoUrl } }),
        );
        showToast("Profil başarıyla güncellendi.");
      } else {
        showToast("Profil güncellenirken bir hata oluştu.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Sunucuya ulaşılamıyor.", "error");
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
        showToast("Fotoğraf yüklenirken bir hata oluştu.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Sunucuya ulaşılamıyor.", "error");
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
      <PageHeader crumb="/ profil / benim" />

      <div className="p-8 space-y-6 animate-reveal">
        <SectionHeader title="Profilim" />

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
                <span className="absolute -bottom-2 right-0 inline-flex items-center justify-center rounded-full bg-foreground text-background w-8 h-8 shadow-md">
                  <Camera className="w-4 h-4" />
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{name || "Kullanıcı"}</h2>
                <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">{role}</p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-1">Kendim Hakkında</h3>
                <p className="mt-2 text-sm text-foreground leading-6">
                  {!profileLoaded
                    ? "Yükleniyor..."
                    : bio ||
                      "Henüz bir açıklama eklemediniz. Profilinizi güncelleyerek ekleyebilirsiniz."}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-1">Kayıtlı Kurslar</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {displayedCourses.length > 0 ? (
                    displayedCourses.map((course) => (
                      <span
                        key={course}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                      >
                        {course}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Henüz kurs kaydınız görünmüyor.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Profil bilgileri</p>
                <h2 className="text-xl font-bold">Profili güncelle</h2>
              </div>
              <div className="rounded-full bg-foreground/5 p-3 text-foreground">
                <Edit2 className="w-4 h-4" />
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="text-sm font-medium">Profil Fotoğrafı URL</label>
                <input
                  type="url"
                  value={photoUrl && photoUrl.startsWith("data:") ? "" : photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                />
                <div className="mt-2 text-xs text-muted-foreground">veya</div>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-foreground" />
                    Dosya Seç
                  </button>
                  <div className="text-sm text-muted-foreground">
                    {fileInputRef.current &&
                    fileInputRef.current.files &&
                    fileInputRef.current.files.length > 0
                      ? fileInputRef.current.files[0].name
                      : "Dosya seçilmedi"}
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
                <label className="text-sm font-medium">Görünen Adınız</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kendim Hakkında</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-accent transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Profili Güncelle
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
