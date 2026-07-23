import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "../components/PageHeader";
import { useState, useEffect } from "react";
import { CourseDetailModal } from "../components/CourseDetailModal";
import {
  getCourseImage,
  getCourseEnrollments,
  type CourseData,
  type TeacherLiteDto,
} from "../components/courseHelpers";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Ana Sayfa — E-Kurs" },
      { name: "description", content: "Popüler kurslar ve platform özeti." },
    ],
  }),
  component: HomePage,
});

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

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
  studentNumber?: string;
  StudentNumber?: string;
  course?: string;
  Course?: string;
  date?: string;
  Date?: string;
  status?: string;
  Status?: string;
  initials?: string;
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

function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dbStudents, setDbStudents] = useState<StudentData[]>([]);
  const [dbTeachers, setDbTeachers] = useState<TeacherLiteDto[]>([]);
  const [dbCourses, setDbCourses] = useState<CourseData[]>([]);
  const [dbEnrollments, setDbEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAllPopular, setShowAllPopular] = useState(false);

  // Kurs tanıtım/düzenleme modalı için (Kurslar sayfasındakiyle aynı bileşen)
  const [currentUser, setCurrentUser] = useState({ name: "Bilinmiyor", role: "Öğrenci" });
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");

    const fetchHomeData = async () => {
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [sRes, cRes, eRes, tRes] = await Promise.all([
          fetch("http://localhost:5157/api/students", { headers }),
          fetch("http://localhost:5157/api/courses", { headers }),
          fetch("http://localhost:5157/api/enrollments", { headers }),
          fetch("http://localhost:5157/api/teachers", { headers }),
        ]);
        if (sRes.ok) setDbStudents(await sRes.json());
        if (cRes.ok) setDbCourses(await cRes.json());
        if (eRes.ok) setDbEnrollments(await eRes.json());
        if (tRes.ok) setDbTeachers(await tRes.json());
      } catch (err) {
        console.error("Veri çekme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();

    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        const name =
          payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
          payload.name ||
          payload.unique_name ||
          "Bilinmeyen Eğitmen";
        const role =
          payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
          payload.role ||
          "Öğrenci";
        setCurrentUser({ name, role });
      }
    }
  }, []);

  const canManage =
    currentUser.role === "Eğitmen" ||
    currentUser.role === "Admin" ||
    currentUser.role === "superadmin";

  const handleCourseSaved = (updated: CourseData) => {
    setSelectedCourse(updated);
    setDbCourses((prev) =>
      prev.map((c) => ((c.id ?? c.Id) === (updated.id ?? updated.Id) ? { ...c, ...updated } : c)),
    );
  };

  const searchLower = searchTerm.toLowerCase();

  const filteredCourses = dbCourses.filter((c) => {
    const fTitle = c.title || c.Title || "";
    const fInstructor = c.instructor || c.Instructor || "";
    return (
      fTitle.toLowerCase().includes(searchLower) || fInstructor.toLowerCase().includes(searchLower)
    );
  });

  const sortedPopularCourses = [...filteredCourses].sort((a, b) => {
    const studentsA = getCourseEnrollments(a, dbEnrollments).length;
    const studentsB = getCourseEnrollments(b, dbEnrollments).length;
    return studentsB - studentsA;
  });

  const displayedPopularCourses = sortedPopularCourses.slice(0, showAllPopular ? 10 : 3);

  return (
    <>
      <PageHeader crumb="/ ana sayfa" searchValue={searchTerm} onSearchChange={setSearchTerm} />

      <div className="p-8 space-y-8 animate-reveal">
        <section className="space-y-4">
          <SectionHeader
            title="Popüler Kurslar"
            right={
              <button
                onClick={() => setShowAllPopular(!showAllPopular)}
                className="text-xs font-mono text-accent hover:underline transition-all"
              >
                {showAllPopular ? "DAHA AZ GÖSTER" : "DAHA FAZLA GÖSTER"}
              </button>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-8 text-center text-muted-foreground text-xs border border-border bg-card animate-pulse">
                Kurslar yükleniyor...
              </div>
            ) : displayedPopularCourses.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground text-xs border border-border bg-card">
                Kurs bulunamadı.
              </div>
            ) : (
              displayedPopularCourses.map((c: CourseData, index) => {
                const title = c.title || c.Title || "İsimsiz Kurs";
                const category = c.category || c.Category || "GENEL";
                const price = c.price || c.Price || "₺0";
                const instructor = c.instructor || c.Instructor || "Bilinmiyor";
                const studentsCount = getCourseEnrollments(c, dbEnrollments).length;

                return (
                  <div
                    key={c.id || c.Id || index}
                    onClick={() => setSelectedCourse(c)}
                    title="Kurs detaylarını görüntüle"
                    className="group bg-card border border-border hover:border-accent transition-colors rounded-md overflow-hidden shadow-sm cursor-pointer"
                  >
                    <div className="w-full aspect-video relative overflow-hidden bg-muted">
                      <img
                        src={getCourseImage(c, index)}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.06) 100%)",
                        }}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-mono text-accent uppercase">
                          {category}
                        </span>
                        <span className="text-sm font-bold">{price}</span>
                      </div>
                      <h4 className="font-bold mb-4 line-clamp-1">{title}</h4>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Eğitmen: {instructor}</span>
                        <span className="font-mono">{studentsCount} Öğrenci</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          canManage={canManage}
          enrollments={dbEnrollments}
          teachers={dbTeachers}
          onSaved={handleCourseSaved}
        />
      )}
    </>
  );
}
