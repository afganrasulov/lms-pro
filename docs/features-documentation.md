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

## 13. Polar Lisans Anahtarı Entegrasyonu (License Key Gating & SaaS)

- **Durum:** ✅ Çalışıyor
- **Açıklama:**
  - **Öğrenciler İçin:** Kurs içeriklerini görüntülemek için geçerli bir Polar.sh lisans anahtarı gerekir.
  - **Eğitmenler İçin (SaaS):** Kendi Polar organizasyonlarına ait API anahtarlarını sisteme kaydederek, kendi lisanslarını LMS üzerinden satabilir ve doğrulayabilirler.
- **Teknik Detay:**
  - **SDK Güncellemesi (v0.42.2):** Polar SDK'sındaki yapısal değişiklik nedeniyle `client.users.licenseKeys.validate` yerine doğrudan `client.licenseKeys.validate` kullanımı zorunludur. Ayrıca doğruluğu sağlamak için `organizationId` parametresi zorunlu hale getirilmiştir.
  - **Veritabanı Şeması:** `profiles` tablosuna eksik olan `license_key` (text) ve `license_status` (text, default: 'inactive') kolonları eklenerek veri kalıcılığı sağlandı.
  - **SaaS "Strict" Doğrulama:** `verifyLicense` aksiyonu bir lisans anahtarı geldiğinde **SADECE** entegrasyon yapmış eğitmenlerin hesaplarını kontrol eder.
    1. **Platform Seviyesi (Devre Dışı):** Varsayılan platform token (`POLAR_SANDBOX_TOKEN`) kontrolü güvenlik ve iş modeli gereği devre dışı bırakılmıştır.
    2. **Connected Org Seviyesi:** Sadece veritabanında `organizations` tablosuna kayıtlı ve token almış eğitmenlerin anahtarları kabul edilir.
  - **Kritik Fix (Schema Cache):** Yeni eklenen kolonların API tarafında görünmemesi (`PGRST204` hatası) durumunda veritabanı şema cache'inin yenilenmesi (`NOTIFY pgrst, 'reload schema'`) gerektiği dökümante edilmiştir.
  - **Erişim Kontrolü (Gating):** `/courses/[slug]/learn` sayfasında (Course Player), kullanıcının `license_status` değeri kontrol edilir. Eğer aktif değilse, içerik yerine engelleyici bir "Lisans Anahtarı Gerekli" ekranı gösterilir.

## 14. Ayarlar Sayfası Revizyonu ve İyileştirmeler (Settings Overhaul)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Kullanıcı Ayarları sayfası, eğitmen ve öğrenciler için kritik özelliklerle (E-posta değiştirme, Lisans yönetimi, Polar bağlantısı koparma) güçlendirildi ve stabilize edildi.
- **Teknik Detay ve Çözülen Problemler:**
  - **Lisans Kalıcılığı (Persistence Bug):** Sayfa yenilendiğinde lisans anahtarının kaybolması sorunu tespit edildi. `SettingsService.getSettings` metodu, sadece `user_settings` tablosuna bakıyordu. Çözüm olarak servis, `profiles` tablosundan `license_key` verisini veritabanından join benzeri mantıkla çekecek şekilde güncellendi.
  - **Build Hataları (Strict Types):** Next.js build sürecinde `Supabase Admin` istemcisinin tip uyumsuzlukları ve `jsrsasign` kütüphanesinin tip eksiklikleri (missing types) giderildi. Kritik yerlerde güvenli `any` cast'leri ve doğru import (`getSupabaseAdmin`) stratejisi uygulandı.
  - **Polar Disconnect:** Kullanıcıların yanlışlıkla organizasyon bağlantısını koparmaması için `disconnectOrganizationPolar` aksiyonuna frontend tarafında "Onay Penceresi" (Confirm Dialog) eklendi.
  - **E-posta Değiştirme:** Supabase `updateUser` metodu entegre edilerek güvenli e-posta değişikliği ve doğrulama akışı sağlandı.
  - **Zoom SDK:** `ZoomMtg.join` metodundaki `userName` parametresinin boş gelmesi durumunda oluşan build hatası, varsayılan değer ("Participant") atanarak çözüldü.

## 15. Polar Abonelik Senkronizasyonu (Cancellation/Revocation Sync)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** Polar.sh üzerinden bir öğrencinin aboneliği iptal edildiğinde (Cancel) veya yetkisi alındığında (Revoke), LMS tarafındaki lisansı otomatik olarak devre dışı bırakılır.
- **Teknik Detay:**
  - **Webhook:** `/api/webhooks/polar` rotasına `subscription.canceled` ve `subscription.revoked` eventleri dinlenir.
  - **Kullanıcı Eşleştirme:** Webhook payload'undan gelen `customer_email`, Supabase Auth Admin API üzerinden sorgulanarak ilgili `user_id` bulunur.
  - **Kısıtlama:** Eşleşen kullanıcı bulunduğunda `profiles` tablosundaki `license_key` silinir (NULL) ve `license_status` 'inactive' yapılır.
  - **Güvenlik:** İşlem `supabaseAdmin` (Service Role) yetkisiyle gerçekleşir, böylece RLS kısıtlamalarına takılmaz.
  - **Kritik Fix (Signature Validation):** Polar SDK'sının (`validateWebhook`) katı şema kontrolü nedeniyle bazı geçerli webhook isteklerinin ("Internal server error" değil, "Invalid signature/schema") reddedildiği tespit edildi.
    - **Çözüm (Manual Fallback):** `route.ts` dosyasına SDK doğrulaması başarısız olduğunda devreye giren bir **Manuel İmza Doğrulama** (Manual Signature Verification) katmanı eklendi.

## 16. Dinamik İçerik ve Ders Versiyonlama (Course Player Realtime Updates)

- **Durum:** ✅ Çalışıyor
- **Açıklama:** `/learn` sayfasında (Course Player) başlık, ders içeriği (markdown) veya video URL'si admin panelinden değiştirildiğinde, öğrenci tarafında sayfa yenilemeye gerek kalmadan anlık olarak güncellenir.
- **Teknik Detay:**
- **Realtime Subscriptions:** `useCoursePlayer` hook'u artık `courses`, `modules`, `lessons` ve `lesson_contents` tablolarını dinler. Özellikle `lesson_contents` tablosundaki güncellemeler, verinin tamamını yeniden çekmek yerine ilgili dersin durumunu lokal olarak günceller.
- **Kritik Fix (Content Versioning):** Veritabanında her içerik güncellemesi yeni bir `lesson_contents` satırı oluşturur (History Pattern).
  - **Sorun:** Frontend kodu daha önce `lesson_contents[0]` ile rastgele (veya varsayılan sıralamaya göre) bir içerik seçiyordu. Bu durum, admin panelinde güncelleme yapılsa bile öğrencinin eski bir videoyu (ör. "Train arriving") görmesine neden oluyordu.
  - **Çözüm:** `activeLesson` içinden içerik seçilirken artık **`is_current_version: true`** olan kayıt filtreleniyor.
  - **Defensive Sorting:** Ayrıca `loadData` fonksiyonunda içerikler `is_current_version` (true önce gelir) mantığıyla sıralanarak, kodun fallback durumunda bile en güncel veriye ulaşması garanti altına alındı.
