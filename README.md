# eSIMMongolia – Netlify + QPay (Final)

## 1) Netlify Environment Variables
Netlify → Site settings → Environment variables:

- QPAY_USERNAME = (QPay-ээс өгсөн username/client_id)
- QPAY_PASSWORD = (QPay-ээс өгсөн password)
- QPAY_INVOICE_CODE = ESIM_MGL_INVOICE
- SITE_URL = https://esimmongolia.com  (эсвэл таны netlify домэйн)

## 2) Deploy хийх хамгийн найдвартай арга
### Арга A (Зөвлөмж): GitHub-р deploy
1) Энэ файлуудаа repo-д push хийнэ.
2) Netlify → Add new site → Import from Git → repo сонгоно.
3) Deploy хийнэ.

### Арга B: Netlify CLI
1) `npm i -g netlify-cli`
2) `netlify login`
3) энэ folder дээр:
   - `netlify deploy`
   - асуудалгүй бол: `netlify deploy --prod`

> Drag&Drop (manual deploy) нь functions-ийг заримдаа зөв deploy хийхгүй тохиолдол байдаг.
> Тиймээс Git/CLI-г зөвлөж байна.

## 3) Хэрэглэгчийн урсгал
1) Улс/дата/хоног сонгоно → QPay-р төлөх
2) QPay нээж төлнө
3) Төлбөр шалгах
4) PAID бол WhatsApp/Page руу бичих товч гарна

## 4) Functions
- /.netlify/functions/qpay-create-invoice
- /.netlify/functions/qpay-check
- /.netlify/functions/qpay-callback
