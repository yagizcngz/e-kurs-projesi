namespace EdTechApi.Core.Constants
{
    // Öğretmen "Branş" alanı ile kurs "Kategori" alanı için ortak, sabit değer listesi.
    // Bir öğretmen sadece kendi branşıyla aynı kategorideki kurslara eğitmen olarak
    // atanabilir; bu yüzden iki alan da serbest metin yerine bu listeden seçilmeli.
    // NOT: Bu liste frontend'deki courseHelpers.ts > BRANCH_OPTIONS ile birebir aynı
    // tutulmalı, yoksa eşleştirme kontrolü tutarsız çalışır.
    public static class BranchOptions
    {
        public static readonly string[] All =
        {
            "Fen Bilimleri",
            "Sosyal Bilimler",
            "Yazılım",
            "Yabancı Dil",
            "Tasarım",
            "Genel",
        };

        public static bool IsValid(string? value) =>
            !string.IsNullOrWhiteSpace(value) &&
            All.Any(b => string.Equals(b, value, StringComparison.OrdinalIgnoreCase));

        // Geçerliyse listedeki "kanonik" yazımı (doğru büyük/küçük harf) döndürür,
        // geçersizse null döner. Böylece "fen bilimleri" gibi farklı yazımlar da
        // aynı değere normalize edilir ve eşleştirme kontrolü bozulmaz.
        public static string? Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return All.FirstOrDefault(b => string.Equals(b, value, StringComparison.OrdinalIgnoreCase));
        }
    }
}