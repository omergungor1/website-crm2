# Roadmap Kit — Entegrasyon Promptu

Bu klasör, bağımsız bir **Roadmap canvas** özelliğinin taşınabilir kopyasıdır.
Başka bir Next.js + Supabase projesine entegre ederken aşağıdaki talimatları izle (veya bu dosyayı AI agent’a prompt olarak ver).

---

## Amaç

Kullanıcının sürükle-bırak node’lar, annotation’lar (başlık, metin, not, görsel, video, checkbox, çerçeve, çizgi/ok), bağlantılar, zoom/pan, çoklu seçim, hizalama, snapshot ve revision history içeren bir roadmap editörü kurmak.

**Kapsam dışı:** CRM site-todo, blueprint, copyfast vb. Bu kit yalnızca roadmap.

---

## Klasör yapısı

```
export/roadmap-kit/
├── INTEGRATION_PROMPT.md          ← bu dosya
├── adapters/HOST_ADAPTERS.example.js
├── sql/001_roadmap_migration.sql
├── components/roadmap/            ← UI
├── lib/roadmap/                   ← domain + capture/snapshot/revision
└── app/
    ├── (dashboard)/dashboard/roadmap/page.js
    └── api/
        ├── roadmap/               ← kullanıcı (admin) roadmap
        ├── projects/[id]/roadmap/ ← proje roadmap (opsiyonel)
        ├── image-proxy/           ← snapshot’ta harici görseller
        └── upload/public/         ← görsel komponenti upload
```

---

## Bağımlılıklar (npm)

```bash
npm install nanoid html-to-image
```

Host projede zaten olmalı / kurulmalı:

- Next.js App Router (client components destekli)
- Tailwind CSS
- `@supabase/supabase-js` (+ tercihen `@supabase/ssr`)
- Path alias `@/` → proje kökü (`jsconfig` / `tsconfig`)

> Bu kod tabanı **JavaScript** (`.js`) kullanır. TypeScript projeye taşırken dosya uzantılarını `.jsx` / `.ts` yapabilirsin; mantığı değiştirme.

---

## Host uygulamanın sağlaması gerekenler

Roadmap API’leri şu import’lara bağlıdır — hedef projede aynı path veya re-export oluştur:

| Import | Beklenen davranış |
|--------|-------------------|
| `@/lib/supabase/server` → `createClient` | Cookie’li server Supabase client |
| `@/lib/supabase/admin` → `createAdminClient` | Service role client (storage upload) |
| `@/lib/isAdmin` → `getCurrentUser` | `{ user, admin }` döner |

Örnek stub: `adapters/HOST_ADAPTERS.example.js`

**Env:**

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # client auth için
```

---

## Kurulum adımları

### 1) SQL

Supabase SQL Editor’de çalıştır:

`sql/001_roadmap_migration.sql`

Tablolar:

- `user_roadmaps` — kişisel / admin canvas
- `project_roadmaps` — proje canvas (**`projects` tablosu gerekir**; yoksa bu tabloyu ve `app/api/projects/.../roadmap` route’larını atla)
- `roadmap_snapshots`
- `roadmap_revisions`
- `roadmap_daily_backups`
- Storage: `crm-roadmap-snapshots`, `crm-uploads`

### 2) Dosyaları kopyala

Hedef projeye birebir kopyala (path’leri koru):

- `components/roadmap/**`
- `lib/roadmap/**`
- `app/(dashboard)/dashboard/roadmap/page.js` (route grubunu kendi layout’una göre uyarla)
- `app/api/roadmap/**`
- `app/api/image-proxy/**`
- `app/api/upload/public/**`

Proje bazlı roadmap istiyorsan ayrıca:

- `app/api/projects/[id]/roadmap/**`

### 3) Sayfa / navigasyon

Minimal kullanım:

```jsx
import RoadmapShell from "@/components/roadmap/RoadmapShell";

export default function RoadmapPage() {
  return (
    <div className="fixed inset-0">
      <RoadmapShell />
    </div>
  );
}
```

Props:

| Prop | Açıklama |
|------|----------|
| `projectId` | Verilirse `/api/projects/:id/roadmap` kullanılır |
| `projectName` | Header’da gösterilir |
| `onBack` | Geri butonu callback |

Kullanıcı roadmap’i: `<RoadmapShell />`  
Proje roadmap’i: `<RoadmapShell projectId={id} projectName={name} onBack={...} />`

### 4) Header linki (isteğe bağlı)

```jsx
<Link href="/dashboard/roadmap">RoadMap</Link>
```

### 5) Opsiyonel parçalar

| Dosya | Ne zaman atla |
|-------|----------------|
| `RoadmapAddTodoModal.js` | Proje todo API’n yoksa — Shell içinde `projectId` ile “Todo” butonu zaten koşullu |
| `app/api/projects/...` | Sadece kullanıcı roadmap’i istiyorsan |

---

## API özeti

| Method | Path | İş |
|--------|------|-----|
| GET/PUT | `/api/roadmap` | Kullanıcı canvas oku/kaydet |
| GET/POST | `/api/roadmap/snapshots` | Snapshot listele / yükle |
| DELETE | `/api/roadmap/snapshots/:id` | Snapshot sil |
| GET | `/api/roadmap/revisions` | Geçmiş + restore |
| * | `/api/projects/:id/roadmap…` | Aynı işlemler, proje scope |
| POST | `/api/upload/public` | Görsel upload → `crm-uploads` |
| GET | `/api/image-proxy?url=` | Snapshot için harici görsel proxy |

Canvas PUT otomatik revision backup yapar (`revisionsServer`).

---

## Özellik listesi (UI)

- Node tipleri: kare, dikdörtgen, yuvarlatılmış, daire, elips, yan kare
- Annotation: başlık (+ alt çizgi), metin, not, onay kutusu, görsel, video (YouTube), çerçeve, çizgi, ok
- Bağlantı: node anchor `+` ile edge; çoklu seçiliyse toplu join
- ⌘S kaydet, ⌘D çoğalt, Delete sil
- ⌘/Ctrl + sürükleyerek alan seçimi (marquee)
- Hizalama menüsü (2+ seçim)
- Not/görsel/video: sağ alt resize tutamacı
- Snapshot (tam canvas PNG) + indir + viewer fit-to-screen
- Revision geçmişi + günlük backup

---

## canvas_data şeması

```json
{
  "viewport": { "scrollX": 0, "scrollY": 0 },
  "nodes": [
    {
      "id": "...",
      "type": "rounded",
      "title": "",
      "description": "",
      "color": "#6366f1",
      "imageUrl": "",
      "x": 0, "y": 0, "width": 210, "height": 96
    }
  ],
  "edges": [
    {
      "id": "...",
      "fromNodeId": "...",
      "fromAnchor": "right",
      "toNodeId": "...",
      "toAnchor": "left"
    }
  ],
  "annotations": []
}
```

Normalize: `lib/roadmap/utils.js` → `normalizeCanvasData`.

---

## Agent’a verilecek kısa prompt

Aşağıdaki bloğu hedef proje chat’ine yapıştırabilirsin:

```
Bu repoya export/roadmap-kit klasöründeki Roadmap özelliğini entegre et.

1. sql/001_roadmap_migration.sql dosyasını Supabase'te çalıştıracağımı varsay; kod tarafını hazırla.
2. components/roadmap, lib/roadmap ve ilgili app/api route'larını proje path alias (@/) ile kopyala.
3. Host'ta @/lib/supabase/server, @/lib/supabase/admin, @/lib/isAdmin (getCurrentUser) mevcut olmalı; yoksa oluştur.
4. npm: nanoid, html-to-image.
5. /dashboard/roadmap sayfasında <RoadmapShell /> render et.
6. Proje roadmap gerekmiyorsa app/api/projects/.../roadmap ve project_roadmaps bağımlılıklarını atla.
7. TypeScript kullanma; mevcut .js stilini koru.
8. Sadece roadmap olsun — site todo / blueprint / copyfast ekleme.
```

---

## Bilinen kısıtlar

- Snapshot büyük canvas (6000×4500); CORS’lu harici görseller proxy ile inline edilir, başarısız olursa thumbnail eksik kalabilir.
- `project_roadmaps` FK → `public.projects`; host şeması farklıysa FK’yi uyarla.
- Storage policy’ler örnek seviyede açık; production’da sıkılaştır.
- Orijinal projede `snapshotsServer` `logoGenerationsServer` kullanıyordu; bu kitte `lib/roadmap/snapshotsServer.js` self-contained hale getirildi.

---

## Doğrulama checklist

- [ ] Migration uygulandı, tablolar görünüyor  
- [ ] Bucket’lar: `crm-roadmap-snapshots`, `crm-uploads`  
- [ ] `/dashboard/roadmap` açılıyor, toolbox görünüyor  
- [ ] Node ekle → otomatik kayıt (Kaydedildi)  
- [ ] Görsel upload / YouTube video  
- [ ] Snapshot al → liste → indir  
- [ ] Geçmiş’ten restore  
- [ ] Hard refresh sonrası canvas korunuyor  
