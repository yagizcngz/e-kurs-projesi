import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate({ from: "/register" });

  // AD VE SOYAD STATE'LERİ EKLENDİ
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5157/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // BACKEND'E ARTIK AD VE SOYAD BİLGİSİNİ DE GÖNDERİYORUZ
        body: JSON.stringify({ firstName, lastName, username, password }),
      });

      if (response.ok) {
        navigate({ to: "/login" });
      } else {
        const errorText = await response.text();
        setError(errorText || "Kayıt olurken bir hata oluştu!");
      }
    } catch (err) {
      setError("Sunucuya ulaşılamıyor.");
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-foreground text-background font-bold text-xl mb-4">
            EK
          </div>
          <h1 className="text-2xl font-bold text-foreground">Yeni Hesap Aç</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* AD VE SOYAD KUTUCUKLARI BURAYA EKLENDİ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Ad</label>
              <input
                type="text"
                required
                className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Örn: Yağız"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Soyad</label>
              <input
                type="text"
                required
                className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Örn: Cengiz"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Kullanıcı Adı (Giriş ID)</label>
            <input
              type="text"
              required
              className="w-full p-2.5 bg-background border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Örn: yagizcngz"
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
            Kayıt Ol
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{" "}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
