# سِنمار — موقع المنيو والعروض والولاء (Demo Website)

> **منيوك، عروضك، ومكافآتك في مكان واحد**

**موقع ويب** (Responsive Website) لمطعم **سِنمار – بريدة**: يعمل على الجوال والتابلت والكمبيوتر من المتصفح مباشرة — بدون تحميل أي تطبيق.
يشمل منيو QR، وتجربة 3D للوجبات، واقتراحات Upselling، وسلة، وبرنامج ولاء رقمي.
هذا ليس مجرد منيو إلكتروني، بل نظام يساعد المطعم على:

- 🔁 **زيادة عودة العملاء**: بطاقة ولاء، كل 5 طلبات = مكافأة
- 📈 **رفع متوسط قيمة الطلب**: "أكمل وجبتك؟" + ترقية لوجبة بعد كل إضافة
- 🔥 **إبراز العروض**: عروض اليوم مع عدّاد وقت، وعروض حصرية للأعضاء
- 🧊 **تجربة 3D**: تدوير وتكبير ومشاهدة من عدة زوايا، وAR على الطاولة
- 📱 **يعمل من QR بدون تطبيق**: على الطاولات، وعند الكاشير، وعلى التغليف، وعلى الملصقات

> ⚠️ كل الأسماء والأسعار والعروض **تجريبية**. لا يوجد دفع حقيقي، ولا قاعدة بيانات، ولا تسجيل دخول.

## التشغيل

```bash
npm install
npm run dev          # http://localhost:5173  (افتحه من الجوال على نفس الشبكة عبر عنوان Network)
npm run build        # نسخة إنتاج في dist/ — ارفعها على أي استضافة ثابتة (Netlify / Vercel / GitHub Pages)
npm run preview      # معاينة نسخة الإنتاج
npm run test:e2e     # اختبارات Playwright لكامل رحلة العميل (أول مرة: npx playwright install chromium)
```

**للعرض على المدير:** افتح الموقع على لابتوب — يظهر كموقع كامل (قائمة تنقل علوية، أقسام، تذييل). في أسفل الموقع وفي صفحة "منيو QR" رمز QR حقيقي
يمسحه المدير بجواله فيفتح نفس الموقع بتصميم الجوال مع رقم الطاولة (`?table=7`). وزر **"للمدير"** أعلى الشاشة يشرح القيمة ويعرض أرقام التجربة مباشرة (متوسط الطلب، وأثر الاقتراحات، ونقاط الولاء)،
وفيه زر **إعادة ضبط العرض** للبدء من جديد (بطاقة الولاء على 3/5).

## رحلة العميل

`QR → الرئيسية → المنيو → المنتج → 3D → إضافة للسلة → Upselling → السلة → تأكيد الطلب → +1 نقطة → برنامج الولاء → المكافأة بعد 5 طلبات`

## أين أضع ملفات Blender / GLB؟

- ملفات GLB: **`public/models/`** (مثلًا `public/models/burger.glb`؛ استبدل الملف بنفس الاسم ويعمل فورًا)
- ملفات `.blend` الأصلية: **`blender/source/`**
- التسجيل: `src/config/models.ts`، والربط بالمنتج: `src/data/menu.ts`
- التفاصيل وإرشادات الأداء: [`blender/README.md`](blender/README.md)

## التقنية والبنية

React 19 + TypeScript + Tailwind CSS v4 + Vite · 3D عبر `@google/model-viewer` (three.js، يُحمّل عند الحاجة فقط) · LocalStorage

```
src/
  config/      restaurant.ts (الإعدادات، هدف الولاء)، models.ts (سجل نماذج 3D)
  data/        menu.ts, offers.ts, upsell.ts   ← بيانات Demo + قواعد الاقتراحات
  services/    menuService, orderService, loyaltyService, analyticsService, storage
               ← الطبقة الوحيدة التي تُستبدل بـ API عند إضافة Backend
  store/       CartContext, LoyaltyContext, UIContext
  components/  layout (Header, Footer, Container) / product / three / cart / loyalty / offers / qr / manager / ui
  pages/       Home, Menu, Offers, Loyalty, Cart, Scan
blender/       سكربت بناء النماذج + مكان ملفات .blend
public/models  ملفات GLB    public/images/products  صور المنتجات (من Blender)
tests/e2e      اختبارات Playwright
```

**إضافة Backend لاحقًا:** الواجهة لا تعتمد إلا على دوال `src/services/*`. استبدل محتواها بـ `fetch('/api/...')`
(الطلبات إلى POS، والولاء مربوط برقم الجوال عبر OTP، والمنيو من لوحة تحكم) دون تغيير المكوّنات.
