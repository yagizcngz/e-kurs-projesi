import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "../components/PageHeader";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/raporlar")({
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
  course?: string;
  Course?: string;
  date?: string;
  Date?: string;
  status?: string;
  Status?: string;
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

function ReportsPage() {
  const [dbStudents, setDbStudents] = useState<StudentData[]>([]);
  const [dbCourses, setDbCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Veritabanından verileri çek
  useEffect(() => {
    const fetchReportsData = async () => {
      const token = localStorage.getItem("jwt_token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [sRes, cRes] = await Promise.all([
          fetch("http://localhost:5157/api/students", { headers }),
          fetch("http://localhost:5157/api/courses", { headers }),
        ]);

        if (sRes.ok) setDbStudents(await sRes.json());
        if (cRes.ok) setDbCourses(await cRes.json());
      } catch (err) {
        console.error("Rapor verisi çekme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  // --- DİNAMİK METRİK HESAPLAMALARI ---

  // 1. Toplamlar
  const totalStudents = dbStudents.length;
  const activeCourses = dbCourses.length;

  // 2. Benzersiz Eğitmen Sayısı
  const uniqueInstructors = new Set(
    dbCourses.map((c) => c.instructor || c.Instructor || "Bilinmeyen"),
  ).size;

  // 3. Bu Ayki Yeni Kayıtlar
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newEnrollmentsThisMonth = dbStudents.filter((s) => {
    const d = new Date(s.date || s.Date || new Date());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // 4. Gelir Hesaplamaları
  let totalMonthlyRevenue = 0;
  dbCourses.forEach((c) => {
    const priceString = String(c.price || c.Price || "0");
    const numericPrice = Number(priceString.replace(/\D/g, "")) || 0;
    const studentCount = c.students || c.Students || 0;
    totalMonthlyRevenue += numericPrice * studentCount;
  });

  // Para birimi formatlayıcı (Örn: 1.600.000 -> ₺1.6M, 142.000 -> ₺142K)
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₺${(val / 1000).toFixed(1)}K`;
    return `₺${val}`;
  };

  const monthlyGelirFormatted = formatCurrency(totalMonthlyRevenue);
  const yillikCiroFormatted = formatCurrency(totalMonthlyRevenue * 12); // Projeksiyon

  // 5. Aylık Kayıt Trendi (Grafik Verisi)
  const monthCounts = new Array(12).fill(0);
  dbStudents.forEach((s) => {
    const d = new Date(s.date || s.Date || new Date());
    if (d.getFullYear() === currentYear) {
      monthCounts[d.getMonth()] += 1;
    }
  });

  // ÇÖZÜM: maxCount değişkenini burada tanımlıyoruz
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

  const dynamicMonthlyTrend = monthCounts.map((count, index) => ({
    m: monthNames[index],
    // v: Yüzdelik yükseklik (CSS height için)
    v: Math.round((count / maxCount) * 100),
    // raw: Gerçek kayıt sayısı (Görselde göstermek için)
    raw: count,
  }));

  return (
    <>
      <PageHeader crumb="/ raporlar / performans" />

      <div className="p-8 space-y-8 animate-reveal">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-border bg-card">
            <p className="text-xs font-mono text-muted-foreground uppercase mb-2">
              Yıllık Ciro (Projeksiyon)
            </p>
            <h3 className="text-3xl font-bold tracking-tight text-accent">
              {isLoading ? "..." : yillikCiroFormatted}
            </h3>
            <div className="mt-4 text-[10px] font-bold text-emerald-600">
              Aylık gelire göre hesaplandı
            </div>
          </div>

          {/* Tamamlama Oranı ve Ortalama Puan henüz veritabanında olmadığı için sabit bırakıldı */}
          <div className="p-6 border border-border bg-card opacity-80">
            <p className="text-xs font-mono text-muted-foreground uppercase mb-2">
              Tamamlama Oranı
            </p>
            <h3 className="text-3xl font-bold tracking-tight">74%</h3>
            <div className="mt-4 text-[10px] font-bold text-muted-foreground">Sistem tahmini</div>
          </div>
          <div className="p-6 border border-border bg-card opacity-80">
            <p className="text-xs font-mono text-muted-foreground uppercase mb-2">Ortalama Puan</p>
            <h3 className="text-3xl font-bold tracking-tight">4.7 / 5</h3>
            <div className="mt-4 text-[10px] font-bold text-emerald-600">Sistem tahmini</div>
          </div>
        </div>

        <section className="space-y-4">
          <SectionHeader
            title={`Aylık Kayıt Trendi (${currentYear})`}
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
                      style={{ height: `${d.v}%` }}
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

        <section className="space-y-4">
          <SectionHeader title="Genel Metrikler" />
          <div className="bg-card border border-border divide-y divide-border">
            {[
              { k: "Toplam Öğrenci", v: isLoading ? "..." : totalStudents },
              { k: "Aktif Kurslar", v: isLoading ? "..." : activeCourses },
              { k: "Bu Ayki Yeni Kayıtlar", v: isLoading ? "..." : newEnrollmentsThisMonth },
              { k: "Aylık Gelir", v: isLoading ? "..." : monthlyGelirFormatted },
              { k: "Aktif Eğitmen Sayısı", v: isLoading ? "..." : uniqueInstructors },
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between px-6 py-4 text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="text-muted-foreground">{row.k}</span>
                <span className="font-mono font-bold">{row.v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
