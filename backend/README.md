# EdTech API - Test Rehberi

Bu dosya, API üzerindeki uç noktaları (endpoint) test ederken kullanabileceğiniz örnek JSON isteklerini (payload) ve adresleri içerir.

## 1. Kimlik Doğrulama (Auth) Testleri

### Yeni Kullanıcı Kaydı (Register)
Veritabanına şifrelenmiş (hashing) bir kullanıcı ekler.
* **Adres:** POST http://localhost:5157/api/auth/register
* **Body (JSON):**
```json
{
  "username": "testuser",
  "password": "mypassword123"
}

---------------------------------------------------------------------------------------------------------------------------------------------------

Giriş Yapma ve Token Alma (Login)
Kayıtlı kullanıcı ile giriş yapar ve Bearer Token döndürür. Diğer kilitli işlemleri yapmak için buradan dönen "token" değerini kopyalamalısınız.

Adres: POST http://localhost:5157/api/auth/login

Body (JSON):

JSON
{
  "username": "testuser",
  "password": "mypassword123"
}

---------------------------------------------------------------------------------------------------------------------------------------------------

2. Kurs (Course) Testleri
(DİKKAT: Bu uç noktalar [Authorize] ile korunduğu için istek atarken Header/Auth sekmesine Token eklenmelidir.)

Başarılı Kurs Ekleme
Adres: POST http://localhost:5157/api/courses

Body (JSON):

JSON
{
  "title": "C# ile Backend Geliştirme",
  "maxCapacity": 30
}

---------------------------------------------------------------------------------------------------------------------------------------------------

Hatalı Kurs Ekleme (FluentValidation Testi)
Sistem kapasiteyi 0 veya başlığı boş gönderdiğinde 400 Bad Request dönmelidir.

Adres: POST http://localhost:5157/api/courses

Body (JSON):

JSON
{
  "title": "",
  "maxCapacity": 0
}

---------------------------------------------------------------------------------------------------------------------------------------------------

3. Öğrenci (Student) Testleri
Başarılı Öğrenci Ekleme
Adres: POST http://localhost:5157/api/students

Body (JSON):

JSON
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "studentNumber": "123456789"
}

---------------------------------------------------------------------------------------------------------------------------------------------------

Hatalı Öğrenci Ekleme (FluentValidation Testi)
Öğrenci numarası 9 haneli olmadığı için sistem 400 Bad Request dönmelidir.

Adres: POST http://localhost:5157/api/students

Body (JSON):

JSON
{
  "firstName": "Ayşe",
  "lastName": "Kaya",
  "studentNumber": "1234"
}

---------------------------------------------------------------------------------------------------------------------------------------------------

4. Kayıt (Enrollment) Testleri
(Öğrencileri kurslara atama işlemleri. Global Hata Yönetimi testlerini içerir.)

Öğrenciyi Kursa Kaydetme
ID değerlerini veritabanınızdaki mevcut öğrenci ve kurslara göre değiştirin.

Adres: POST http://localhost:5157/api/enrollments/student/1/course/1

Body: Boş (Parametreler URL üzerinden gidiyor)

Hata Testi: Aynı Öğrenciyi Aynı Kursa Tekrar Kaydetme
Yukarıdaki isteği ikinci kez attığınızda Global Exception Middleware devreye girip şu JSON yanıtını 400 koduyla dönmelidir:

JSON
{
  "error": "Öğrenci bu kursa zaten kayıtlı."
}

---------------------------------------------------------------------------------------------------------------------------------------------------

Hata Testi: Olmayan Öğrenciyi Kaydetme
Veritabanında bulunmayan bir ID (örn: 9999) girdiğinizde şu hatayı dönmelidir:

JSON
{
  "error": "Öğrenci bulunamadı."
}

---------------------------------------------------------------------------------------------------------------------------------------------------
