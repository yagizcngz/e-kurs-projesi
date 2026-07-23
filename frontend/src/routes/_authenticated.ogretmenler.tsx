import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Plus, X, CheckCircle2, AlertCircle, Edit2, Trash2, Upload, Link2 } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/ogretmenler")({
  component: TeachersPage,
});

interface TeacherData {
  id?: string | number;
  Id?: string | number;
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  email?: string;
  Email?: string;
  branch?: string;
  Branch?: string;
  date?: string;
  Date?: string;
  profilePictureUrl?: string;
  ProfilePictureUrl?: string;
  aboutMe?: string;
  AboutMe?: string;
}

interface CourseData {
  id?: string | number;
  Id?: string | number;
  title?: string;
  Title?: string;
  instructor?: string;
  Instructor?: string;
}

function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dbTeachers, setDbTeachers] = useState<TeacherData[]>([]);
  const [dbCourses, setDbCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ÇOKLU SEÇİM VE DÜZENLEME MODU STATE'LERİ
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<(string | number)[]>([]);

  // PROFİL GÖRÜNTÜLEME İÇİN STATE
  const [selectedProfileTeacher, setSelectedProfileTeacher] = useState<TeacherData | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editAboutMe, setEditAboutMe] = useState("");
  const [editProfilePictureUrl, setEditProfilePictureUrl] = useState("");
  const [profileImageMode, setProfileImageMode] = useState<"upload" | "link">("upload");
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5157/api/teachers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbTeachers(data);
      } else {
        const errorText = await response.text();
        console.error(`Öğretmenler alınamadı (status ${response.status}):`, errorText);
      }
    } catch (error) {
      console.error("Öğretmenler yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();

    const fetchCourses = async () => {
      const token = localStorage.getItem("jwt_token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const res = await fetch("http://localhost:5157/api/courses", { headers });
        if (res.ok) {
          setDbCourses(await res.json());
        }
      } catch (error) {
        console.error("Kurslar çekilirken hata:", error);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    setIsEditingProfile(false);
  }, [selectedProfileTeacher?.id ?? selectedProfileTeacher?.Id]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedTeacherIds([]);
  };

  const handleSelectTeacher = (id: string | number | undefined) => {
    if (!id) return;
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((teacherId) => teacherId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allFilteredIds = filteredTeachers
        .map((t) => t.id || t.Id)
        .filter((id): id is string | number => id !== undefined);
      setSelectedTeacherIds(allFilteredIds);
    } else {
      setSelectedTeacherIds([]);
    }
  };

  const confirmDelete = async () => {
    if (selectedTeacherIds.length === 0) return;

    try {
      const token = localStorage.getItem("jwt_token");

      // Backend'de bunun için ayrı bir toplu silme uç noktası var, tek tek istek atmaya gerek yok.
      const response = await fetch("http://localhost:5157/api/teachers/bulk-delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedTeacherIds),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Toplu silme hatası:", errorText);
        showToast("Öğretmenler silinirken bir hata oluştu.", "error");
        return;
      }

      setDbTeachers((prevTeachers) =>
        prevTeachers.filter((t) => !selectedTeacherIds.includes(t.id || (t.Id as string | number))),
      );

      showToast(`${selectedTeacherIds.length} öğretmen başarıyla silindi!`);
      setIsDeleteModalOpen(false);
      setSelectedTeacherIds([]);
      setIsEditMode(false);
    } catch (error) {
      console.error("Silme hatası:", error);
      showToast("Öğretmenler silinirken bir hata oluştu.", "error");
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameParts = newName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      showToast("Lütfen adınızı ve soyadınızı aralarında boşluk bırakarak tam girin.", "error");
      return;
    }

    const lastName = nameParts.pop();
    const firstName = nameParts.join(" ");

    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5157/api/teachers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FirstName: firstName,
          LastName: lastName,
          Email: newEmail,
          Branch: newBranch,
          Date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        showToast("Öğretmen başarıyla sisteme kaydedildi!");
        setNewName("");
        setNewEmail("");
        setNewBranch("");
        setIsModalOpen(false);
        fetchTeachers();
      } else {
        const errorData = await response.text();
        console.error("Backend hatası:", errorData);
        showToast("Kayıt başarısız! Bilgileri kontrol edin.", "error");
      }
    } catch (error) {
      showToast("Sunucuya ulaşılamıyor.", "error");
    }
  };

  const searchLower = searchTerm.toLowerCase();
  const filteredTeachers = dbTeachers.filter((t) => {
    const fName = `${t.firstName || t.FirstName || ""} ${t.lastName || t.LastName || ""}`;
    const fEmail = t.email || t.Email || "";
    const fBranch = t.branch || t.Branch || "";
    return (
      fName.toLowerCase().includes(searchLower) ||
      fEmail.toLowerCase().includes(searchLower) ||
      fBranch.toLowerCase().includes(searchLower)
    );
  });

  // Öğretmenin güncel olarak bir kursta eğitmen olarak görünüp görünmediğine göre
  // aktif/pasif durumunu hesaplar (kurs listesindeki "instructor" alanına göre eşleştirme)
  const getTeacherStatus = (t: TeacherData) => {
    const fullName = `${t.firstName || t.FirstName || ""} ${t.lastName || t.LastName || ""}`
      .trim()
      .toLowerCase();
    if (!fullName) return "PASİF";

    const isTeaching = dbCourses.some((c) => {
      const instructor = String(c.instructor || c.Instructor || "").toLowerCase();
      return instructor && instructor.includes(fullName);
    });

    return isTeaching ? "AKTİF" : "PASİF";
  };

  const handleStartEditProfile = () => {
    if (!selectedProfileTeacher) return;
    setEditFirstName(selectedProfileTeacher.firstName || selectedProfileTeacher.FirstName || "");
    setEditLastName(selectedProfileTeacher.lastName || selectedProfileTeacher.LastName || "");
    setEditEmail(selectedProfileTeacher.email || selectedProfileTeacher.Email || "");
    setEditBranch(selectedProfileTeacher.branch || selectedProfileTeacher.Branch || "");
    setEditAboutMe(selectedProfileTeacher.aboutMe || selectedProfileTeacher.AboutMe || "");
    setEditProfilePictureUrl(
      selectedProfileTeacher.profilePictureUrl || selectedProfileTeacher.ProfilePictureUrl || "",
    );
    setProfileImageMode("upload");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => setIsEditingProfile(false);

  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProfileImage(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5157/api/uploads/profile-picture", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setEditProfilePictureUrl(`http://localhost:5157${data.url}`);
      } else {
        showToast("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Sunucuya ulaşılamıyor.", "error");
    } finally {
      setIsUploadingProfileImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveProfileImage = () => setEditProfilePictureUrl("");

  const handleSaveTeacherEdit = async () => {
    if (!selectedProfileTeacher) return;
    const teacherId = selectedProfileTeacher.id ?? selectedProfileTeacher.Id;
    if (!teacherId) {
      showToast("Öğretmen kimliği bulunamadı.", "error");
      return;
    }
    if (!editFirstName.trim() || !editLastName.trim()) {
      showToast("Ad ve soyad boş olamaz.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem("jwt_token");

      const response = await fetch(`http://localhost:5157/api/teachers/${teacherId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Id: teacherId,
          FirstName: editFirstName,
          LastName: editLastName,
          Email: editEmail,
          Branch: editBranch,
          AboutMe: editAboutMe,
          ProfilePictureUrl: editProfilePictureUrl,
          Date: selectedProfileTeacher.date || selectedProfileTeacher.Date,
        }),
      });

      if (response.ok) {
        const updatedTeacher: TeacherData = {
          ...selectedProfileTeacher,
          firstName: editFirstName,
          FirstName: editFirstName,
          lastName: editLastName,
          LastName: editLastName,
          email: editEmail,
          Email: editEmail,
          branch: editBranch,
          Branch: editBranch,
          aboutMe: editAboutMe,
          AboutMe: editAboutMe,
          profilePictureUrl: editProfilePictureUrl,
          ProfilePictureUrl: editProfilePictureUrl,
        };
        setSelectedProfileTeacher(updatedTeacher);
        setDbTeachers((prev) =>
          prev.map((t) => ((t.id ?? t.Id) === teacherId ? updatedTeacher : t)),
        );
        setIsEditingProfile(false);
        showToast("Öğretmen başarıyla güncellendi.");
      } else {
        const errorText = await response.text();
        console.error("Öğretmen güncellenirken hata:", errorText);
        showToast("Öğretmen güncellenirken bir hata oluştu.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Sunucuya ulaşılamıyor.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <>
      <PageHeader
        crumb="/ ogretmenler "
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <div className="flex gap-2">
            {isEditMode && selectedTeacherIds.length > 0 && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-red-600 transition-colors animate-in fade-in"
              >
                <Trash2 className="size-4" />
                Seçilenleri Sil ({selectedTeacherIds.length})
              </button>
            )}

            <button
              onClick={toggleEditMode}
              className="flex items-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-xs font-bold transition-colors"
            >
              {isEditMode ? "İptal" : "Öğretmenleri Düzenle"}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Yeni Öğretmen
            </button>
          </div>
        }
      />

      <div className="p-8 animate-reveal">
        <div className="flex items-end justify-between border-b border-foreground/10 pb-2 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest">Tüm Öğretmenler</h2>
        </div>

        <div className="bg-card border border-border overflow-x-auto rounded-md shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/2 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                  Öğretmen
                </th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                  E-Posta
                </th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                  Branş
                </th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground text-right">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground text-right">
                  Durum
                </th>
                {isEditMode && (
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground text-right">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-gray-300 text-foreground focus:ring-foreground cursor-pointer"
                      onChange={handleSelectAll}
                      checked={
                        selectedTeacherIds.length === filteredTeachers.length &&
                        filteredTeachers.length > 0
                      }
                    />
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-widest"
                  >
                    Öğretmenler Yükleniyor...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-xs">
                    Kayıtlı öğretmen bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, index) => {
                  const fullName =
                    `${t.firstName || t.FirstName || ""} ${t.lastName || t.LastName || ""}`.trim() ||
                    "İsimsiz Öğretmen";
                  const email = t.email || t.Email || "-";
                  const branch = t.branch || t.Branch || "-";
                  const initials = fullName.slice(0, 2).toUpperCase();
                  const dateRaw = t.date || t.Date;
                  const date = dateRaw ? new Date(dateRaw).toLocaleDateString("tr-TR") : "-";
                  const currentId = t.id || t.Id;
                  const calculatedStatus = getTeacherStatus(t);

                  return (
                    <tr
                      key={currentId || index}
                      className={`hover:bg-foreground/2 transition-colors ${
                        selectedTeacherIds.includes(currentId as string | number)
                          ? "bg-foreground/5"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        {/* TIKLANABİLİR PROFİL ALANI */}
                        <div
                          className="flex items-center gap-3 cursor-pointer group w-fit"
                          onClick={() => setSelectedProfileTeacher(t)}
                          title="Profili Görüntüle"
                        >
                          <div className="size-10 rounded bg-muted grid place-items-center text-[10px] font-mono text-muted-foreground shrink-0 uppercase group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold group-hover:underline">{fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{branch}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground text-right">
                        {date}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold rounded-sm ${
                            calculatedStatus === "AKTİF"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-stone-500/10 text-stone-500"
                          }`}
                        >
                          {calculatedStatus}
                        </span>
                      </td>
                      {isEditMode && (
                        <td className="px-6 py-4 text-right">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-gray-300 text-foreground focus:ring-foreground cursor-pointer"
                            checked={selectedTeacherIds.includes(currentId as string | number)}
                            onChange={() => handleSelectTeacher(currentId)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground font-mono">
          <div>Toplam {filteredTeachers.length} öğretmen</div>
        </div>
      </div>

      {/* PROFİL MODALI */}
      {selectedProfileTeacher && (
        <div
          onClick={() => setSelectedProfileTeacher(null)}
          className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-8 relative flex flex-col items-center animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setSelectedProfileTeacher(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>

            {!isEditingProfile && (
              <button
                onClick={handleStartEditProfile}
                className="absolute top-4 right-14 flex items-center gap-1.5 text-xs font-bold border border-border rounded-md px-3 py-1.5 hover:bg-foreground/5 transition-colors"
              >
                <Edit2 className="size-3.5" />
                Düzenle
              </button>
            )}

            {isEditingProfile ? (
              <div className="w-full space-y-4">
                <h2 className="text-lg font-bold text-center mb-2">Öğretmeni Düzenle</h2>

                <div className="flex flex-col items-center gap-3">
                  {editProfilePictureUrl ? (
                    <img
                      src={
                        editProfilePictureUrl.startsWith("http") ||
                        editProfilePictureUrl.startsWith("data:")
                          ? editProfilePictureUrl
                          : `http://localhost:5157${editProfilePictureUrl}`
                      }
                      alt="Önizleme"
                      className="size-20 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="size-20 rounded-full bg-linear-to-tr from-stone-800 to-stone-600 text-white flex items-center justify-center text-2xl font-mono uppercase">
                      {`${editFirstName || ""} ${editLastName || ""}`
                        .trim()
                        .slice(0, 2)
                        .toUpperCase() || "?"}
                    </div>
                  )}

                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setProfileImageMode("upload")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md border transition-colors ${
                        profileImageMode === "upload"
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:bg-foreground/5"
                      }`}
                    >
                      <Upload className="size-3.5" />
                      Dosya Yükle
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileImageMode("link")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md border transition-colors ${
                        profileImageMode === "link"
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:bg-foreground/5"
                      }`}
                    >
                      <Link2 className="size-3.5" />
                      Link Yapıştır
                    </button>
                  </div>

                  {profileImageMode === "upload" ? (
                    <label className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold border border-dashed border-border rounded-md cursor-pointer hover:bg-foreground/5 transition-colors">
                      {isUploadingProfileImage ? "Yükleniyor..." : "Bilgisayardan seç"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        disabled={isUploadingProfileImage}
                        onChange={handleProfileFileChange}
                      />
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={editProfilePictureUrl}
                      onChange={(e) => setEditProfilePictureUrl(e.target.value)}
                      placeholder="https://ornek.com/fotograf.jpg"
                      className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                    />
                  )}

                  {editProfilePictureUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveProfileImage}
                      className="text-[11px] font-mono text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      Fotoğrafı kaldır
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Ad</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Soyad</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">E-posta</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Branş</label>
                  <input
                    type="text"
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    placeholder="Örn: Matematik"
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Kendim Hakkında</label>
                  <textarea
                    rows={3}
                    value={editAboutMe}
                    onChange={(e) => setEditAboutMe(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEditProfile}
                    disabled={isSavingProfile}
                    className="flex-1 py-2.5 px-4 bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80 rounded-md transition-colors disabled:opacity-60"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTeacherEdit}
                    disabled={isSavingProfile || isUploadingProfileImage}
                    className="flex-1 py-2.5 px-4 bg-foreground text-background text-sm font-bold hover:opacity-90 rounded-md transition-opacity disabled:opacity-60"
                  >
                    {isSavingProfile ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-4 mt-2">
                  {selectedProfileTeacher.profilePictureUrl ||
                  selectedProfileTeacher.ProfilePictureUrl ? (
                    <img
                      src={
                        selectedProfileTeacher.profilePictureUrl ||
                        selectedProfileTeacher.ProfilePictureUrl
                      }
                      alt="Profil"
                      className="size-24 rounded-full object-cover shadow-md border border-border"
                    />
                  ) : (
                    <div className="size-24 rounded-full bg-linear-to-tr from-stone-800 to-stone-600 text-white flex items-center justify-center text-3xl font-mono uppercase shadow-md">
                      {`${selectedProfileTeacher.firstName || selectedProfileTeacher.FirstName || ""} ${selectedProfileTeacher.lastName || selectedProfileTeacher.LastName || ""}`
                        .trim()
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-foreground mb-1 text-center">
                  {`${selectedProfileTeacher.firstName || selectedProfileTeacher.FirstName || ""} ${selectedProfileTeacher.lastName || selectedProfileTeacher.LastName || ""}`.trim() ||
                    "İsimsiz Öğretmen"}
                </h2>
                <p className="text-[11px] tracking-[0.2em] font-medium uppercase text-muted-foreground mb-2">
                  Öğretmen
                </p>
                <span
                  className={`mb-8 inline-block px-2 py-1 text-[10px] font-bold rounded-sm ${
                    getTeacherStatus(selectedProfileTeacher) === "AKTİF"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-stone-500/10 text-stone-500"
                  }`}
                >
                  {getTeacherStatus(selectedProfileTeacher)}
                </span>

                <div className="w-full space-y-6 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-foreground/80 mb-2">Kendim Hakkında</h3>
                    <p className="text-sm text-foreground">
                      {selectedProfileTeacher.aboutMe ||
                        selectedProfileTeacher.AboutMe ||
                        "Henüz bir açıklama eklenmemiş."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground/80 mb-2">Branş</h3>
                    <p className="text-sm text-foreground">
                      {selectedProfileTeacher.branch || selectedProfileTeacher.Branch || "-"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* YENİ ÖĞRETMEN EKLEME MODALI */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-bold mb-6 tracking-tight">Yeni Öğretmen Ekle</h2>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Öğretmen Adı Soyadı</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Ayşe Yılmaz"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Lütfen geçerli bir e-posta adresi girin (Örn: isim@mail.com)"
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Örn: ayse@mail.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Branş</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="Örn: Matematik"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80 rounded-md transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-foreground text-background text-sm font-bold hover:opacity-90 rounded-md transition-opacity"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-xl text-sm font-bold text-white z-300 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <AlertCircle className="size-5" />
          )}
          {toast.message}
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="size-10 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Trash2 className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Silme Onayı</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Seçili <strong>{selectedTeacherIds.length}</strong> öğretmeni silmek istediğinize
                  emin misiniz?
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Bu işlem geri alınamaz. Lütfen onaylayın veya iptal edin.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                  >
                    Evet, Sil
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-sm font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    Hayır, İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
