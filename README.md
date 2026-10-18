# Akış

Görevlerini, notlarını ve alışkanlıklarını tek yerde tuttuğun kişisel planlama uygulaması.

## Çalıştırma

```bash
npm install      # ilk seferde
npm run dev      # http://localhost:5180
```

Yayına hazır sürüm için `npm run build`. Çıktı `dist/` klasörüne yazılır ve herhangi bir statik barındırmada çalışır. Barındırma, tüm yolları `index.html`'e yönlendirmeli (SPA ayarı).

## Ekranlar

- **Bugün**: bugünün ve geciken görevlerin, günlük alışkanlıklar, günün ilerleme halkası
- **Pano**: Yapılacak / Devam ediyor / Tamamlandı; kartları sürükleyerek ilerlet
- **Takvim**: görevleri günler arasında sürükleyerek yeniden planla
- **Alışkanlıklar**: haftalık işaretleme, seriler, 12 haftalık ısı haritası
- **İlerleme**: tamamlanan görev grafikleri, seri, etiket ve öncelik dağılımı
- **Sayfalar**: iç içe sayfalar, `/` menülü blok editör, sayfaya bağlı görev panosu

`Ctrl + K` her yerden arama ve hızlı ekleme açar.

## Veriler

Her şey tarayıcının `localStorage` alanında durur; sunucu ya da hesap yok. Başka bir cihaza geçmek veya yedek almak için **Ayarlar → Yedeği indir / Yedekten geri yükle**.

## Veritabanı modu (iki kişilik)

`VITE_SUPABASE_URL` ve `VITE_SUPABASE_KEY` tanımlıysa uygulama Supabase'e bağlanır:
girişte İlhan / Sedef seçilir, şifreyle girilir; her kişinin kendi alanı ve bir Ortak alan vardır,
değişiklikler diğer kişinin ekranına anında düşer. Tanımlı değilse her şey eskisi gibi tarayıcıda kalır.

1. Supabase'de proje aç, SQL Editor'da `supabase/schema.sql` dosyasını çalıştır.
2. Authentication → Users → Add user ile `ilhan@akis-planla.netlify.app` ve `sedef@akis-planla.netlify.app`
   kullanıcılarını şifreleriyle oluştur ("Auto Confirm User" işaretli). Sign ups'ı kapat.
3. Netlify → Environment variables: `VITE_SUPABASE_URL` (Project URL) ve `VITE_SUPABASE_KEY` (publishable key), sonra yeniden yayınla.
   Yerelde aynı değerleri `.env.local` dosyasına yaz.

## İleride mobil uygulama için

Kod, bir gün mobil uygulamaya (React Native ya da Capacitor) taşınabilecek şekilde ayrıldı:

- `src/types.ts`, `src/store/`, `src/lib/` arayüzden bağımsızdır; iş kuralları (görev durumu, ilerleme geçmişi, "alışkanlık yalnızca bugün işaretlenir" kuralı) burada.
- Verinin nerede saklanacağı tek bir dosyada: `src/lib/storage.ts`. Mobilde yalnızca bu satır değişir.
- Yedeklemenin veri kısmı `src/lib/backup.ts`, tarayıcıya özgü dosya indirme/okuma kısmı `src/lib/backupWeb.ts`.
- Web'e özgü olan yalnızca `src/components/` ve `src/views/`.

## Teknik

React 19, Vite, TypeScript, Tailwind CSS 4, zustand (kalıcılık), dnd-kit (sürükle-bırak), BlockNote (editör), Recharts (grafikler), date-fns.
