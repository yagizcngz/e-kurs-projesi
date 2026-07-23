import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

// Token okuma fonksiyonu
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

export function useAdminGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");

    if (!token) {
      navigate({ to: "/login", replace: true });
      return;
    }

    const payload = parseJwt(token);
    if (payload) {
      const rawRole =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
        payload.role ||
        "";

      // Eğer kullanıcının rolü "Admin" DEĞİLSE, onu zorla Ana Sayfaya (/) yönlendir
      if (String(rawRole).toLowerCase() !== "admin") {
        navigate({ to: "/", replace: true });
      }
    } else {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);
}
