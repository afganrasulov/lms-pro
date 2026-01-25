ÖNEMLİ: Bu dosya çalışan özelliklerin dökümantasyonudur. Yeni özellik eklerken veya değişiklik yaparken bu dosyadaki mevcut özelliklerin çalışmasını bozmamaya özen göster.

## 1. Realtime Bildirim Sistemi

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Kullanıcıya özel bildirimler (ör. ödev notlandı, rozet kazanıldı) veritabanına eklendiği anda (INSERT işlemi) ekranın sağ üst köşesinde anlık Toast mesajı olarak gösterilir.
- **Teknik Detay:**
  - `useNotifications` hook'u `notifications` tablosunu dinler.
  - Sadece oturum açmış kullanıcıya ait bildirimleri filtreler (`user_id` filtresi).
  - Bildirim geldiğinde `router.refresh()` tetiklenerek sunucu bileşenleri (örn. zil ikonundaki sayı) güncellenir.

## 2. Canlı Liderlik Tablosu ve XP Takibi

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Herhangi bir kullanıcının XP veya Gem puanı değiştiğinde, Dashboard'daki liderlik tablosu ve üst menüdeki kişistel istatistikler anlık olarak güncellenir.
- **Teknik Detay:**
  - `UserDashboardPage`, `profiles` tablosundaki UPDATE işlemlerini dinler.
  - Değişiklik olduğunda `GamificationService.getLeaderboard()` tekrar çağrılır.
  - Kullanıcılar rakiplerinin ilerlemesini sayfa yenilemeden görebilir.

## 3. Canlı Admin İstatistikleri

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Admin panelindeki "Toplam Kullanıcı", "Toplam Kurs" ve "Aktif Kayıtlar" kartları, ilgili tablolara veri eklendiğinde anında güncellenir.
- **Teknik Detay:**
  - `AdminDashboardPage`, `profiles`, `courses` ve `enrollments` tablolarını dinler.
  - Yeni kayıt veya satın alma olduğunda istatistikler yeniden hesaplanır.

## 4. Profil Yönetimi ve Güvenli Oturum Kontrolü

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Kullanıcılar profil sayfasına girdiklerinde oturumları güvenli bir şekilde doğrulanır ve profil bilgileri (Avatar, İsim) anlık olarak yönetilebilir. Gereksiz login yönlendirmeleri engellenmiştir.
- **Teknik Detay:**
  - **Sorun Çözümü:** `use-profile` hook'unda yaşanan oturum senkronizasyonu sorunu, legacy Supabase istemcisi yerine SSR uyumlu `createClient` yapısına geçilerek çözüldü.
  - **Servis Güncellemesi:** `ProfileService.updateProfile` metodu artık "authenticated" bir Supabase istemcisi kabul ediyor. Bu sayede RLS (Row Level Security) kurallarına takılmadan güvenli güncelleme yapılabiliyor.
  - `middleware.ts` içerisine `/profile` rotası eklenerek sunucu taraflı koruma sağlandı.
  - Profil değişiklikleri (avatar yükleme, isim güncelleme) realtime olarak arayüze yansır.

## 5. Dinamik Global Liderlik Tablosu (Leaderboard)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** `/leaderboard` sayfası artık statik değil. Veritabanındaki `weekly_leaderboard` verisini (XP, İsim, Avatar) anlık olarak çeker ve en yüksek puanlı kullanıcıları sıralar.
- **Teknik Detay:**
  - Sayfa "async Server Component" olarak yeniden yazıldı.
  - `GamificationService.getLeaderboard(50)` metodu ile sunucu taraflı veri çekilir.
  - İlk 3 kullanıcı için özel Altın/Gümüş/Bronz ikonları ve renklendirmeler eklendi.
  - Veri olmadığında "Henüz aktivite yok" durumu ele alındı.

## 6. Toplu Kurs İçe/Dışa Aktarma (Excel Import/Export)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Yöneticiler Excel şablonları kullanarak toplu halde yeni kurs oluşturabilir veya mevcut kursların müfredatını güncelleyebilirler. Sistem, Kurs Ayarları ve Müfredat için iki ayrı Excel sayfası kullanır.
- **Teknik Detay:**
  - **Çift Sayfa Yapısı (Two-Sheet):** Excel dosyası mutlaka `Course Settings` (Genel Bilgiler) ve `Curriculum` (Modül/Dersler) sayfalarını içermelidir.
  - **Otomatik Doldurma (Fill-Down):** `Curriculum` sayfasında Modül Başlığı sütunu boş bırakılırsa, sistem otomatik olarak bir önceki satırdaki modül başlığını kullanır.
  - **Görünürlük Garantisi (Visibility Fix):** İçe aktarılan Modül ve Dersler, veritabanına varsayılan olarak `status: 'published'` olarak eklenir. Bu, admin panelinde "müfredatın görünmemesi" sorununu çözer.
  - **Debug İstatistikleri:** API (`POST /api/courses/import`), parsing başarısını doğrulamak için `modulesFound`, `modulesInserted` ve `lessonsInserted` sayaçlarını response içinde döner.
  - **Kritik Fix (Build Hatası - Implicit Any):** `api/courses/[courseId]/import/route.ts` dosyasında `currentModuleLessons` dizisinin tipinin belirsiz olması build sürecini engelliyordu. Diziye detaylı ve explicit tip tanımı (`{ ... }[]`) eklenerek TypeScript strict mod hatası giderildi ve güvenli derleme sağlandı.

## 7. Acumbamail E-posta Pazarlama Entegrasyonu

- **Durum:** ✅ Çalışıyor
- **Açıklama:** LMS platformu, öğrenci verilerini ve işlemsel e-postaları yönetmek için Acumbamail ile tam entegre çalışır.
- **Teknik Detay:**
  - **Otomatik Senkronizasyon:** Yeni kayıt olan her kullanıcı, arkaplanda çalışan `/api/auth/sync` servisi aracılığıyla Acumbamail'deki "LMS Students" listesine (ID: 1235445) otomatik olarak eklenir. `AcumbamailService` sınıfı bu iletişimi yönetir.
  - **İşlemsel E-postalar (Transactional):** Satın alma sonrası "Hoşgeldin" mesajları ve şifre sıfırlama gibi kritik bildirimler, Acumbamail SMTP Relay servisi üzerinden gönderilir. Bu sayede yüksek teslimat oranı (deliverability) sağlanır.
  - **Polar Webhook Entegrasyonu:** Kurs satın alındığında tetiklenen Polar webhook'u (`order.created`), artık sadece öğrenciyi derse kaydetmekle kalmaz, aynı zamanda `Customer Email` bilgisine özel bir hoşgeldin/başlangıç e-postası tetikler.
  - **Konfigürasyon:** Hassas bilgiler (Auth Token, SMTP Pass) `.env.local` dosyasında saklanır ve Git'e gönderilmez.

## 8. Sürükle-Bırak Ders Sıralama (Drag & Drop Lesson Reordering)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Eğitmenler, "Course Builder" ekranında derslerin sırasını sürükleyip bırakarak değiştirebilirler. Dersler aynı modül içinde yeniden sıralanabilir veya farklı bir modüle taşınabilir.
- **Teknik Detay:**
  - **Kütüphane:** `@hello-pangea/dnd` kullanıldı (Nested Lists pattern).
  - **Mimari:** `ModuleList` bileşeni tüm sürükleme mantığını (`DragDropContext`) yönetir. Dersler `type="LESSON"` etiketiyle, Modüller `type="MODULE"` etiketiyle ayırt edilir.
  - **Optimistic UI:** Sürükleme işlemi bittiği anda UI anında güncellenir, API isteği arkaplanda atılır. Hata olursa UI eski haline döner.
  - **Kritik Fix (Reorder Error):** `LessonService.reorderLessons` metodunda, Supabase `upsert` işlemi yerine `Promise.all` ile paralel `UPDATE` işlemleri kullanıldı. Bu değişiklik, RLS politikaları veya partial update kısıtlamaları nedeniyle oluşan sessiz hata (silent failure) sorununu çözdü.

## 9. Dinamik Kurslar Sayfası (/courses)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** `/courses` sayfası artık statik değil, sunucu taraflı (SSR) çalışan dinamik bir sayfadır. Yayınlanmış (`published`) ve herkese açık (`public`) kurslar anlık olarak veritabanından çekilir.
- **Teknik Detay:**
  - Sayfa "async Server Component" (`force-dynamic`) yapısındadır.
  - Client-side data fetching (`useEffect`) yerine, doğrudan sunucuda `supabase.from('courses')` sorgusu çalıştırılır.
  - Bu sayede SEO performansı artırılmış ve sayfa yüklenmeden önce verinin hazır olması sağlanmıştır.
  - Sadece `status: published` ve `visibility: public` olan kurslar listelenir.

## 10. Sürükle-Bırak Kurs Sıralama (Drag & Drop Course Reordering)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Yöneticiler, `/admin/courses` sayfasında kursların görüntülenme sırasını sürükleyip bırakarak değiştirebilirler.
- **Teknik Detay:**
  - **Kütüphane:** `@hello-pangea/dnd` kullanılarak global kurs sıralaması yönetilir.
  - **Veritabanı Kısıtlaması (Constraint Fix):** Supabase `upsert` işlemi, eğer satır güncellemesi yapacaksa bile veritabanı şemasındaki `NOT NULL` alanların (title, slug vb.) eksik olmasına izin vermiyordu. Bu durum, sadece `{id, position}` gönderildiğinde "Failed to save order" hatasına yol açıyordu.
  - **Fix:** `CourseService.updateCoursePositions` metodu artık tüm `Course` objesini kabul ediyor. Güncelleme sırasında mevcut kurs verisinin tamamı payload'a eklenerek şema doğrulama hatası (schema validation error) giderildi.

## 11. Ders Kaydetme ve Auth Hatası Giderimi (Admin/Course Builder)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Course Builder (Ders Düzenleyici) ekranında yeni ders eklerken veya güncellerken alınan "You must be logged in to save a lesson" hatası giderildi.
- **Teknik Detay:**
  - **Sorun:** `src/lib/supabase.ts` dosyasındaki default Supabase istemcisi, basic `createClient` kullanıyordu. Bu istemci, Next.js App Router'ın cookie tabanlı oturum yönetimi ile senkronize olamıyordu, dolayısıyla tarayıcıda kullanıcı giriş yapmış olsa bile servis katmanında oturum "null" görünüyordu.
  - **Çözüm:** `src/lib/supabase.ts` güncellenerek hibrit bir yapıya geçildi. Tarayıcı ortamında (client-side), `@supabase/ssr` paketinin `createBrowserClient` metodu kullanılarak oturum state'inin (cookies) otomatik taşınması sağlandı. Sunucu tarafında (Node.js) ise standart `createClient` davranışı korundu.
  - **Etki:** `LessonService` ve diğer istemci tarafı servisleri artık kullanıcının aktif oturumunu doğru şekilde algılayabiliyor ve RLS kurallarına uygun işlem yapabiliyor.

## 12. Gelişmiş Video Oynatıcı Kararlılığı ve Vimeo Entegrasyonu

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Ders içeriklerindeki Vimeo videolarının yüklenmemesi ve hata vermesi sorunu kalıcı olarak çözüldü. Artık tüm Vimeo videoları, özel ve gelişmiş bir oynatıcı altyapısı ile hatasız çalışıyor.
- **Teknik Detay:**
  - **Sorun:** `react-player` kütüphanesinin Vimeo modülünü yüklerken yaşadığı "chunk loading" hatası nedeniyle, oynatıcı `<iframe>` yerine işlevsiz bir `<video>` etiketine düşüyordu (Fallback issue). Bu durum konsolda "Unknown event handler property" hatalarına neden oluyordu.
  - **Çözüm (Hybrid Player):** `VideoPlayer` bileşeni yeniden mimarilendirildi. Vimeo videoları algılandığında (`isVimeo`), `react-player` yerine doğrudan `vimeo-video-element` (Web Component Wrapper) kullanılıyor. Bu sayede "lazy loading" kırılganlığı ortadan kaldırıldı.
  - **URL Temizliği:** `player.vimeo.com/video/ID` ve `vimeo.com/ID?fl=...` gibi farklı formatlardaki URL'ler, oynatıcıya verilmeden önce temizlenip standart formata (`vimeo.com/ID`) dönüştürülüyor.
  - **Build Fix:** Bileşen içindeki hook kullanım sıralaması ve export syntax'ı düzeltilerek Next.js build hatası giderildi.
