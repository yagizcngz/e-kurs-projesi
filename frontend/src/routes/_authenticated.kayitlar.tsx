import { createFileRoute } from "@tanstack/react-router";
import { Plus, X, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/kayitlar")({
  head: () => ({
    meta: [
      { title: "Kayıt Yönetimi — E-Kurs" },
      { name: "description", content: "Öğrenci kayıtlarını görüntüle ve yönet." },
    ],
  }),
  component: EnrollmentsPage,
});

const API = "http://localhost:5157/api";

interface EnrollmentDto {
  id?: number;
  Id?: number;
  studentFullName?: string;
  StudentFullName?: string;
  studentNumber?: string;
  StudentNumber?: string;
  courseTitle?: string;
  CourseTitle?: string;
  enrollmentDate?: string;
  EnrollmentDate?: string;
}

interface StudentLite {
  id?: number;
  Id?: number;
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  studentNumber?: string;
  StudentNumber?: string;
}

interface CourseLite {
  id?: number;
  Id?: number;
  title?: string;
  Title?: string;
}

const pick = <T,>(...vals: (T | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null);

function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = () => {
    const token = localStorage.getItem("jwt_token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/enrollments`, {
        headers: authHeaders(),
      });

      if (res.ok) {
        setEnrollments(await res.json());
      }
    } catch (err) {
      console.error("Kayıtlar yüklenirken hata:", err);
    }
  }, []);

  const fetchStudentsAndCourses = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch(`${API}/students`, { headers: authHeaders() }),
        fetch(`${API}/courses`, { headers: authHeaders() }),
      ]);

      if (sRes.ok) {
        setStudents(await sRes.json());
      }

      if (cRes.ok) {
        setCourses(await cRes.json());
      }
    } catch (err) {
      console.error("Öğrenci/kurs listesi yüklenirken hata:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEnrollments(), fetchStudentsAndCourses()]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchEnrollments, fetchStudentsAndCourses]);

  const handleOpenModal = () => {
    setSelectedStudent("");
    setSelectedCourse("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEnroll = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !selectedCourse) {
      showToast("Lütfen öğrenci ve kurs seçin.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${API}/enrollments/student/${selectedStudent}/course/${selectedCourse}`,
        {
          method: "POST",
          headers: authHeaders(),
        },
      );

      if (res.ok) {
        showToast("Öğrenci kursa başarıyla kaydedildi!");
        handleCloseModal();
        fetchEnrollments();
      } else {
        let msg = "Kayıt başarısız. Zaten kayıtlı olabilir veya sunucu hatası oluştu.";

        try {
          const data = await res.json();
          msg = data.message || data.title || msg;
        } catch {
          const txt = await res.text();
          if (txt) msg = txt;
        }

        showToast(msg, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Sunucuya ulaşılamıyor.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEnrollment = (enrollmentId: number) => {
    setPendingDeleteId(enrollmentId);
    setIsConfirmOpen(true);
  };

  const confirmDeleteEnrollment = async () => {
    if (pendingDeleteId === null) return;

    setIsConfirmOpen(false);

    try {
      const res = await fetch(`${API}/enrollments/${pendingDeleteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.ok) {
        showToast("Kayıt başarıyla silindi.");
        fetchEnrollments();
      } else {
        let msg = "Kayıt silinemedi.";

        try {
          const data = await res.json();
          msg = data.error || data.message || msg;
        } catch {
          const txt = await res.text();
          if (txt) msg = txt;
        }

        showToast(msg, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Sunucuya ulaşılamıyor.", "error");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const cancelDeleteEnrollment = () => {
    setPendingDeleteId(null);
    setIsConfirmOpen(false);
  };

  const filteredEnrollments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return enrollments;

    return enrollments.filter((enrollment) => {
      const studentName = pick(enrollment.studentFullName, enrollment.StudentFullName) || "";

      const studentNumber = pick(enrollment.studentNumber, enrollment.StudentNumber) || "";

      const courseTitle = pick(enrollment.courseTitle, enrollment.CourseTitle) || "";

      return (
        studentName.toLowerCase().includes(query) ||
        studentNumber.toLowerCase().includes(query) ||
        courseTitle.toLowerCase().includes(query)
      );
    });
  }, [enrollments, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4 pt-6 px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kayıt Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Öğrenci kayıtlarını görüntüle, ekle ve sil.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Yeni Kayıt
        </button>
      </div>

      <div className="px-8">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Kayıt No</th>
                  <th className="px-6 py-3 font-medium">Öğrenci No</th>
                  <th className="px-6 py-3 font-medium">Öğrenci</th>
                  <th className="px-6 py-3 font-medium">Kurs</th>
                  <th className="px-6 py-3 font-medium">Kayıt Tarihi</th>
                  <th className="px-6 py-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Kayıtlar yükleniyor...
                    </td>
                  </tr>
                ) : filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Aramaya uygun kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((e) => {
                    const id = pick(e.id, e.Id);
                    const studentNumber = pick(e.studentNumber, e.StudentNumber) || "-";
                    const studentName = pick(e.studentFullName, e.StudentFullName) || "-";
                    const courseTitle = pick(e.courseTitle, e.CourseTitle) || "-";

                    const rawDate = pick(e.enrollmentDate, e.EnrollmentDate);
                    const dateText = rawDate ? new Date(rawDate).toLocaleDateString("tr-TR") : "-";

                    return (
                      <tr key={id} className="transition-colors hover:bg-muted/40">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          #{String(id).padStart(4, "0")}
                        </td>

                        <td className="px-6 py-4">{studentNumber}</td>

                        <td className="px-6 py-4 font-medium">{studentName}</td>

                        <td className="px-6 py-4">{courseTitle}</td>

                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {dateText}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (id) handleDeleteEnrollment(Number(id));
                            }}
                            className="inline-flex items-center gap-2 rounded-md border border-red-500 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/15"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Yeni Kayıt Oluştur</h2>

              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Öğrenci</label>

                <select
                  value={selectedStudent}
                  onChange={(ev) => setSelectedStudent(ev.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Öğrenci seçin...</option>

                  {students.map((s) => {
                    const id = pick(s.id, s.Id);
                    const firstName = pick(s.firstName, s.FirstName) || "";
                    const lastName = pick(s.lastName, s.LastName) || "";
                    const studentNumber = pick(s.studentNumber, s.StudentNumber) || "";

                    return (
                      <option key={id} value={id}>
                        {firstName} {lastName}
                        {studentNumber ? ` (${studentNumber})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Kurs</label>

                <select
                  value={selectedCourse}
                  onChange={(ev) => setSelectedCourse(ev.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Kurs seçin...</option>

                  {courses.map((c) => {
                    const id = pick(c.id, c.Id);
                    const title = pick(c.title, c.Title) || "İsimsiz Kurs";

                    return (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">Silme Onayı</h2>
                <p className="text-sm text-muted-foreground">
                  Bu kaydı silmek istediğinize emin misiniz?
                </p>
              </div>
            </div>

            <p className="mb-6 text-sm text-muted-foreground">
              Bu işlem geri alınamaz. Lütfen onaylayın veya iptal edin.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={confirmDeleteEnrollment}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
              >
                Evet
              </button>
              <button
                onClick={cancelDeleteEnrollment}
                className="px-4 py-2 text-sm font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                Hayır
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}

          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
