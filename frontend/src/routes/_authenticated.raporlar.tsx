import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "../components/PageHeader";
import { useState, useEffect } from "react";
import { useAdminGuard } from "../hooks/useAdminGuard";

export const Route = createFileRoute("/_authenticated/raporlar")({
  head: () => ({
    meta: [
      { title: "Raporlar — E-Kurs" },
      { name: "description", content: "Platformun performans ve gelir raporları." },
    ],
  }),
  component: ReportsPage,
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
}

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

interface KpiCardProps {
  label: string;
  value: string | number;
  hint: string;
  hintTone?: "muted" | "up" | "accent" | "warn";
  valueTone?: "default" | "accent";
}

function KpiCard({ label, value, hint, hintTone = "muted", valueTone = "default" }: KpiCardProps) {
  const toneClass =
    hintTone === "up"
      ? "text-emerald-600"
      : hintTone === "accent"
        ? "text-accent"
        : hintTone === "warn"
          ? "text-amber-600"
          : "text-muted-foreground";
  const valueClass =
    valueTone === "accent"
      ? "text-3xl font-bold tracking-tight text-accent"
      : "text-3xl font-bold tracking-tight";
  return (
    <div className="p-6 border border-border bg-card">
      <p className="text-xs font-mono text-muted-foreground uppercase mb-2">{label}</p>
      <h3 className={valueClass}>{value}</h3>
      <div className={`mt-4 text-[10px] font-bold ${toneClass}`}>{hint}</div>
    </div>
  );
}

function ReportsPage() {
  useAdminGuard();
  const [dbStudents, setDbStudents] = useState<StudentData[]>([]);
  const [dbCourses, setDbCourses] = useState<CourseData[]>([]);
  const [dbEnrollments, setDbEnrollments] = useState<EnrollmentData[]>([]);
  const [dbTeachers, setDbTeachers] = useState<TeacherData[]>([]);
  const [deletedStudents, setDeletedStudents] = useState<StudentData[]>([]);
  const [deletedCourses, setDeletedCourses] = useState<CourseData[]>([]);
  const [deletedTeachers, setDeletedTeachers] = useState<TeacherData[]>([]);
  const [deletedEnrollments, setDeletedEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Veritabanından verileri çek
  useEffect(() => {
    const fetchReportsData = async () => {
      const token = localStorage.getItem("jwt_token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [sRes, cRes, eRes, tRes, dsRes, dcRes, dtRes, deRes] = await Promise.all([
          fetch("http://localhost:5157/api/students", { headers }),
          fetch("http://localhost:5157/api/courses", { headers }),
          fetch("http://localhost:5157/api/enrollments", { headers }),
          fetch("http://localhost:5157/api/teachers", { headers }),
          fetch("http://localhost:5157/api/students/deleted", { headers }),
          fetch("http://localhost:5157/api/courses/deleted", { headers }),
          fetch("http://localhost:5157/api/teachers/deleted", { headers }),
          fetch("http://localhost:5157/api/enrollments/deleted", { headers }),
        ]);

        if (sRes.ok) setDbStudents(await sRes.json());
        if (cRes.ok) setDbCourses(await cRes.json());
        if (eRes.ok) setDbEnrollments(await eRes.json());
        if (tRes.ok) setDbTeachers(await tRes.json());
        if (dsRes.ok) setDeletedStudents(await dsRes.json());
        if (dcRes.ok) setDeletedCourses(await dcRes.json());
        if (dtRes.ok) setDeletedTeachers(await dtRes.json());
        if (deRes.ok) setDeletedEnrollments(await deRes.json());
      } catch (err) {
        console.error("Rapor verisi çekme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  // --- DİNAMİK KPI (BÜYÜME) HESAPLAMALARI ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // 1. Toplam Öğrenci Büyümesi (geçen aya göre % artış)
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
  const studentGrowth =
    studentsBeforeThisMonth === 0
      ? studentsThisMonth > 0
        ? 100
        : 0
      : (studentsThisMonth / studentsBeforeThisMonth) * 100;

  // 2. Yeni Kayıtlar (son 30 gün vs önceki 30 gün ivmesi)
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

  // 3. Aylık Gelir (sistemdeki tüm aktif kayıtlar, kursun güncel fiyatı üzerinden) + Yıllık Ciro projeksiyonunun temeli
  const startOfThisMonth = new Date(currentYear, currentMonth, 1);

  let revTotalNow = 0;
  let revTotalAsOfLastMonth = 0;

  dbEnrollments.forEach((e) => {
    const enrolledCourseTitle = e.courseTitle || e.CourseTitle || "";
    const matchedCourse = dbCourses.find((c) => {
      const courseTitle = c.title || c.Title || "";
      return courseTitle.toLowerCase().trim() === enrolledCourseTitle.toLowerCase().trim();
    });

    if (!matchedCourse) return;

    const priceString = String(matchedCourse.price || matchedCourse.Price || "0");
    const numericPrice = parseFloat(priceString.replace(/[^\d.]/g, "")) || 0;

    revTotalNow += numericPrice;

    const dRaw = e.enrollmentDate || e.EnrollmentDate || e.date || e.Date;
    const d = dRaw ? new Date(dRaw) : new Date();
    if (d < startOfThisMonth) {
      revTotalAsOfLastMonth += numericPrice;
    }
  });

  // Gelirlerin Admin Komisyonu (%10)
  const adminRevThisMonth = revTotalNow * 0.1;
  const adminRevLastMonth = revTotalAsOfLastMonth * 0.1;
  const revenueGrowth =
    adminRevLastMonth === 0
      ? adminRevThisMonth > 0
        ? 100
        : 0
      : ((adminRevThisMonth - adminRevLastMonth) / adminRevLastMonth) * 100;

  const formatMoney = (val: number) => {
    if (val >= 1000) return `₺${(val / 1000).toFixed(1)}K`;
    return `₺${val.toFixed(0)}`;
  };
  const dynamicRevenue = formatMoney(adminRevThisMonth);

  // --- DİĞER METRİK HESAPLAMALARI ---

  // Toplamlar
  const totalStudents = dbStudents.length;
  const activeCourses = dbCourses.length;
  const totalTeachers = dbTeachers.length;

  // Silinenler (soft-delete edilmiş kayıtlar)
  const totalDeletedStudents = deletedStudents.length;
  const totalDeletedCourses = deletedCourses.length;
  const totalDeletedTeachers = deletedTeachers.length;
  const totalDeletedEnrollments = deletedEnrollments.length;

  // Yıllık Gelir (Projeksiyon): Aylık Gelir'in (komisyon dahil) 12 katı — iki kart aynı mantığı kullansın diye
  // önceden burada "revTotalNow * 12" vardı (komisyonsuz tam kurs fiyatı), Aylık Gelir ise %10 komisyon
  // kullanıyordu; bu da iki rakamın birbiriyle tutarsız görünmesine yol açıyordu.
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₺${(val / 1000).toFixed(1)}K`;
    return `₺${val}`;
  };
  const yillikCiroFormatted = formatCurrency(adminRevThisMonth * 12);

  // Aylık Kayıt Trendi (Grafik Verisi) — takvim yılına (örn. sabit "2026") bağlı kalmayan,
  // bugünden geriye doğru son 12 ayı kapsayan kayan pencere. Eskiden "d.getFullYear() === currentYear"
  // filtresi vardı; kayıt tarihleri farklı bir yıla denk gelince grafik tamamen boş görünüyordu.
  const trendMonths = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(currentYear, currentMonth - 11 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthCounts = trendMonths.map(
    ({ year, month }) =>
      dbEnrollments.filter((e) => {
        const dRaw = e.enrollmentDate || e.EnrollmentDate || e.date || e.Date;
        if (!dRaw) return false;
        const d = new Date(dRaw);
        return !isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month;
      }).length,
  );

  const maxCount = Math.max(...monthCounts, 1);

  const monthNames = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];

  const dynamicMonthlyTrend = trendMonths.map(({ year, month }, index) => ({
    // Farklı bir yıla denk gelen aylarda karışıklık olmasın diye kısa yıl ekleniyor (örn. "Oca '25")
    m: monthNames[month] + (year !== currentYear ? ` '${String(year).slice(2)}` : ""),
    v: Math.round((monthCounts[index] / maxCount) * 100),
    raw: monthCounts[index],
  }));

  return (
    <>
      <PageHeader crumb="/ raporlar / performans" />

      <div className="p-8 space-y-8 animate-reveal">
        {/* Son Eklenen Öğrenciler — en üstte */}
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
                ) : dbStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-muted-foreground text-xs"
                    >
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  dbStudents
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

                      let displayCourse = "-";
                      let displayDate = "-";

                      if (studentEnrollments.length > 0) {
                        const courseNames = studentEnrollments.map((e) => {
                          return e.courseTitle || e.CourseTitle || "Bilinmeyen Kurs";
                        });
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

        {/* KPI kartları — üst sıra: toplamlar, alt sıra: aynı sütunda ilgili "silinen" kartı */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard
            label="Toplam Öğrenci"
            value={isLoading ? "..." : totalStudents}
            hint={`${studentGrowth > 0 ? "+" : ""}${studentGrowth.toFixed(1)}% geçen aya göre`}
            hintTone={studentGrowth >= 0 ? "up" : "warn"}
          />
          <KpiCard
            label="Toplam Öğretmen"
            value={isLoading ? "..." : totalTeachers}
            hint="Kurslardaki tekil eğitmen sayısı"
            hintTone="accent"
          />
          <KpiCard
            label="Aktif Kurslar"
            value={isLoading ? "..." : activeCourses}
            hint="Yeni kurslar eklendi"
            hintTone="accent"
          />
          <KpiCard
            label="Yeni Kayıtlar"
            value={isLoading ? "..." : enrollmentsLast30}
            hint={`${enrollmentGrowth > 0 ? "+" : ""}${enrollmentGrowth.toFixed(1)}% önceki 30 güne göre`}
            hintTone={enrollmentGrowth >= 0 ? "up" : "warn"}
          />
          <KpiCard
            label="Silinen Öğrenciler"
            value={isLoading ? "..." : totalDeletedStudents}
            hint="Soft-delete ile işaretlenmiş öğrenciler"
            hintTone="muted"
          />
          <KpiCard
            label="Silinen Öğretmenler"
            value={isLoading ? "..." : totalDeletedTeachers}
            hint="Soft-delete ile işaretlenmiş öğretmenler"
            hintTone="muted"
          />
          <KpiCard
            label="Silinen Kurslar"
            value={isLoading ? "..." : totalDeletedCourses}
            hint="Soft-delete ile işaretlenmiş kurslar"
            hintTone="muted"
          />
          <KpiCard
            label="Silinen Kayıtlar"
            value={isLoading ? "..." : totalDeletedEnrollments}
            hint="Soft-delete ile işaretlenmiş kayıtlar"
            hintTone="muted"
          />
        </div>

        {/* Aylık Gelir ve Yıllık Gelir (Projeksiyon) — yan yana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KpiCard
            label="Aylık Gelir"
            value={isLoading ? "..." : dynamicRevenue}
            hint={`${revenueGrowth > 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% geçen aya göre`}
            hintTone={revenueGrowth >= 0 ? "up" : "warn"}
            valueTone="accent"
          />
          <KpiCard
            label="Yıllık Gelir (Projeksiyon)"
            value={isLoading ? "..." : yillikCiroFormatted}
            hint="Aktif kayıtların güncel kurs fiyatına göre yıllık projeksiyonu"
            hintTone="up"
            valueTone="accent"
          />
        </div>

        <section className="space-y-4">
          <SectionHeader
            title="Aylık Kayıt Trendi (Son 12 Ay)"
            right={
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                BİRİM: GERÇEK KAYIT ADEDİ
              </span>
            }
          />
          <div className="bg-card border border-border p-6 relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center font-mono text-xs font-bold animate-pulse">
                GRAFİK YÜKLENİYOR...
              </div>
            )}
            <div className="flex items-end gap-2 h-64">
              {dynamicMonthlyTrend.map((d) => (
                <div key={d.m} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end h-full relative">
                    {/* Hover durumunda gerçek rakamı gösteren Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {d.raw} Kayıt
                    </div>
                    <div
                      className="w-full bg-accent/80 hover:bg-accent transition-all duration-500 rounded-t-sm"
                      style={{ height: `${(d.v / 100) * 200}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {d.m}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
