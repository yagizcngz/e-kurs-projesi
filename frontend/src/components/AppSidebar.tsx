import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  ChevronUp,
  User,
  Settings,
  Sun,
  Moon,
  HelpCircle,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const menuItems = [
  { title: "Kontrol Paneli", url: "/", icon: LayoutDashboard },
  { title: "Öğrenciler", url: "/ogrenciler", icon: Users },
  { title: "Kurslar", url: "/kurslar", icon: BookOpen },
  { title: "Kayıtlar", url: "/kayitlar", icon: ClipboardList },
  { title: "Raporlar", url: "/raporlar", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    initials: string;
    photo?: string;
  }>({
    name: "Kullanıcı",
    role: "Kullanıcı",
    initials: "K",
  });

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const storedUsername = localStorage.getItem("username");

    let currentName = storedUsername || "username";
    let currentRole = "User";

    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        const rawRole =
          payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
          payload.role ||
          "";
        currentRole = String(rawRole).toLowerCase() === "admin" ? "Admin" : "User";

        if (!storedUsername) {
          currentName =
            payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
            payload.name ||
            payload.unique_name ||
            currentName;
        }
      }
    }

    const initials = currentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    let photo: string | undefined = undefined;
    const userKey = `profile_data_${currentName.toLowerCase().replace(/\s+/g, "_")}`;
    const profileString = localStorage.getItem(userKey);

    if (profileString) {
      try {
        const parsedProfile = JSON.parse(profileString);
        photo = parsedProfile?.photoUrl;
      } catch (err) {
        console.warn("Sidebar profil resmi okunamadı:", err);
      }
    }

    setCurrentUser({ name: currentName, role: currentRole, initials, photo });
  }, [location.pathname]); // <--- BURAYA DİKKAT: Artık sayfa değiştiğinde güncellenecek

  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string; photoUrl?: string } | undefined;

      setCurrentUser((prev) => ({
        ...prev,
        name: detail?.name || prev.name,
        photo: detail?.photoUrl !== undefined ? detail.photoUrl : prev.photo,
      }));
    };

    window.addEventListener("profile-updated", onProfileUpdated as EventListener);
    return () => window.removeEventListener("profile-updated", onProfileUpdated as EventListener);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    let dark: boolean;
    if (saved === "dark") dark = true;
    else if (saved === "light") dark = false;
    else dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token"); // "token" yerine "jwt_token" olmalı
    localStorage.removeItem("username");
    localStorage.removeItem("user_profile");
    navigate({ to: "/login" });
  };

  const menuLinks = [
    { label: "Profil", icon: User, to: "/profil" },
    { label: "Kurslarım", icon: GraduationCap, to: "/kurslar" },
    { label: "Ayarlar", icon: Settings, to: "/ayarlar" },
    { label: "Yardım", icon: HelpCircle, to: "/yardim" },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg">E-Kurs</span>
      </div>

      {/* Menü */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.url;
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
                isActive
                  ? "bg-neutral-900 text-white font-medium shadow-[0_4px_10px_-2px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12),inset_0_-2px_0_0_rgba(0,0,0,0.5)] ring-1 ring-black/60"
                  : "text-sidebar-foreground hover:bg-neutral-900/5 hover:text-neutral-900 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),inset_0_-1px_0_0_rgba(0,0,0,0.08)] dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Profil */}
      <div className="border-t p-2">
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent transition-colors">
              {currentUser.photo ? (
                <img
                  src={currentUser.photo}
                  alt={currentUser.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {currentUser.initials}
                </div>
              )}
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.role}</p>
              </div>
              <ChevronUp
                className={`h-4 w-4 transition-transform ${menuOpen ? "" : "rotate-180"}`}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 p-1">
            {menuLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all ${
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                      : // Hover rengini ana menüdekiyle uyumlu hale getirdik:
                        "text-sidebar-foreground hover:bg-neutral-900/5 hover:text-neutral-900 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-all hover:bg-neutral-900/5 hover:text-neutral-900 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Tema ({isDark ? "Karanlık" : "Aydınlık"})
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive transition-all hover:bg-neutral-900/5 dark:hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
