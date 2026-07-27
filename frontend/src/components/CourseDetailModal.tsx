import {
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
  BookOpen,
  Edit2,
  Upload,
  Link2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  API_BASE,
  resolveImageSrc,
  getCourseImage,
  getCourseEnrollments,
  getTeacherFullName,
  getTeachersInBranch,
  type CourseData,
  type EnrollmentDto,
  type TeacherLiteDto,
} from "./courseHelpers";

interface CourseDetailModalProps {
  course: CourseData;
  onClose: () => void;
  canManage: boolean;
  enrollments: EnrollmentDto[];
  teachers: TeacherLiteDto[];
  categories: string[];
  onSaved: (updated: CourseData) => void;
}

export function CourseDetailModal({
  course,
  onClose,
  canManage,
  enrollments,
  teachers,
  categories,
  onSaved,
}: CourseDetailModalProps) {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  // editTeacherId: teachers listesinden seçilen öğretmenin id'si (string olarak, select
  // elemanının value'su için). Boş string = "henüz öğretmen seçilmedi".
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "link">("upload");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const courseId = course.id ?? course.Id;
  useEffect(() => {
    setIsEditing(false);
    setStatusMessage(null);
  }, [courseId]);

  const originalTitle = course.title || course.Title || t("courseModal.unnamedCourse");
  const originalCategory = course.category || course.Category || t("courseModal.general");
  const originalInstructor =
    course.instructor || course.Instructor || t("courseModal.unknownInstructor");

  const title = i18n.exists(`dynamic.courses.${originalTitle}`)
    ? t(`dynamic.courses.${originalTitle}`)
    : originalTitle;
  const category = i18n.exists(`dynamic.categories.${originalCategory}`)
    ? t(`dynamic.categories.${originalCategory}`)
    : originalCategory;
  const instructor = originalInstructor;

  const price = course.price || course.Price || "0";
  const teacherId = course.teacherId ?? course.TeacherId;
  const capacity = course.maxCapacity || course.MaxCapacity;

  const description = course.description || course.Description;

  const imageUrl = getCourseImage(course, 0);
  const courseEnrollments = getCourseEnrollments(course, enrollments);

  // Eğitmen profili (fotoğraf + bio): önce TeacherId ile kesin eşleşme deneniyor.
  // TeacherId'si olmayan eski kurslar için isimle eşleştirme geriye dönük uyumluluk
  // amacıyla hâlâ deneniyor, ama artık ikincil (fallback) yöntem.
  const instructorProfile = (() => {
    if (teacherId !== undefined && teacherId !== null && teacherId !== "") {
      const match = teachers.find((t) => String(t.id ?? t.Id) === String(teacherId));
      if (match) {
        return {
          photoUrl: match.profilePictureUrl || match.ProfilePictureUrl || "",
          bio: match.aboutMe || match.AboutMe || "",
        };
      }
    }

    const target = instructor.trim().toLowerCase();
    if (!target) return null;
    const nameMatch = teachers.find((t) => getTeacherFullName(t).trim().toLowerCase() === target);
    if (!nameMatch) return null;
    return {
      photoUrl: nameMatch.profilePictureUrl || nameMatch.ProfilePictureUrl || "",
      bio: nameMatch.aboutMe || nameMatch.AboutMe || "",
    };
  })();

  const instructorInitials =
    instructor
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "E";

  const handleStartEdit = () => {
    setEditTitle(course.title || course.Title || "");
    const currentCategory = course.category || course.Category || "";
    setEditCategory(currentCategory);
    setEditPrice(String(course.price ?? course.Price ?? ""));
    setEditCapacity(String(course.maxCapacity ?? course.MaxCapacity ?? ""));

    const currentTeacherIdStr =
      teacherId !== undefined && teacherId !== null && teacherId !== "" ? String(teacherId) : "";
    // Kursa kayıtlı öğretmenin branşı, başka bir yerden (Öğretmenler sayfasından) değiştirilmiş
    // olabilir. Bu durumda id artık bu kategori için geçersizdir; formda "stale" (eskimiş)
    // haliyle taşımak yerine seçimi sıfırlıyoruz — aksi halde <select> görsel olarak listedeki
    // tek/başka bir öğretmeni gösterirken, state hâlâ eski (artık geçersiz) öğretmeni tutar ve
    // kullanıcı hiç dokunmadan Kaydet'e basarsa yanlış öğretmen gönderilir.
    const stillValidTeacher = getTeachersInBranch(teachers, currentCategory).some(
      (t) => String(t.id ?? t.Id) === currentTeacherIdStr,
    );
    setEditTeacherId(stillValidTeacher ? currentTeacherIdStr : "");

    setEditDescription(course.description || course.Description || "");
    setEditImageUrl(course.imageUrl || course.ImageUrl || course.image || course.Image || "");
    setImageMode("upload");
    setStatusMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20_000_000) {
      showStatusToast("error", t("courseModal.errors.uploadFailed"));
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem("jwt_token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/uploads/course-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setEditImageUrl(data.url);
      } else {
        const errText = await response.text();
        console.error("Fotoğraf yüklenemedi:", errText);
        setStatusMessage({ type: "error", text: t("courseModal.errors.uploadFailed") });
      }
    } catch (error) {
      console.error(error);
      showStatusToast("error", t("courseModal.errors.serverError"));
    } finally {
      setIsUploadingImage(false);
      // Aynı dosyayı tekrar seçebilmek için input'u sıfırla
      e.target.value = "";
    }
  };

  const showStatusToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRemoveImage = () => setEditImageUrl("");

  const handleSave = async () => {
    const courseId = course.id ?? course.Id;
    if (!courseId) {
      showStatusToast("error", t("courseModal.errors.courseIdMissing"));
      return;
    }
    if (!editTitle.trim()) {
      showStatusToast("error", t("courseModal.errors.titleEmpty"));
      return;
    }
    if (!editCategory) {
      showStatusToast("error", t("courseModal.errors.categoryEmpty"));
      return;
    }
    if (!editTeacherId) {
      showStatusToast("error", t("courseModal.errors.instructorEmpty"));
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem("jwt_token");

      // Instructor metnini backend zaten senkronize edecek
      // (CourseService.SyncInstructorFromTeacherAsync), ama burada da doğru değeri
      // gönderiyoruz ki UI, sunucu yanıtı dönene kadar da tutarlı görünsün.
      const selectedTeacher = teachers.find((t) => String(t.id ?? t.Id) === editTeacherId);
      const instructorToSend = getTeacherFullName(selectedTeacher || {});
      const teacherIdToSend = Number(editTeacherId);

      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Title: editTitle,
          Category: editCategory,
          Instructor: instructorToSend,
          TeacherId: teacherIdToSend,
          MaxCapacity: Number(editCapacity) || 0,
          Price: Number(editPrice) || 0,
          Description: editDescription,
          ImageUrl: editImageUrl,
        }),
      });

      if (response.ok) {
        const updated: CourseData = {
          ...course,
          title: editTitle,
          Title: editTitle,
          category: editCategory,
          Category: editCategory,
          instructor: instructorToSend,
          Instructor: instructorToSend,
          teacherId: teacherIdToSend,
          TeacherId: teacherIdToSend,
          maxCapacity: Number(editCapacity) || 0,
          MaxCapacity: Number(editCapacity) || 0,
          price: Number(editPrice) || 0,
          Price: Number(editPrice) || 0,
          description: editDescription,
          Description: editDescription,
          imageUrl: editImageUrl,
          ImageUrl: editImageUrl,
        };
        onSaved(updated);
        setIsEditing(false);
        showStatusToast("success", t("courseModal.errors.updateSuccess"));
      } else {
        const errorData = await response.text();
        console.error("Kurs güncellenirken backend hatası:", errorData);
        showStatusToast("error", errorData || t("courseModal.errors.updateFailed"));
      }
    } catch (error) {
      console.error(error);
      showStatusToast("error", t("courseModal.errors.serverError"));
    } finally {
      setIsSaving(false);
    }
  };

  const editPreviewSrc = editImageUrl ? resolveImageSrc(editImageUrl) : getCourseImage(course, 0);
  // Eğitmen dropdown'ı sadece seçili kategoriyle aynı branştaki öğretmenleri gösterir.
  const teachersInCategory = getTeachersInBranch(teachers, editCategory);

  const handleCategoryChange = (newCategory: string) => {
    setEditCategory(newCategory);
    // Yeni kategoride mevcut seçili öğretmen artık uygun değilse seçimi sıfırla.
    const stillValid = getTeachersInBranch(teachers, newCategory).some(
      (t) => String(t.id ?? t.Id) === editTeacherId,
    );
    if (!stillValid) setEditTeacherId("");
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1.5 text-foreground hover:bg-background transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="w-full aspect-video relative overflow-hidden bg-neutral-100">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)",
            }}
          />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-90">
              {category}
            </span>
            <h2 className="text-2xl font-bold leading-tight">{title}</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs font-bold">
                ₺{price}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs font-bold">
                <Users className="size-3.5" />
                {capacity
                  ? t("courseModal.capacityFull", { enrolled: courseEnrollments.length, capacity })
                  : t("courseModal.capacityRegistered", { enrolled: courseEnrollments.length })}
              </div>
            </div>

            {canManage && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 text-xs font-bold border border-border rounded-md px-3 py-1.5 hover:bg-foreground/5 transition-colors"
              >
                <Edit2 className="size-3.5" />
                {t("courseModal.editCourse")}
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 border-t border-border pt-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("courseModal.photoLabel")}</label>
                <div className="flex gap-4">
                  <div className="size-20 rounded-md overflow-hidden bg-neutral-100 border border-border shrink-0">
                    <img
                      src={editPreviewSrc}
                      alt={t("courseModal.preview")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImageMode("upload")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md border transition-colors ${
                          imageMode === "upload"
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:bg-foreground/5"
                        }`}
                      >
                        <Upload className="size-3.5" />
                        {t("courseModal.uploadFile")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode("link")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md border transition-colors ${
                          imageMode === "link"
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:bg-foreground/5"
                        }`}
                      >
                        <Link2 className="size-3.5" />
                        {t("courseModal.pasteLink")}
                      </button>
                    </div>

                    {imageMode === "upload" ? (
                      <label className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold border border-dashed border-border rounded-md cursor-pointer hover:bg-foreground/5 transition-colors">
                        {isUploadingImage
                          ? t("courseModal.uploading")
                          : t("courseModal.chooseFromPc")}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={handleFileChange}
                        />
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="https://ornek.com/fotograf.jpg"
                        className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                      />
                    )}

                    {editImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-[11px] font-mono text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        {t("courseModal.removePhoto")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("courseModal.courseName")}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("courseModal.category")}</label>
                  <select
                    value={editCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  >
                    <option value="" disabled>
                      {t("courses.selectCategory")}
                    </option>
                    {/* Eğer kursun mevcut kategorisi silinmişse ve hala ondaysa, onu da göster */}
                    {editCategory && !categories.includes(editCategory) && (
                      <option value={editCategory}>{editCategory}</option>
                    )}
                    {categories.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("courseModal.instructor")}</label>
                  <select
                    value={editTeacherId}
                    onChange={(e) => setEditTeacherId(e.target.value)}
                    disabled={!editCategory}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {!editCategory
                        ? t("courseModal.firstSelectCategory")
                        : teachersInCategory.length === 0
                          ? t("courseModal.noTeacherInBranch")
                          : t("courseModal.selectInstructor")}
                    </option>
                    {teachersInCategory.map((t) => {
                      const id = t.id ?? t.Id;
                      return (
                        <option key={id} value={id}>
                          {getTeacherFullName(t)}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    {t("courseModal.onlyTeachersInBranch", {
                      category: editCategory || t("courseModal.selectCategory"),
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("courseModal.capacity")}</label>
                  <input
                    type="number"
                    min="1"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("courseModal.price")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("courseModal.courseContent")}</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={t("courseModal.courseContentPlaceholder")}
                  className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80 rounded-md transition-colors disabled:opacity-60"
                >
                  {t("courseModal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isUploadingImage}
                  className="flex-1 py-2.5 px-4 bg-foreground text-background text-sm font-bold hover:opacity-90 rounded-md transition-opacity disabled:opacity-60"
                >
                  {isSaving ? t("courseModal.saving") : t("courseModal.save")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-bold text-foreground/80 mb-2 flex items-center gap-2">
                  <BookOpen className="size-4" />
                  {t("courseModal.contentTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-6">
                  {description || t("courseModal.noDescription", { category })}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground/80 mb-3 flex items-center gap-2">
                  <User className="size-4" />
                  {t("courseModal.instructorProfile")}
                </h3>
                <div className="flex items-center gap-4 bg-background border border-border rounded-xl p-4">
                  {instructorProfile?.photoUrl ? (
                    <img
                      src={resolveImageSrc(instructorProfile.photoUrl)}
                      alt={instructor}
                      className="size-14 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="size-14 rounded-full bg-linear-to-tr from-stone-800 to-stone-600 text-white flex items-center justify-center text-lg font-mono uppercase shrink-0">
                      {instructorInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold">{instructor}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">
                      {t("courseModal.instructorRole")}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {instructorProfile?.bio || t("courseModal.noInstructorBio")}
                    </p>
                  </div>
                </div>
              </div>

              {courseEnrollments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground/80 mb-2 flex items-center gap-2">
                    <Users className="size-4" />
                    {t("courseModal.enrolledStudents")}
                  </h3>
                  <ul className="text-sm text-foreground space-y-1.5">
                    {courseEnrollments.slice(0, 8).map((enr, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-foreground/50 shrink-0"></span>
                        {enr.studentFullName || enr.StudentFullName}
                      </li>
                    ))}
                    {courseEnrollments.length > 8 && (
                      <li className="text-xs text-muted-foreground pl-3.5">
                        {t("courseModal.moreStudents", { count: courseEnrollments.length - 8 })}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-300 flex items-center gap-3 rounded-lg px-5 py-3.5 text-sm font-bold text-white shadow-xl ${
            statusMessage.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}
