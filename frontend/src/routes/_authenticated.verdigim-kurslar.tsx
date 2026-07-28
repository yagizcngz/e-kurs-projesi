import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { fetchCategories } from "@/components/courseHelpers";

export const Route = createFileRoute("/_authenticated/verdigim-kurslar")({
  component: TaughtCoursesPage,
});

function TaughtCoursesPage() {
  const { t, i18n } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [courses, setCourses] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      if (!token) return;

      const profileRes = await fetch("http://localhost:5157/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileRes.ok) return;
      const profile = await profileRes.json();

      const cRes = await fetch("http://localhost:5157/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cRes.ok) {
        const allCourses = await cRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myCourses = allCourses.filter((c: any) => {
          const instructorName = `${profile.firstName} ${profile.lastName}`.trim();
          return c.instructor === instructorName || c.Instructor === instructorName;
        });
        setCourses(myCourses);
      }

      const rRes = await fetch("http://localhost:5157/api/teachingrequests/my-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (rRes.ok) {
        setRequests(await rRes.json());
      }

      const cats = await fetchCategories(token);
      setCategories(cats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("jwt_token");

      const profileRes = await fetch("http://localhost:5157/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await profileRes.json();

      const teacherRes = await fetch("http://localhost:5157/api/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teachers = await teacherRes.json();

      const meTeacher = teachers.find(
        (t: Record<string, unknown>) =>
          t.userId === profile.id ||
          t.UserId === profile.id ||
          t.email === profile.email ||
          t.Email === profile.email,
      );

      const response = await fetch("http://localhost:5157/api/courses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Title: newTitle,
          Category: newCategory,
          Instructor: `${profile.firstName} ${profile.lastName}`.trim(),
          TeacherId: meTeacher ? meTeacher.id || meTeacher.Id : 0,
          MaxCapacity: Number(newCapacity) || 0,
          Price: Number(newPrice) || 0,
          Description: newDescription,
        }),
      });

      if (response.ok) {
        toast.success(t("courses.errors.createSuccess"));
        setIsModalOpen(false);
        // Reset form
        setNewTitle("");
        setNewCategory("");
        setNewCapacity("");
        setNewPrice("");
        setNewDescription("");
        fetchData();
      } else {
        const errorText = await response.text();
        toast.error(errorText || t("courses.errors.createFailed"));
      }
    } catch (error) {
      toast.error(t("courses.errors.serverError"));
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`http://localhost:5157/api/teachingrequests/${requestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success(t("requests.cancelSuccess", "İstek geri alındı."));
        fetchData();
      } else {
        toast.error(t("requests.cancelFailed", "İstek geri alınamadı."));
      }
    } catch (error) {
      toast.error(t("requests.serverError", "Sunucu hatası."));
    }
  };

  return (
    <>
      <PageHeader
        crumb={t("sidebar.taughtCourses")}
        action={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="size-4" /> {t("courses.newCourse")}
          </Button>
        }
      />

      <div className="p-4 md:p-8 animate-reveal space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-6">{t("sidebar.taughtCourses")}</h2>
          {courses.length === 0 ? (
            <div className="text-center py-12 bg-card border rounded-lg shadow-sm">
              <p className="text-muted-foreground">{t("courses.noTaughtCourses")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((c) => (
                <Card key={c.id || c.Id} className="group hover:border-accent transition-colors">
                  <div className="w-full aspect-video bg-neutral-100 flex items-center justify-center border-b">
                    {/* Placeholder image for taught courses */}
                    <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                      {i18n.exists(`dynamic.categories.${c.category || c.Category}`)
                        ? t(`dynamic.categories.${c.category || c.Category}`)
                        : c.category || c.Category}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold mb-2 line-clamp-2">{c.title || c.Title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t("courses.capacity")}: {c.maxCapacity || c.MaxCapacity || 0}
                    </p>
                    <div className="text-primary font-bold">
                      {c.price || c.Price
                        ? `₺${c.price || c.Price}`
                        : t("courses.free", "Ücretsiz")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-6">{t("courses.myTeachingRequests")}</h2>
          {requests.length === 0 ? (
            <div className="text-center py-12 bg-card border rounded-lg shadow-sm">
              <p className="text-muted-foreground">{t("courses.noTeachingRequests")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {requests.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold line-clamp-2">{r.courseTitle}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-auto pt-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            r.status === "Accepted"
                              ? "default"
                              : r.status === "Rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {r.status === "Accepted"
                            ? t("requests.accepted")
                            : r.status === "Rejected"
                              ? t("requests.rejected")
                              : t("requests.pending")}
                        </Badge>
                        {r.status === "Pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelRequest(r.id)}
                            className="text-xs h-7 px-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
                          >
                            {t("requests.cancel", "İsteği Geri Al")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">{t("courses.newCourse")}</h3>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("courses.courseName")} *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder={t("courses.courseNamePlaceholder")}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t("courses.category")} *</label>
                <select
                  required
                  className="w-full rounded-md border p-2 text-sm bg-background"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="" disabled>
                    {t("courses.selectCategory")}
                  </option>
                  {categories.map((b) => (
                    <option key={b} value={b}>
                      {i18n.exists(`dynamic.categories.${b}`) ? t(`dynamic.categories.${b}`) : b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("courses.capacity")}</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    className="w-full rounded-md border p-2 text-sm bg-background"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("courses.price")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border p-2 text-sm bg-background"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("courses.description")}</label>
                <textarea
                  rows={4}
                  maxLength={1000}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  placeholder={t("courses.descriptionPlaceholder")}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  {t("courses.cancel")}
                </Button>
                <Button type="submit">{t("courses.save")}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
