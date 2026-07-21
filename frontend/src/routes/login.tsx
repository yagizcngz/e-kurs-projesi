import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  // TanStack Router'ın sayfa değiştirme (yönlendirme) aracı
  const navigate = useNavigate({ from: "/login" });

  // Hızlı test edebilmen için value'ları otomatik doldurduk
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Sayfa yenilenmesini engelle
    setError("");

    try {
      const response = await fetch("http://localhost:5157/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // SİHİRLİ DOKUNUŞ: Token'ı tarayıcının kasasına güvenle koy
        localStorage.setItem("jwt_token", data.token);
        localStorage.setItem("username", username); // Kullanıcı adını ekledik

        // Giriş başarılı olunca kullanıcıyı anında Kontrol Paneli'ne (/) gönder
        navigate({ to: "/" });
      } else {
        setError("Kullanıcı adı veya şifre hatalı!");
      }
    } catch (err) {
      setError("Sunucuya ulaşılamıyor. Backend (C# API) çalışıyor mu?");
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-foreground text-background font-bold text-xl mb-4">
            EK
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sisteme Giriş</h1>
          <p className="text-sm text-muted-foreground mt-1">E-Kurs Yönetim Paneli</p>
        </div>

        {/* Hata Mesajı Kutusu */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Kullanıcı Adı</label>
            <input
              type="text"
              required
              className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Şifre</label>
            <input
              type="password"
              required
              className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-foreground text-background text-sm font-bold hover:opacity-90 rounded-md transition-opacity mt-2"
          >
            Giriş Yap
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link to="/register" className="font-semibold text-foreground hover:underline">
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
