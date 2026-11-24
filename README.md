# AXION

AXION — Counter-Strike 2 va VALORANT turnirlarini boshqarish uchun Next.js platformasi. O‘zbek va ingliz tillari hamda yorug‘ va qorong‘i rejimlar mavjud. Jamoalar turnirga yoziladi. Tashkilotchi turnirni yaratadi, tahrirlaydi, o‘chiradi, turnir to‘rini ishga tushiradi va hisoblarni kiritadi. G‘olib keyingi raundga avtomatik o‘tadi.

[Jonli platforma](https://axion-ecru.vercel.app/) · [Ochiq repozitoriy](https://github.com/cyberuz001/AXION)

Interfeys React va Next.js App Router’da ishlaydi. Next.js Route Handler’lari jamoa va turnir amallarini bajaradi. Umumiy rejimda turnirlar Vercel Blob’da saqlanadi.

## Mahalliy ishga tushirish

Node.js 22 yoki yangiroq versiyasi kerak.

```sh
npm ci
npm run dev
```

Sayt [localhost:3000](http://localhost:3000) manzilida ochiladi. Sozlamalarsiz sayt demo ma’lumotlarini ko‘rsatadi va o‘zgarishlarni shu brauzerda saqlaydi.

```sh
node --test tests/*.test.mjs
npm run build
npm run typecheck
npm start
```

## Sahifalar

| Manzil | Vazifa |
| --- | --- |
| `/` | Besh CS2 personaji va VALORANT uchun scroll bilan boshqariladigan video sahnalar |
| `/cs2` | CS2 personaji kameraga buriladigan alohida scroll videosi |
| `/turnirlar` | O‘yin, holat va nom bo‘yicha qidirish, jamoani ro‘yxatdan o‘tkazish va natijalarni ko‘rish |
| `/boshqaruv` | Turnir ochish, tahrirlash, o‘chirish, jamoalarni ko‘rish va natija kiritish |

## Ro‘yxatdan o‘tish qoidasi

Bir turnirda jamoa nomi takrorlanmaydi. Qoida nomning bo‘shliqlari, harf kattaligi va Unicode yozilishidagi farqlarni hisobga oladi. Qabul va rad holatlarini birga tekshirish uchun `node --test tests/registration.test.mjs` buyrug‘ini ishlating. Sinov AXION biznes mantiqini chaqiradi va sun’iy turnir holatidan foydalanadi.

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

- [React Bits](https://reactbits.dev/) manbasidan Blur Text, Dot Grid, Scroll Reveal, Fade Content, Glare Hover va Star Border ishlatilgan. Litsenziya komponentlar papkasida.
- CS2’ning ikkala klipi loyiha egasi taqdim etgan Google Flow videolaridan olingan. VALORANT klipi AXION uchun tayyorlangan.
- Scroll videoning kadri va sahnadagi o‘rnini boshqaradi. Mobil qurilmalarda turnir nomlari, Toshkent vaqti va jamoalari ko‘rsatiladigan ixcham jadval ochiladi. Kamaytirilgan harakat tanlanganda video va scroll effektlari statik ko‘rinishga o‘tadi.
- AXION — mustaqil hamjamiyat loyihasi.

VALORANT klipini qayta yig‘ish uchun Python, NumPy, OpenCV va FFmpeg kerak.

```sh
python scripts/compose-films.py valorant scripts/media-source/valorant.jpg
```
