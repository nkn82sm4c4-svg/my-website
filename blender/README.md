# 🧊 Blender → 3D models (GLB)

## أين أضع الملفات؟

| ماذا | أين |
|---|---|
| ملفات Blender الأصلية (`.blend`) | `blender/source/` |
| سكربت بناء النماذج الإجرائي | `blender/scripts/build_models.py` |
| **ملفات GLB التي يستخدمها الموقع** | **`public/models/<name>.glb`** |
| صور المنتجات (Poster) | `public/images/products/<name>.webp` |
| ربط النموذج بالموقع | `src/config/models.ts` |
| ربط المنتج بالنموذج | `src/data/menu.ts` → `model: 'burger'` |

## استبدال نموذج بنموذج حقيقي من Blender

1. صمّم أو صوّر المنتج (Photogrammetry) في Blender واحفظ الأصل في `blender/source/burger.blend`.
2. `File → Export → glTF 2.0` واختر:
   - Format: **glTF Binary (.glb)**
   - Include: Selected Objects
   - Transform: **+Y Up**
   - Mesh: Apply Modifiers ✓
   - Compression: Draco ✓ (اختياري — يصغّر الملف جدًا)
3. احفظه باسم نفس المفتاح: `public/models/burger.glb` (يستبدل الحالي، ولا يلزم أي تعديل في الكود).
4. لنموذج جديد: أضف مفتاحًا في `src/config/models.ts` و`ModelKey` في `src/types/index.ts`، ثم اربطه بالمنتج في `src/data/menu.ts`.

## إرشادات أداء الجوال

- **Low/Medium poly**: من 5 إلى 25 ألف مثلث لكل منتج (استخدم Decimate).
- **Textures**: 1024px كحد أقصى، JPG/WebP، ويفضل ضغط KTX2.
- **الحجم**: أقل من 1.5 ميغابايت لكل GLB (النماذج الحالية بين 50 و450 كيلوبايت).
- **المقياس الحقيقي بالمتر**: البرجر ≈ 0.12 م، ليظهر بالحجم الصحيح في وضع AR.
- ضع أصل النموذج (Origin) في منتصف القاعدة (Z = 0).
- ضغط اختياري: `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp`

## إعادة بناء النماذج الحالية

النماذج العشرة الحالية (برجر، دبل برجر، بطاطس، مشروب، صوص، شاورما، صاروخ، بيتزا، فطيرة، سنمارية) مبنية **بالكامل بالكود داخل Blender**
باستخدام geometry إجرائي و vertex colors (بدون أي texture) لتبقى الملفات صغيرة جدًا.

```bash
# مع Blender مثبت
blender -b -P blender/scripts/build_models.py

# أو باستخدام وحدة bpy في Python (3.11)
pip install bpy pillow
python blender/scripts/build_models.py                 # كل النماذج + الصور
python blender/scripts/build_models.py --only burger   # نموذج واحد
python blender/scripts/build_models.py --no-render     # GLB فقط بدون صور
```

السكربت يصدّر GLB ويصوّر أيضًا صورة شفافة لكل منتج (Cycles) تُستخدم في البطاقات وكـ poster أثناء تحميل الـ3D،
بالإضافة إلى صور العروض المجمّعة (combo-meal, family-box, double-deal).
