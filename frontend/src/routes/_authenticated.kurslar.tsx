import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Plus, X, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/kurslar")({
  component: CoursesPage,
});

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
  maxCapacity?: string | number;
  MaxCapacity?: string | number;
  image?: string;
  Image?: string;
  thumbnail?: string;
}

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

const guessCategory = (title: string) => {
  if (!title) return "Kategori Bekleniyor...";
  const t = title.toLowerCase();
  if (
    t.includes("felsefe") ||
    t.includes("tarih") ||
    t.includes("psikoloji") ||
    t.includes("coğrafya")
  )
    return "Sosyal Bilimler";
  if (
    t.includes("matematik") ||
    t.includes("fizik") ||
    t.includes("kimya") ||
    t.includes("biyoloji")
  )
    return "Fen Bilimleri";
  if (
    t.includes("c#") ||
    t.includes("react") ||
    t.includes("python") ||
    t.includes("yazılım") ||
    t.includes("web")
  )
    return "Yazılım";
  if (t.includes("ingilizce") || t.includes("dil") || t.includes("almanca")) return "Yabancı Dil";
  if (t.includes("tasarım") || t.includes("ui") || t.includes("ux") || t.includes("photoshop"))
    return "Tasarım";
  return "Genel";
};

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

function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dbCourses, setDbCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState({ name: "Bilinmiyor", role: "Öğrenci" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // ÇOKLU SEÇİM VE DÜZENLEME MODU STATE'LERİ
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<(string | number)[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5157/api/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbCourses(data);
      }
    } catch (error) {
      console.error("Kurslar yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();

    const token = localStorage.getItem("jwt_token");
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

  const handleCloseModal = () => {
    setNewTitle("");
    setNewCapacity("");
    setNewPrice("");
    setIsModalOpen(false);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    const autoCategory = guessCategory(newTitle);
    const instructorName = currentUser.name;

    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5157/api/courses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Title: newTitle,
          Category: autoCategory,
          Instructor: instructorName,
          MaxCapacity: Number(newCapacity) || 0,
          Price: Number(newPrice) || 0,
        }),
      });

      if (response.ok) {
        showToast("Kurs başarıyla oluşturuldu!");
        handleCloseModal();
        fetchCourses();
      } else {
        const errorData = await response.text();
        console.error("Backend'den dönen hata:", errorData);
        showToast("Kayıt başarısız! Formu kontrol edin.", "error");
      }
    } catch (error) {
      showToast("Sunucuya ulaşılamıyor.", "error");
    }
  };

  // YENİ: DÜZENLEME MODU VE SEÇİM FONKSİYONLARI
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedCourseIds([]);
  };

  const handleSelectCourse = (id: string | number | undefined) => {
    if (!id) return;
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((courseId) => courseId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedCourseIds.length === filteredCourses.length && filteredCourses.length > 0) {
      // Tümü seçiliyse temizle
      setSelectedCourseIds([]);
    } else {
      // Tümünü seç
      const allFilteredIds = filteredCourses
        .map((c) => c.id ?? c.Id)
        .filter((id): id is string | number => id !== undefined);
      setSelectedCourseIds(allFilteredIds);
    }
  };

  // TOPLU SİLME ONAY İŞLEMİ
  const handleConfirmBulkDelete = async () => {
    if (selectedCourseIds.length === 0) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await Promise.all(
        selectedCourseIds.map((id) =>
          fetch(`http://localhost:5157/api/courses/${id}`, {
            method: "DELETE",
            headers,
          }),
        ),
      );

      showToast(`${selectedCourseIds.length} kurs başarıyla silindi!`);
      setIsConfirmOpen(false);
      setSelectedCourseIds([]);
      setIsEditMode(false);
      fetchCourses();
    } catch (error) {
      console.error("Silme hatası:", error);
      showToast("Kurslar silinirken bir hata oluştu.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const canManage =
    currentUser.role === "Eğitmen" ||
    currentUser.role === "Admin" ||
    currentUser.role === "superadmin";

  const searchLower = searchTerm.toLowerCase();
  const filteredCourses = dbCourses.filter((c) => {
    const fTitle = c.title || c.Title || "";
    const fInstructor = c.instructor || c.Instructor || "";
    const fCategory = c.category || c.Category || "";
    return (
      fTitle.toLowerCase().includes(searchLower) ||
      fInstructor.toLowerCase().includes(searchLower) ||
      fCategory.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <PageHeader
        crumb="/ kurslar "
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          canManage && (
            <div className="flex gap-2">
              {/* Sadece seçim yapıldığında görünen silme butonu */}
              {isEditMode && selectedCourseIds.length > 0 && (
                <button
                  onClick={() => setIsConfirmOpen(true)}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-red-600 transition-colors animate-in fade-in"
                >
                  <Trash2 className="size-4" />
                  Seçilenleri Sil ({selectedCourseIds.length})
                </button>
              )}

              {/* Tümünü Seç Butonu (Sadece düzenleme modunda) */}
              {isEditMode && (
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-xs font-bold transition-colors"
                >
                  {selectedCourseIds.length === filteredCourses.length && filteredCourses.length > 0
                    ? "Seçimi Temizle"
                    : "Tümünü Seç"}
                </button>
              )}

              {/* Düzenleme modunu açıp kapatan buton */}
              <button
                onClick={toggleEditMode}
                className="flex items-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-xs font-bold transition-colors"
              >
                {isEditMode ? "İptal" : "Kursları Düzenle"}
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Plus className="size-4" />
                Yeni Kurs
              </button>
            </div>
          )
        }
      />

      <div className="p-8 animate-reveal">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-widest">
              Kurslar Yükleniyor...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
              Kayıtlı kurs bulunamadı.
            </div>
          ) : (
            filteredCourses.map((c, index) => {
              const currentId = c.id ?? c.Id;
              const title = c.title || c.Title || "İsimsiz Kurs";
              const category = c.category || c.Category || "Genel";
              const price = c.price || c.Price || "0";
              const instructor = c.instructor || c.Instructor || "Bilinmiyor";
              const isSelected = selectedCourseIds.includes(currentId as string | number);

              const imageUrl = getCourseImage(c, index);

              return (
                <div
                  key={currentId || index}
                  // Seçim yapıldıysa karta ekstra çerçeve ve arka plan rengi ekliyoruz
                  className={`group bg-card border transition-colors rounded-md overflow-hidden shadow-sm flex flex-col ${
                    isSelected
                      ? "border-foreground bg-foreground/5 ring-1 ring-foreground"
                      : "border-border hover:border-accent"
                  }`}
                >
                  <div className="w-full aspect-video relative overflow-hidden bg-neutral-100">
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.06) 100%)",
                      }}
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-mono text-accent uppercase">
                        {category}
                      </span>
                      <span className="text-sm font-bold">₺{price}</span>
                    </div>
                    <h4 className="font-bold mb-4 line-clamp-2 flex-1">{title}</h4>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto">
                      <span>Eğitmen: {instructor}</span>
                    </div>

                    {/* SADECE DÜZENLEME MODUNDAYKEN GÖRÜNECEK ONAY KUTUSU (Sil Butonu Yerine) */}
                    {canManage && isEditMode && (
                      <label className="mt-4 flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-mono uppercase bg-background border border-border hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-foreground focus:ring-foreground cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectCourse(currentId)}
                        />
                        {isSelected ? "Seçildi" : "Seç"}
                      </label>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-bold mb-6 tracking-tight">Yeni Kurs Oluştur</h2>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kurs Adı</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: Felsefe Tarihi 101"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Kapasite</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    placeholder="Örn: 50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fiyat (₺)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Örn: 399.99"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
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

      {/* SİLME ONAY MODALI - ÇOKLU SİLME İÇİN GÜNCELLENDİ */}
      {isConfirmOpen && (
        <div
          onClick={() => !isDeleting && setIsConfirmOpen(false)}
          className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-red-100 grid place-items-center shrink-0">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg tracking-tight">Silme Onayı</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Seçili <strong>{selectedCourseIds.length}</strong> kursu silmek istediğinize emin
                  misiniz?
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  Bu işlem geri alınamaz. Lütfen onaylayın veya iptal edin.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isDeleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                Hayır, İptal
              </button>
            </div>
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
    </>
  );
}
