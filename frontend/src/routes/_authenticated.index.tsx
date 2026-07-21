import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "../components/PageHeader";
import { useState, useEffect } from "react";
import { statusStyles } from "../lib/mock-data";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
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

interface CourseData {
  id?: string | number;
  Id?: string | number;
  title?: string;
  Title?: string;
  category?: string;
  Category?: string;
  price?: string | number;
  Price?: string | number;
  instructor?: string;
  Instructor?: string;
  students?: number;
  Students?: number;
  image?: string;
  Image?: string;
  thumbnail?: string;
}

const getCourseImage = (c: CourseData, index: number) => {
  const explicit = c.image || c.Image || c.thumbnail;
  if (explicit) return explicit;

  const titleRaw = (c.title || c.Title || "").toString();
  const categoryRaw = (c.category || c.Category || "").toString();
  const titleLower = (titleRaw + " " + categoryRaw).toLowerCase();

  const mappingSeeds: { keywords: string[]; seed: string }[] = [
    { keywords: ["matematik", "mat"], seed: "mathematics" },
    { keywords: ["fizik"], seed: "physics" },
    { keywords: ["kimya"], seed: "chemistry" },
    { keywords: ["biyoloji", "molekul", "biyo"], seed: "biology" },
    { keywords: ["react", "frontend", "javascript", "typescript"], seed: "programming" },
    { keywords: ["c#", "csharp", "dotnet", "backend"], seed: "code" },
    { keywords: ["tarih"], seed: "history" },
    { keywords: ["sanat", "tasar", "tasarım"], seed: "art" },
    { keywords: ["ekonomi"], seed: "economics" },
    { keywords: ["psikoloji"], seed: "psychology" },
    { keywords: ["spor", "yoga"], seed: "fitness" },
  ];

  for (const m of mappingSeeds) {
    for (const kw of m.keywords) {
      if (titleLower.includes(kw)) {
        return `https://picsum.photos/seed/${encodeURIComponent(m.seed)}/800/450`;
      }
    }
  }

  const fallbackPool = [
    "education",
    "books",
    "city",
    "nature",
    "technology",
    "abstract",
    "coffee",
    "architecture",
    "ocean",
    "mountains",
  ];

  const titleSeed = titleRaw.trim()
    ? titleRaw.trim().slice(0, 40)
    : fallbackPool[index % fallbackPool.length];
  const seed = encodeURIComponent(titleSeed.replace(/\s+/g, "-").toLowerCase());
  return `https://picsum.photos/seed/${seed}/800/450`;
};

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

interface KpiCardProps {
  label: string;
  value: string | number;
  hint: string;
  hintTone?: "muted" | "up" | "accent" | "warn";
}

function KpiCard({ label, value, hint, hintTone = "muted" }: KpiCardProps) {
  const toneClass =
    hintTone === "up"
      ? "text-emerald-600"
      : hintTone === "accent"
        ? "text-accent"
        : hintTone === "warn"
          ? "text-amber-600"
          : "text-muted-foreground";
  return (
    <div className="p-6 border border-border bg-card">
      <p className="text-xs font-mono text-muted-foreground uppercase mb-2">{label}</p>
      <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      <div className={`mt-4 text-[10px] font-bold ${toneClass}`}>{hint}</div>
    </div>
  );
}

function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dbStudents, setDbStudents] = useState<StudentData[]>([]);
  const [dbCourses, setDbCourses] = useState<CourseData[]>([]);
  const [dbEnrollments, setDbEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAllPopular, setShowAllPopular] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("jwt_token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [sRes, cRes, eRes] = await Promise.all([
          fetch("http://localhost:5157/api/students", { headers }),
          fetch("http://localhost:5157/api/courses", { headers }),
          fetch("http://localhost:5157/api/enrollments", { headers }),
        ]);

        if (sRes.ok) setDbStudents(await sRes.json());
        if (cRes.ok) setDbCourses(await cRes.json());
        if (eRes && eRes.ok) setDbEnrollments(await eRes.json());
      } catch (err) {
        console.error("Veri çekme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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

  const filteredCourses = dbCourses.filter((c) => {
    const fTitle = c.title || c.Title || "";
    const fInstructor = c.instructor || c.Instructor || "";
    return (
      fTitle.toLowerCase().includes(searchLower) || fInstructor.toLowerCase().includes(searchLower)
    );
  });

  const sortedPopularCourses = [...filteredCourses].sort((a, b) => {
    const studentsA = a.students || a.Students || 0;
    const studentsB = b.students || b.Students || 0;
    return studentsB - studentsA;
  });

  const displayedPopularCourses = sortedPopularCourses.slice(0, showAllPopular ? 10 : 3);

  // --- DİNAMİK KPI (BÜYÜME) HESAPLAMALARI ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Geçen ayın tarihini hesapla
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear -= 1;
  }

  // 30 ve 60 gün öncesinin sınırları
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // 1. TOPLAM ÖĞRENCİ BÜYÜMESİ (Geçen aya göre % artış)
  let studentsThisMonth = 0;
  let studentsBeforeThisMonth = 0;
  dbStudents.forEach((s) => {
    const dRaw = s.date || s.Date;
    const d = dRaw ? new Date(dRaw) : new Date();
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      studentsThisMonth++;
    } else if (d < new Date(currentYear, currentMonth, 1)) {
      studentsBeforeThisMonth++;
    }
  });
  // Eğer geçmişte hiç öğrenci yoksa büyüme %100'dür (ilk ay), aksi halde orantı kurulur.
  const studentGrowth =
    studentsBeforeThisMonth === 0
      ? studentsThisMonth > 0
        ? 100
        : 0
      : (studentsThisMonth / studentsBeforeThisMonth) * 100;

  // 2. YENİ KAYITLAR (Son 30 Gün vs Önceki 30 Gün ivmesi)
  let enrollmentsLast30 = 0;
  let enrollmentsPrev30 = 0;
  dbEnrollments.forEach((e) => {
    const dRaw = e.enrollmentDate || e.EnrollmentDate || e.date || e.Date;
    const d = dRaw ? new Date(dRaw) : new Date();
    if (d >= thirtyDaysAgo) {
      enrollmentsLast30++;
    } else if (d >= sixtyDaysAgo && d < thirtyDaysAgo) {
      enrollmentsPrev30++;
    }
  });
  const enrollmentGrowth =
    enrollmentsPrev30 === 0
      ? enrollmentsLast30 > 0
        ? 100
        : 0
      : ((enrollmentsLast30 - enrollmentsPrev30) / enrollmentsPrev30) * 100;

  // 3. AYLIK GELİR VE GELİR BÜYÜMESİ (Sadece aktif aya ait gelirler)
  let revThisMonth = 0;
  let revLastMonth = 0;
  dbEnrollments.forEach((e) => {
    const dRaw = e.enrollmentDate || e.EnrollmentDate || e.date || e.Date;
    const d = dRaw ? new Date(dRaw) : new Date();
    const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    const isLastMonth = d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;

    if (isThisMonth || isLastMonth) {
      const enrolledCourseTitle = e.courseTitle || e.CourseTitle || "";
      const matchedCourse = dbCourses.find((c) => {
        const courseTitle = c.title || c.Title || "";
        return courseTitle.toLowerCase().trim() === enrolledCourseTitle.toLowerCase().trim();
      });

      if (matchedCourse) {
        const priceString = String(matchedCourse.price || matchedCourse.Price || "0");
        const numericPrice = parseFloat(priceString.replace(/[^\d.]/g, "")) || 0;
        if (isThisMonth) revThisMonth += numericPrice;
        if (isLastMonth) revLastMonth += numericPrice;
      }
    }
  });

  // Gelirlerin Admin Komisyonu (%10)
  const adminRevThisMonth = revThisMonth * 0.1;
  const adminRevLastMonth = revLastMonth * 0.1;
  const revenueGrowth =
    adminRevLastMonth === 0
      ? adminRevThisMonth > 0
        ? 100
        : 0
      : ((adminRevThisMonth - adminRevLastMonth) / adminRevLastMonth) * 100;

  // Parayı düzgün formatlama
  const formatMoney = (val: number) => {
    if (val >= 1000) return `₺${(val / 1000).toFixed(1)}K`;
    return `₺${val.toFixed(0)}`;
  };
  const dynamicRevenue = formatMoney(adminRevThisMonth);

  return (
    <>
      <PageHeader
        crumb="/ kontrol paneli "
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="p-8 space-y-8 animate-reveal">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard
            label="Toplam Öğrenci"
            value={dbStudents.length}
            hint={`${studentGrowth > 0 ? "+" : ""}${studentGrowth.toFixed(1)}% geçen aya göre`}
            hintTone={studentGrowth >= 0 ? "up" : "warn"}
          />
          <KpiCard
            label="Aktif Kurslar"
            value={dbCourses.length}
            hint="Yeni kurslar eklendi"
            hintTone="accent"
          />
          <KpiCard
            label="Yeni Kayıtlar"
            // Gerçekten son 30 gün içindeki kayıt sayısını ekrana basıyoruz
            value={enrollmentsLast30}
            hint={`${enrollmentGrowth > 0 ? "+" : ""}${enrollmentGrowth.toFixed(1)}% önceki 30 güne göre`}
            hintTone={enrollmentGrowth >= 0 ? "up" : "warn"}
          />
          <KpiCard
            label="Aylık Gelir"
            value={dynamicRevenue}
            // Geçen ayın ciro verisine oranla ne durumda olduğunu basıyoruz
            hint={`${revenueGrowth > 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% geçen aya göre`}
            hintTone={revenueGrowth >= 0 ? "up" : "warn"}
          />
        </div>

        <section className="space-y-4">
          <SectionHeader title="Son Eklenen Öğrenciler" />
          <div className="bg-card border border-border overflow-x-auto rounded-md shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/2 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                    Öğrenci Bilgisi
                  </th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                    Kayıtlı Kurs
                  </th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground text-right">
                    Durum
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
                      Veriler Yükleniyor...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-muted-foreground text-xs"
                    >
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredStudents
                    .slice(-5)
                    .reverse()
                    .map((s: StudentData, index) => {
                      const studentId = s.id || s.Id;
                      const fullName =
                        s.name ||
                        `${s.firstName || s.FirstName || ""} ${s.lastName || s.LastName || ""}`.trim() ||
                        "İsimsiz Öğrenci";
                      const email = s.email || s.Email || "-";
                      const initials = s.initials || fullName.slice(0, 2).toUpperCase();

                      // Back-end EnrollmentDto contains StudentFullName / StudentNumber / CourseTitle
                      const studentFullName = fullName.trim().toLowerCase();
                      const rawStudentNumber = s.studentNumber || s.StudentNumber || "";
                      const studentNumber = String(rawStudentNumber).toLowerCase();

                      const studentEnrollments = dbEnrollments.filter((e) => {
                        const rawEnrName = e.studentFullName || e.StudentFullName || "";
                        const enrName = String(rawEnrName).toLowerCase();
                        const rawEnrNumber = e.studentNumber || e.StudentNumber || "";
                        const enrNumber = String(rawEnrNumber).toLowerCase();
                        // match by full name or student number when available
                        return (
                          (enrName && studentFullName && enrName.includes(studentFullName)) ||
                          (enrNumber && studentNumber && enrNumber === studentNumber)
                        );
                      });
                      // YENİ EKLENEN KISIM: Eğer öğrencinin kurs kaydı varsa AKTİF, yoksa PASİF yapıyoruz
                      const calculatedStatus = studentEnrollments.length > 0 ? "AKTİF" : "PASİF";

                      let displayCourse = "-";
                      let displayDate = "-";

                      if (studentEnrollments.length > 0) {
                        const courseNames = studentEnrollments.map((e) => {
                          return e.courseTitle || e.CourseTitle || "Bilinmeyen Kurs";
                        });
                        displayCourse = courseNames.join(", ");

                        // Öğrencinin kayıtlarından tarih verilerini al
                        const validDates = studentEnrollments
                          .map((e) => e.enrollmentDate || e.EnrollmentDate || e.date || e.Date)
                          .filter(Boolean); // undefined veya boş olanları filtrele

                        if (validDates.length > 0) {
                          // Öğrencinin birden fazla kursu varsa en son kayıt tarihini göster
                          const latestDateRaw = validDates[validDates.length - 1];

                          // Eğer tarih "01.01.1" gibi geçersiz/default bir formattaysa olduğu gibi bırakabilir
                          // veya Date objesine çevirerek formatlayabilirsiniz.
                          const dateObj = new Date(latestDateRaw as string);
                          displayDate = isNaN(dateObj.getTime())
                            ? (latestDateRaw as string)
                            : dateObj.toLocaleDateString("tr-TR");
                        }
                      }

                      // Eğer hiçbir kayıt eşleşmezse öğrenci tablosundaki varsayılanları dene
                      const course =
                        displayCourse !== "-" ? displayCourse : s.course || s.Course || "-";
                      const dateRaw = s.date || s.Date;
                      const date =
                        displayDate !== "-"
                          ? displayDate
                          : dateRaw
                            ? new Date(dateRaw).toLocaleDateString("tr-TR")
                            : "-";

                      return (
                        <tr
                          key={String(studentId) || index}
                          className="hover:bg-foreground/2 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded bg-muted grid place-items-center text-[10px] font-mono text-muted-foreground shrink-0 uppercase">
                                {initials}
                              </div>
                              <div>
                                <div className="font-semibold">{fullName}</div>
                                <div className="text-xs text-muted-foreground">{email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{course}</td>
                          <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
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
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </section>

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
            {displayedPopularCourses.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground text-xs border border-border bg-card">
                Kurs bulunamadı.
              </div>
            ) : (
              displayedPopularCourses.map((c: CourseData, index) => {
                const title = c.title || c.Title || "İsimsiz Kurs";
                const category = c.category || c.Category || "GENEL";
                const price = c.price || c.Price || "₺0";
                const instructor = c.instructor || c.Instructor || "Bilinmiyor";
                const studentsCount = c.students || c.Students || 0;

                return (
                  <div
                    key={c.id || c.Id || index}
                    className="group bg-card border border-border hover:border-accent transition-colors rounded-md overflow-hidden shadow-sm"
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
    </>
  );
}
