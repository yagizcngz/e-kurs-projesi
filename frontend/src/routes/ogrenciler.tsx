import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { statusStyles } from "../lib/mock-data";

export const Route = createFileRoute("/ogrenciler")({
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
  const [searchTerm, setSearchTerm] = useState("");
  const [dbStudents, setDbStudents] = useState<StudentData[]>([]);
  const [dbEnrollments, setDbEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | number | null>(null);

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
      }
    } catch (error) {
      console.error("Öğrenciler yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Sizin mevcut öğrencileri çeken fonksiyonunuz
    fetchStudents();

    // Kayıtları (enrollments) çeken YENİ kod bloğumuz
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
  // Bu fonksiyon sadece modalı açacak ve silinecek ID'yi kaydedecek
  const handleDeleteStudent = (studentId: string | number | undefined) => {
    if (!studentId) return;
    setStudentToDelete(studentId);
    setIsDeleteModalOpen(true);
  };

  // Bu fonksiyon modalda "Evet"e basıldığında çalışacak asıl silme işlemi
  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      const token = localStorage.getItem("jwt_token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`http://localhost:5157/api/students/${studentToDelete}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        setDbStudents((prevStudents) =>
          prevStudents.filter((s) => (s.id || s.Id) !== studentToDelete),
        );
        // Başarılıysa modalı kapat ve seçili öğrenciyi sıfırla
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
      } else {
        console.error("Öğrenci silinirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  // Modalı iptal etme fonksiyonu
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameParts = newName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      showToast("Lütfen adınızı ve soyadınızı aralarında boşluk bırakarak tam girin.", "error");
      return;
    }

    const lastName = nameParts.pop();
    const firstName = nameParts.join(" ");

    const yearPrefix = new Date().getFullYear().toString().slice(-2);

    // --- YENİ EKLENEN KISIM: En büyük numarayı bularak çakışmaları önlüyoruz ---
    let maxSequence = 0;
    dbStudents.forEach((s) => {
      const numStr = s.studentNumber || s.StudentNumber || "";
      // Eğer numara mevcut yılın prefixi (örn: "26") ile başlıyorsa
      if (numStr.startsWith(yearPrefix)) {
        // "26" kısmını atıp kalan numarayı sayıya çevir
        const seq = parseInt(numStr.slice(2), 10);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    });

    // En büyük numaranın bir fazlasını al (Eğer liste boşsa 1 olur)
    const nextSequence = String(maxSequence + 1).padStart(7, "0");
    const logicalStudentNumber = `${yearPrefix}${nextSequence}`;
    // -------------------------------------------------------------------------

    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5157/api/students", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FirstName: firstName,
          LastName: lastName,
          StudentNumber: logicalStudentNumber,
          Email: newEmail,
          Status: "AKTİF",
          Date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        showToast("Öğrenci başarıyla sisteme kaydedildi!");
        setNewName("");
        setNewEmail("");
        setIsModalOpen(false);
        fetchStudents();
      } else {
        const errorData = await response.text();
        // Hatanın detayını tarayıcı konsoluna yazdırıyoruz
        console.error("Backend hatası:", errorData);
        showToast("Kayıt başarısız! Bilgileri kontrol edin.", "error");
      }
    } catch (error) {
      showToast("Sunucuya ulaşılamıyor.", "error");
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

  return (
    <>
      <PageHeader
        crumb="/ ogrenciler / lİste"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            Yeni Öğrenci
          </button>
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
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground text-right">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-widest"
                  >
                    Öğrenciler Yükleniyor...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-xs">
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

                  // 1. Öğrenci ile kayıtları eşleştir
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

                  // YENİ EKLENEN KISIM: Eğer öğrencinin kurs kaydı varsa AKTİF, yoksa PASİF yapıyoruz
                  const calculatedStatus = studentEnrollments.length > 0 ? "AKTİF" : "PASİF";

                  // 2. Kurs ve Tarih bilgilerini hesapla
                  let displayCourse = "-";
                  let displayDate = "-";

                  if (studentEnrollments.length > 0) {
                    const courseNames = studentEnrollments.map(
                      (e) => e.courseTitle || e.CourseTitle || "Bilinmeyen Kurs",
                    );
                    displayCourse = courseNames.join(", ");

                    const validDates = studentEnrollments
                      .map((e) => e.enrollmentDate || e.EnrollmentDate || e.date || e.Date)
                      .filter(Boolean);

                    if (validDates.length > 0) {
                      const latestDateRaw = validDates[validDates.length - 1];
                      const dateObj = new Date(latestDateRaw as string);
                      displayDate = isNaN(dateObj.getTime())
                        ? (latestDateRaw as string)
                        : dateObj.toLocaleDateString("tr-TR");
                    }
                  }

                  // 3. Tabloya yazdırılacak nihai değişkenler (Aşağıdaki return içindeki HTML bu isimleri kullanıyor)
                  const course =
                    displayCourse !== "-" ? displayCourse : s.course || s.Course || "-";
                  const dateRaw = s.date || s.Date;
                  const date = dateRaw ? new Date(dateRaw).toLocaleDateString("tr-TR") : "-";

                  return (
                    <tr
                      key={s.id || s.Id || index}
                      className="hover:bg-foreground/2 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded bg-muted grid place-items-center text-[10px] font-mono text-muted-foreground shrink-0 uppercase">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold">{fullName}</div>
                            {/* Email değişkeni yerine doğrudan öğrenci numarasını çağırıyoruz */}
                            <div className="text-xs text-muted-foreground font-mono">
                              {s.studentNumber || s.StudentNumber || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* course değişkeni yerine email değişkenini çağırıyoruz */}
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
                      {/* YENİ EKLENECEK SÜTUN: Silme Butonu */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteStudent(s.id || s.Id)}
                          className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors border border-red-500/20 ml-auto"
                          title="Öğrenciyi Sil"
                        >
                          {/* Çöp kutusu ikonu (SVG) */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                          Sil
                        </button>
                      </td>
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Öğrenci Adı Soyadı</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Yağız Cengiz"
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
                  placeholder="Örn: yagiz@mail.com"
                />
              </div>

              {/* Kayıt Olacağı Kurs alanı kaldırıldı (isteğe bağlı olarak ileride eklenecek) */}

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
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="size-10 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Silme Onayı</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bu öğrenciyi silmek istediğinize emin misiniz?
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
    </> // Ana kapsayıcının kapanışı
  );
}
