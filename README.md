# AXION

AXION — Counter-Strike 2 va VALORANT turnirlarini boshqarish uchun Next.js platformasi. O‘zbek va ingliz tillari mavjud. Jamoalar turnirga yoziladi. Tashkilotchi turnir ochadi, turnir to‘rini ishga tushiradi va hisoblarni kiritadi. G‘olib keyingi raundga avtomatik o‘tadi.

## Mahalliy ishga tushirish

Node.js 22 yoki yangiroq versiyasi kerak.

```sh
npm ci
npm run dev
```

Sayt [localhost:3000](http://localhost:3000) manzilida ochiladi. Sozlamalarsiz sayt demo ma’lumotlarini ko‘rsatadi va o‘zgarishlarni shu brauzerda saqlaydi.

```sh
npm run typecheck
npm run build
npm start
```

## Sahifalar

| Manzil | Vazifa |
| --- | --- |
| `/` | Scroll bilan boshqariladigan CS2 va VALORANT video sahnalari |
| `/turnirlar` | O‘yin, holat va nom bo‘yicha qidirish, jamoani ro‘yxatdan o‘tkazish va natijalarni ko‘rish |
| `/boshqaruv` | Turnir ochish, jamoalarni ko‘rish, turnirni boshlash va natija kiritish |

## Vercel

GitHub’dagi `cyberuz001/AXION` repozitoriysini Vercel’ga import qiling. Framework preset sifatida **Next.js**, production branch sifatida **main** ishlatiladi.

Umumiy turnir ma’lumotlari uchun **private Vercel Blob** omborini loyihaga ulang. Vercel’ning **Environment Variables** bo‘limida quyidagi qiymatlar ishlatiladi.

| Nom | Qiymat |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Private Blob ombori ulanganda Vercel yaratadigan token |
| `AXION_ADMIN_PASSWORD` | Tashkilotchi paroli, kamida 16 belgi |
| `AXION_SESSION_SECRET` | Tasodifiy sessiya kaliti, kamida 32 belgi |

Qiymatlarni kiritgach, Vercel’da qayta deploy qiling. Umumiy rejimda turnirlar ro‘yxati bo‘sh boshlanadi. Tashkilotchi `/boshqaruv` orqali kirib birinchi turnirni ochadi.

## Animatsiya va media

- [React Bits](https://reactbits.dev/) manbasidan Blur Text, Dot Grid va Scroll Reveal ishlatilgan. Litsenziya komponentlar papkasida.
- CS2 va VALORANT sahnalarida AXION uchun yaratilgan original personajlar va video montajlar ishlatilgan. Har klip uchta rakurs, kamera siljishi va yorug‘lik o‘tishlaridan tuzilgan.
- Scroll video kadrini boshqaradi. Video boshqaruvi bilan klipni mustaqil ijro etish mumkin. Tizimda kamaytirilgan harakat tanlanganda scroll animatsiyasi o‘chadi.
- AXION — mustaqil hamjamiyat loyihasi.

Kliplarni qayta yig‘ish uchun Python, NumPy, OpenCV va FFmpeg kerak.

```sh
python scripts/compose-films.py cs2 scripts/media-source/cs2.jpg
python scripts/compose-films.py valorant scripts/media-source/valorant.jpg
```
