import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import {
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Camera,
  Upload,
  Link2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAdminGuard } from "../hooks/useAdminGuard";

export const Route = createFileRoute("/_authenticated/ogrenciler")({
  component: StudentsPage,
});

interface StudentData {
  id?: string | number;
  Id?: string | number;
  name?: string;
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  email?: string;
  Email?: string;
  course?: string;
  Course?: string;
  date?: string;
  Date?: string;
  status?: string;
  Status?: string;
  initials?: string;
  studentNumber?: string;
  StudentNumber?: string;
  profilePictureUrl?: string;
  ProfilePictureUrl?: string;
  aboutMe?: string;
  AboutMe?: string;
}

interface EnrollmentData {
  id?: string | number;
  Id?: string | number;
  studentId?: string | number;
  StudentId?: string | number;
  courseId?: string | number;
  CourseId?: string | number;
  enrollmentDate?: string;
  EnrollmentDate?: string;
  date?: string;
  Date?: string;
  studentFullName?: string;
  StudentFullName?: string;
  studentNumber?: string;
  StudentNumber?: string;
  courseTitle?: string;
  CourseTitle?: string;
}

function StudentsPage() {
  useAdminGuard();
  const [searchTerm, setSearchTerm] = useState("");
  const [dbStudents, setDbStudents] = useState<StudentData[]>([]);
  const [dbEnrollments, setDbEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ÇOKLU SEÇİM VE DÜZENLEME MODU STATE'LERİ
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<(string | number)[]>([]);

  // PROFİL GÖRÜNTÜLEME İÇİN STATE
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<StudentData | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
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

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5157/api/students", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbStudents(data);
      } else {
        // Backend'den gelen gerçek hatayı görebilmek için ekliyoruz
        const errorText = await response.text();
        console.error(`Öğrenciler alınamadı (status ${response.status}):`, errorText);
      }
    } catch (error) {
      console.error("Öğrenciler yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    const fetchEnrollments = async () => {
      const token = localStorage.getItem("jwt_token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const res = await fetch("http://localhost:5157/api/enrollments", { headers });
        if (res.ok) {
          setDbEnrollments(await res.json());
        }
      } catch (error) {
        console.error("Kayıtlar çekilirken hata:", error);
      }
    };

    fetchEnrollments();
  }, []);

  const currentStudentId = selectedProfileStudent?.id ?? selectedProfileStudent?.Id;

  useEffect(() => {
    setIsEditingProfile(false);
  }, [currentStudentId]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedStudentIds([]);
  };

  const handleSelectStudent = (id: string | number | undefined) => {
    if (!id) return;
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((studentId) => studentId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allFilteredIds = filteredStudents
        .map((s) => s.id || s.Id)
        .filter((id): id is string | number => id !== undefined);
      setSelectedStudentIds(allFilteredIds);
    } else {
      setSelectedStudentIds([]);
    }
  };

  const confirmDelete = async () => {
    if (selectedStudentIds.length === 0) return;

    try {
      const token = localStorage.getItem("jwt_token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await Promise.all(
        selectedStudentIds.map((id) =>
          fetch(`http://localhost:5157/api/students/${id}`, {
            method: "DELETE",
            headers,
          }),
        ),
      );

      setDbStudents((prevStudents) =>
        prevStudents.filter((s) => !selectedStudentIds.includes(s.id || (s.Id as string | number))),
      );

      showToast(`${selectedStudentIds.length} öğrenci başarıyla silindi!`);
      setIsDeleteModalOpen(false);
      setSelectedStudentIds([]);
      setIsEditMode(false);
    } catch (error) {
      console.error("Silme hatası:", error);
      showToast("Öğrenciler silinirken bir hata oluştu.", "error");
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFirstName.trim() || !newLastName.trim()) {
      showToast("Ad ve soyad boş olamaz.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Register endpoint kullanıcıyı + öğrenci profilini otomatik oluşturur
      // (RegistrationCode boş = "User" rolü = otomatik Student kaydı)
      const res = await fetch("http://localhost:5157/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          registrationCode: null,
        }),
      });

      if (res.ok) {
        showToast("Öğrenci başarıyla sisteme kaydedildi!");
        setNewFirstName("");
        setNewLastName("");
        setNewEmail("");
        setNewUsername("");
        setNewPassword("");
        setIsModalOpen(false);
        fetchStudents();
      } else {
        const errText = await res.text();
        console.error("Register hatası:", errText);
        showToast(errText || "Kayıt başarısız!", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Sunucuya ulaşılamıyor.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchLower = searchTerm.toLowerCase();
  const filteredStudents = dbStudents.filter((s) => {
    const fName = s.name || `${s.firstName || s.FirstName || ""} ${s.lastName || s.LastName || ""}`;
    const fEmail = s.email || s.Email || "";
    const fCourse = s.course || s.Course || "";
    return (
      fName.toLowerCase().includes(searchLower) ||
      fEmail.toLowerCase().includes(searchLower) ||
      fCourse.toLowerCase().includes(searchLower)
    );
  });

  // Seçili öğrencinin kurs kayıtlarını profil modalı için hesaplayan yardımcı fonksiyon
  const getSelectedStudentEnrollments = () => {
    if (!selectedProfileStudent) return [];
    const fullName =
      selectedProfileStudent.name ||
      `${selectedProfileStudent.firstName || selectedProfileStudent.FirstName || ""} ${selectedProfileStudent.lastName || selectedProfileStudent.LastName || ""}`.trim();
    const studentFullName = fullName.toLowerCase();
    const studentNumber = String(
      selectedProfileStudent.studentNumber || selectedProfileStudent.StudentNumber || "",
    ).toLowerCase();

    return dbEnrollments.filter((e) => {
      const enrName = String(e.studentFullName || e.StudentFullName || "").toLowerCase();
      const enrNumber = String(e.studentNumber || e.StudentNumber || "").toLowerCase();
      return (
        (enrName && studentFullName && enrName.includes(studentFullName)) ||
        (enrNumber && studentNumber && enrNumber === studentNumber)
      );
    });
  };

  const handleStartEditProfile = () => {
    if (!selectedProfileStudent) return;
    setEditFirstName(selectedProfileStudent.firstName || selectedProfileStudent.FirstName || "");
    setEditLastName(selectedProfileStudent.lastName || selectedProfileStudent.LastName || "");
    setEditEmail(selectedProfileStudent.email || selectedProfileStudent.Email || "");
    setEditAboutMe(selectedProfileStudent.aboutMe || selectedProfileStudent.AboutMe || "");
    setEditProfilePictureUrl(
      selectedProfileStudent.profilePictureUrl || selectedProfileStudent.ProfilePictureUrl || "",
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

  const handleSaveStudentEdit = async () => {
    if (!selectedProfileStudent) return;
    const studentId = selectedProfileStudent.id ?? selectedProfileStudent.Id;
    if (!studentId) {
      showToast("Öğrenci kimliği bulunamadı.", "error");
      return;
    }
    if (!editFirstName.trim() || !editLastName.trim()) {
      showToast("Ad ve soyad boş olamaz.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem("jwt_token");
      // handleSaveStudentEdit fonksiyonu içindeki fetch isteğini bu şekilde güncelleyin:

      const response = await fetch(`http://localhost:5157/api/students/${studentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Id: studentId, // Eksik olan Id eklendi
          FirstName: editFirstName,
          LastName: editLastName,
          Email: editEmail,
          AboutMe: editAboutMe,
          ProfilePictureUrl: editProfilePictureUrl,
          // Backend'de zorunlu (required) olma ihtimaline karşı mevcut değerleri de gönderiyoruz:
          StudentNumber:
            selectedProfileStudent.studentNumber || selectedProfileStudent.StudentNumber,
          Status: selectedProfileStudent.status || selectedProfileStudent.Status,
          Date: selectedProfileStudent.date || selectedProfileStudent.Date,
        }),
      });

      if (response.ok) {
        const updatedStudent: StudentData = {
          ...selectedProfileStudent,
          firstName: editFirstName,
          FirstName: editFirstName,
          lastName: editLastName,
          LastName: editLastName,
          email: editEmail,
          Email: editEmail,
          aboutMe: editAboutMe,
          AboutMe: editAboutMe,
          profilePictureUrl: editProfilePictureUrl,
          ProfilePictureUrl: editProfilePictureUrl,
        };
        setSelectedProfileStudent(updatedStudent);
        setDbStudents((prev) =>
          prev.map((s) => ((s.id ?? s.Id) === studentId ? updatedStudent : s)),
        );
        setIsEditingProfile(false);
        showToast("Öğrenci başarıyla güncellendi.");
      } else {
        const errorText = await response.text();
        console.error("Öğrenci güncellenirken hata:", errorText);
        showToast("Öğrenci güncellenirken bir hata oluştu.", "error");
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
        crumb="/ ogrenciler "
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <div className="flex gap-2">
            {isEditMode && selectedStudentIds.length > 0 && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-red-600 transition-colors animate-in fade-in"
              >
                <Trash2 className="size-4" />
                Seçilenleri Sil ({selectedStudentIds.length})
              </button>
            )}

            <button
              onClick={toggleEditMode}
              className="flex items-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-xs font-bold transition-colors"
            >
              {isEditMode ? "İptal" : "Öğrencileri Düzenle"}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Yeni Öğrenci
            </button>
          </div>
        }
      />

      <div className="p-8 animate-reveal">
        <div className="flex items-end justify-between border-b border-foreground/10 pb-2 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest">Tüm Öğrenciler</h2>
        </div>

        <div className="bg-card border border-border overflow-x-auto rounded-md shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/2 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                  Öğrenci
                </th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                  E-Posta
                </th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
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
                        selectedStudentIds.length === filteredStudents.length &&
                        filteredStudents.length > 0
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
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-widest"
                  >
                    Öğrenciler Yükleniyor...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-xs">
                    Kayıtlı öğrenci bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => {
                  const fullName =
                    s.name ||
                    `${s.firstName || s.FirstName || ""} ${s.lastName || s.LastName || ""}`.trim() ||
                    "İsimsiz Öğrenci";
                  const email = s.email || s.Email || "-";
                  const initials = s.initials || fullName.slice(0, 2).toUpperCase();

                  const studentFullName = fullName.trim().toLowerCase();
                  const rawStudentNumber = s.studentNumber || s.StudentNumber || "";
                  const studentNumber = String(rawStudentNumber).toLowerCase();

                  const studentEnrollments = dbEnrollments.filter((e) => {
                    const rawEnrName = e.studentFullName || e.StudentFullName || "";
                    const enrName = String(rawEnrName).toLowerCase();
                    const rawEnrNumber = e.studentNumber || e.StudentNumber || "";
                    const enrNumber = String(rawEnrNumber).toLowerCase();

                    return (
                      (enrName && studentFullName && enrName.includes(studentFullName)) ||
                      (enrNumber && studentNumber && enrNumber === studentNumber)
                    );
                  });

                  const calculatedStatus = studentEnrollments.length > 0 ? "AKTİF" : "PASİF";
                  const dateRaw = s.date || s.Date;
                  const date = dateRaw ? new Date(dateRaw).toLocaleDateString("tr-TR") : "-";
                  const currentId = s.id || s.Id;

                  return (
                    <tr
                      key={currentId || index}
                      className={`hover:bg-foreground/2 transition-colors ${
                        selectedStudentIds.includes(currentId as string | number)
                          ? "bg-foreground/5"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        {/* TIKLANABİLİR PROFİL ALANI */}
                        <div
                          className="flex items-center gap-3 cursor-pointer group w-fit"
                          onClick={() => setSelectedProfileStudent(s)}
                          title="Profili Görüntüle"
                        >
                          <div className="size-10 rounded bg-muted grid place-items-center text-[10px] font-mono text-muted-foreground shrink-0 uppercase group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold group-hover:underline">{fullName}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {s.studentNumber || s.StudentNumber || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{email}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{date}</td>
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
                            checked={selectedStudentIds.includes(currentId as string | number)}
                            onChange={() => handleSelectStudent(currentId)}
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
          <div>Toplam {filteredStudents.length} öğrenci</div>
        </div>
      </div>

      {/* PROFİL MODALI */}
      {selectedProfileStudent && (
        <div
          onClick={() => setSelectedProfileStudent(null)}
          className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-8 relative flex flex-col items-center animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setSelectedProfileStudent(null)}
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
                <h2 className="text-lg font-bold text-center mb-2">Öğrenciyi Düzenle</h2>

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
                    onClick={handleSaveStudentEdit}
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
                  {selectedProfileStudent.profilePictureUrl ||
                  selectedProfileStudent.ProfilePictureUrl ? (
                    <img
                      src={
                        selectedProfileStudent.profilePictureUrl ||
                        selectedProfileStudent.ProfilePictureUrl
                      }
                      alt="Profil"
                      className="size-24 rounded-full object-cover shadow-md border border-border"
                    />
                  ) : (
                    <div className="size-24 rounded-full bg-linear-to-tr from-stone-800 to-stone-600 text-white flex items-center justify-center text-3xl font-mono uppercase shadow-md">
                      {(
                        selectedProfileStudent.name ||
                        `${selectedProfileStudent.firstName || selectedProfileStudent.FirstName || ""} ${selectedProfileStudent.lastName || selectedProfileStudent.LastName || ""}`
                      )
                        .trim()
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-foreground mb-1 text-center">
                  {selectedProfileStudent.name ||
                    `${selectedProfileStudent.firstName || selectedProfileStudent.FirstName || ""} ${selectedProfileStudent.lastName || selectedProfileStudent.LastName || ""}`.trim() ||
                    "İsimsiz Öğrenci"}
                </h2>
                <p className="text-[11px] tracking-[0.2em] font-medium uppercase text-muted-foreground mb-8">
                  Öğrenci
                </p>

                <div className="w-full space-y-6 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-foreground/80 mb-2">Kendim Hakkında</h3>
                    <p className="text-sm text-foreground">
                      {selectedProfileStudent.aboutMe ||
                        selectedProfileStudent.AboutMe ||
                        "Henüz bir açıklama eklenmemiş."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      No:{" "}
                      {selectedProfileStudent.studentNumber ||
                        selectedProfileStudent.StudentNumber ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground/80 mb-2">Kayıtlı Kurslar</h3>
                    {getSelectedStudentEnrollments().length > 0 ? (
                      <ul className="text-sm text-foreground space-y-1.5">
                        {getSelectedStudentEnrollments().map((enr, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-foreground/50 shrink-0"></span>
                            {enr.courseTitle || enr.CourseTitle}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Henüz kurs kaydı bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* YENİ ÖĞRENCİ EKLEME MODALI */}
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

            <h2 className="text-xl font-bold mb-6 tracking-tight">Yeni Öğrenci Ekle</h2>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Ad</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Örn: Yağız"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Soyad</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Örn: Cengiz"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-posta</label>
                <input
                  type="email"
                  required
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Lütfen geçerli bir e-posta adresi girin (Örn: isim@mail.com)"
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Örn: yagiz@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kullanıcı Adı (Giriş ID)</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Örn: yagizcngz"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Şifre</label>
                <input
                  type="password"
                  required
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-foreground text-background text-sm font-bold hover:opacity-90 rounded-md transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
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
                  Seçili <strong>{selectedStudentIds.length}</strong> öğrenciyi silmek istediğinize
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
                    Evet
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-sm font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    Hayır
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
