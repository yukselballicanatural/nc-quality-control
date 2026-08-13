# Natural Clinic CRM — Tasarım Sistemi Dokümanı

Bu doküman, bu projede (`admin.html`, `team-leader.html`, `index.html`) kullanılan **Liquid Glass** (Apple macOS Sequoia / iOS 18 tarzı) tasarım dilini, renk sistemini, bileşen desenlerini ve etkileşim kurallarını birebir aynı şekilde başka bir projede yeniden üretebilmek için hazırlanmıştır.

Başka bir Claude Code oturumuna bu dosyayı verip "bu tasarım sistemini kullan, ama kendi sayfalarına uygula" diyebilirsin. Kod parçaları doğrudan kopyalanabilir; yalnızca proje-özgü class adları (örn. `.tl-card`, `.am-kpi`) ve içerik değişir.

---

## 1. Temel Felsefe

- **İki ayrı tema dosyası:** `liquid-glass.css` (açık tema) ve `liquid-glass-dark.css` (koyu tema). İkisi de `html[data-theme="light"]` / `html[data-theme="dark"]` seçicisiyle **yalnızca kendi temasında** çalışır, birbirine dokunmaz.
- **Taban HTML/CSS hiç değişmez.** Panellerin orijinal tasarımı (koyu, düz renkli) olduğu gibi kalır; Liquid Glass katmanı yalnızca CSS ile **üstüne binen bir tema dönüşümüdür**. Bu sayede tema anahtarı `dark`'a alınınca tarayıcı otomatik olarak eski/orijinal görünüme döner — hiçbir JS mantığı değişmez.
- **Cam efektinin çalışma şartı: arkada kırılacak canlı bir renk (mesh gradient) olması.** Zemin düz beyaz/siyah olursa `backdrop-filter: blur()` hiçbir şey göstermez, panel "donuk beyaz/siyah kart" gibi görünür. Bu yüzden `body`'ye çok katmanlı `radial-gradient` mesh arka plan veriliyor.
- **Metin renkleri temaya göre TERS mantıkla yaklaşılır:**
  - Açık temada: uygulamanın orijinal parlak/doygun renkleri (`#4ADE80`, `#F87171` vb.) camda okunmadığı için koyulaştırılmış eşdeğerlerine çevrilir.
  - Koyu temada: uygulamanın renkleri zaten koyu tema için tasarlanmıştı, hiç dokunulmaz — yalnızca **zeminler camlaşır**.

---

## 2. Renk Token Sistemi

### 2.1 Açık Tema Kökleri (`html[data-theme="light"]`)

```css
html[data-theme="light"] {
  /* Cam yüzeyler — düşük opaklık kritik, yoksa "beyaz kart" olur */
  --g-1: rgba(255, 255, 255, 0.40);   /* ana paneller (sidebar, modal, filtre kartı) */
  --g-2: rgba(255, 255, 255, 0.26);   /* iç/ikincil yüzeyler (kart içi kart) */
  --g-3: rgba(255, 255, 255, 0.58);   /* input, öne çıkan yüzey */
  --g-hover: rgba(255, 255, 255, 0.62);

  /* Kenar ışığı — Apple imzası: üstte parlak, altta soluk hairline */
  --edge: rgba(255, 255, 255, 0.55);
  --edge-soft: rgba(255, 255, 255, 0.32);

  /* Camın üst kenarında biriken ışık + iç çerçeve parlaması */
  --sheen: inset 0 1px 0 0 rgba(255, 255, 255, 0.85),
           inset 0 0 0 1px rgba(255, 255, 255, 0.20),
           inset 0 -1px 0 0 rgba(255, 255, 255, 0.12);

  /* Yumuşak, katmanlı gölge — sert/tek katmanlı gölge YOK */
  --sh-1: 0 2px 8px rgba(23, 43, 99, 0.06), 0 8px 28px rgba(23, 43, 99, 0.10);
  --sh-2: 0 4px 14px rgba(23, 43, 99, 0.08), 0 18px 50px -10px rgba(23, 43, 99, 0.18);
  --sh-3: 0 8px 24px rgba(23, 43, 99, 0.12), 0 32px 80px -16px rgba(23, 43, 99, 0.30);

  --blur: 30px;
  --sat: 190%;

  /* Metin — yüksek kontrast (donuk gri metin camda okunmaz) */
  --ink: #12141a;      /* başlıklar, ana metin */
  --ink-2: #4b5364;    /* ikincil metin */
  --ink-3: #7c8496;    /* etiket/placeholder */

  --accent: #0d9488;   /* marka turkuazı */
  --accent-2: #2563eb; /* ikincil mavi */

  --r-lg: 26px;  /* sidebar, büyük panel */
  --r-md: 20px;  /* modal, orta panel */
  --r-sm: 14px;  /* iç kart */

  --ease: cubic-bezier(.22, 1, .36, 1);     /* genel geçiş */
  --spring: cubic-bezier(.34, 1.4, .56, 1); /* yay/bounce hissi (hover kalkma, basma) */
}
```

### 2.2 Koyu Tema Kökleri (`html[data-theme="dark"]`)

Cam formülü koyuda **tersine döner**: açıkta yüzeyler beyazın kalın saydamı, koyuda beyazın **çok az** saydamı — yani karanlığın üstüne ince bir ışık tabakası.

```css
html[data-theme="dark"] {
  --d-1: rgba(255, 255, 255, 0.062);   /* ana paneller */
  --d-2: rgba(255, 255, 255, 0.038);   /* iç/ikincil yüzeyler */
  --d-3: rgba(255, 255, 255, 0.085);   /* input, öne çıkan yüzey */
  --d-hover: rgba(255, 255, 255, 0.13);
  --d-strong: rgba(20, 26, 42, 0.78);  /* menü/popover — opak tarafta */

  --d-edge: rgba(255, 255, 255, 0.16);
  --d-edge-soft: rgba(255, 255, 255, 0.09);

  --d-sheen: inset 0 1px 0 0 rgba(255, 255, 255, 0.14),
             inset 0 0 0 1px rgba(255, 255, 255, 0.04);

  /* Gölgeler — koyuda daha derin, daha yayvan */
  --d-sh-1: 0 2px 10px rgba(0, 0, 0, 0.40), 0 10px 32px rgba(0, 0, 0, 0.32);
  --d-sh-2: 0 6px 18px rgba(0, 0, 0, 0.46), 0 20px 56px -12px rgba(0, 0, 0, 0.55);
  --d-sh-3: 0 10px 28px rgba(0, 0, 0, 0.52), 0 36px 88px -18px rgba(0, 0, 0, 0.70);

  --d-blur: 30px;
  --d-sat: 175%;

  --d-ink: #f2f5fa;
  --d-ink-2: #a9b4c8;
  --d-ink-3: #78849c;

  --d-sel: rgba(255, 255, 255, 0.155);  /* seçim/aktif göstergesi (ışık camı) */

  --d-r-lg: 26px;
  --d-r-md: 20px;
  --d-r-sm: 14px;

  --d-ease: cubic-bezier(.22, 1, .36, 1);
  --d-spring: cubic-bezier(.34, 1.4, .56, 1);
}
```

**Kural:** Yarıçap ve easing değerleri iki temada **birebir aynı** (`26/20/14px`, aynı cubic-bezier'lar) — yalnızca opaklık/renk oranları değişiyor. Yeni platformda da bu simetriyi koru.

### 2.3 İkincil Token Katmanı — Panel-İçi Semantik Renkler (`--tm-*` / `--tl-*`)

Bazı sayfalarda (örn. Lider Takibi) ayrıca bir "orta katman" token seti var: `--tm-*` genel semantik durumlar (uyarı/hata/başarı/bilgi), `--tl-*` o sayfaya özel skor renkleri için. Bunlar **doğrudan `--d-*`/`--g-*`'ye referans verir** (`var(--d-2, ...)` gibi) — yani temel katmanın üstüne kurulu, ondan kopya değil.

```css
/* Koyu tema */
:root[data-theme="dark"] {
  --tm-surface:   var(--d-2, rgba(255,255,255,.038));
  --tm-surface-2: rgba(255,255,255,.024);
  --tm-hover:     var(--d-hover, rgba(255,255,255,.13));
  --tm-edge:      var(--d-edge-soft, rgba(255,255,255,.09));
  --tm-sheen:     inset 0 1px 0 0 rgba(255,255,255,.12);
  --tm-ink:       var(--d-ink, #f2f5fa);
  --tm-ink-2:     var(--d-ink-2, #a9b4c8);
  --tm-ink-3:     var(--d-ink-3, #78849c);
  --tm-tip-bg:    var(--d-strong, rgba(20,26,42,.92));

  /* Semantik durum renkleri (uyarı/hata/başarı/bilgi/accent) */
  --tm-danger: #fca5a5;  --tm-danger-bg: rgba(239,68,68,.11);  --tm-danger-edge: rgba(248,113,113,.28);
  --tm-warn:   #fcd34d;  --tm-warn-bg:   rgba(245,158,11,.11); --tm-warn-edge:   rgba(251,191,36,.26);
  --tm-info:   #c7d2fe;  --tm-info-bg:   rgba(99,102,241,.13); --tm-info-edge:   rgba(165,180,252,.28);
  --tm-ok:     #6ee7b7;  --tm-ok-bg:     rgba(16,185,129,.13); --tm-ok-edge:     rgba(52,211,153,.28);
  --tm-accent: #5eead4;  --tm-accent-bg: rgba(13,148,136,.17); --tm-accent-edge: rgba(45,212,191,.32);
}

/* Açık tema — AYNI isimler, farklı değerler */
:root[data-theme="light"] {
  --tm-surface:   rgba(255,255,255,.50);
  --tm-surface-2: rgba(255,255,255,.30);
  --tm-hover:     rgba(255,255,255,.72);
  --tm-edge:      rgba(255,255,255,.62);
  --tm-sheen:     inset 0 1px 0 0 rgba(255,255,255,.85);
  --tm-ink:       #12141a;
  --tm-ink-2:     #4b5364;
  --tm-ink-3:     #6b7385;
  --tm-tip-bg:    rgba(255,255,255,.92);

  --tm-danger: #9f1239;  --tm-danger-bg: rgba(190,18,60,.085);  --tm-danger-edge: rgba(190,18,60,.24);
  --tm-warn:   #92400e;  --tm-warn-bg:   rgba(245,158,11,.15);  --tm-warn-edge:   rgba(180,83,9,.26);
  --tm-info:   #3730a3;  --tm-info-bg:   rgba(99,102,241,.11);  --tm-info-edge:   rgba(67,56,202,.22);
  --tm-ok:     #065f46;  --tm-ok-bg:     rgba(16,185,129,.13);  --tm-ok-edge:     rgba(6,95,70,.22);
  --tm-accent: #115e59;  --tm-accent-bg: rgba(13,148,136,.13);  --tm-accent-edge: rgba(15,118,110,.26);
}
```

**Neden bu ayrı katman var:** Kartlar/rozetler/uyarı şeritleri gibi tekrar eden UI parçaları için `--d-*`/`--g-*`'yi doğrudan kullanmak yerine anlamlı isimler (`--tm-danger`, `--tm-warn`) kullanmak, "bu buton neden bu renk" sorusuna kod okunurken cevap verir. **Yeni projede de bu iki katmanlı yapıyı kopyala**: (1) ham cam fizik değişkenleri, (2) üstüne kurulu semantik/durum değişkenleri.

### 2.4 Kritik Kontrast Kuralı (WCAG AAA hedefi)

Bu projede birden fazla kez **koyu temada okunmayan metin** hatası yaşandı ve düzeltildi. Kural şu hale geldi:

- Küçük punto (≤10px) metin **asla** `--tm-ink-3` (en soluk ton) ile yazılmaz — koyu temada `#78849c` üzerinde `#111827` zemine karşı ~4.8:1 oranı veriyor, bu normal metin eşiğinin (4.5:1) hemen üstünde ama küçük puntoda pratikte okunmuyor.
- Bunun yerine `--tm-ink-2` (~8.6:1, AAA sınırı 7:1'i geçiyor) + en az 10px punto + kendi kapsül zemini (`background: var(--tm-surface-2)`) kullanılır.
- **Kontrast hesabı göz kararı değil, gerçek formülle yapılır** (bu proje testlerinde WCAG relative luminance formülü kullanıldı):

```js
function lum(hex) {
  const v = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
```

Yeni platformda küçük punto + soluk renk kombinasyonu kullanılacaksa bu formülle önceden ölçülmeli.

---

## 3. Zemin (Mesh Gradient Background)

Cam efekti bunsuz çalışmaz. Gradient'ler `body`'nin `background`'ına **doğrudan** veriliyor (ayrı bir pseudo-element değil, ama `background-attachment` sorunlarına karşı `!important` + `background-size:100% 100%` ile sabitleniyor).

**Açık tema:**
```css
html[data-theme="light"] { background: #cfdcfa; }
html[data-theme="light"] body {
  background:
    radial-gradient(1250px 900px at 6%   0%,  rgba(37, 99, 235, 0.55),  transparent 62%),
    radial-gradient(1050px 820px at 97%  4%,  rgba(139, 92, 246, 0.52), transparent 60%),
    radial-gradient(1150px 900px at 92% 70%,  rgba(13, 148, 136, 0.48), transparent 62%),
    radial-gradient(980px 820px at 2%   72%,  rgba(79, 70, 229, 0.44),  transparent 60%),
    radial-gradient(900px 760px at 44%  36%,  rgba(56, 189, 248, 0.34), transparent 64%),
    radial-gradient(760px 640px at 62%  98%,  rgba(236, 72, 153, 0.18), transparent 62%),
    linear-gradient(158deg, #d3e1fb 0%, #d6d9fa 46%, #cfe9f2 100%) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;
  color: var(--ink);
}
```

**Koyu tema** (aynı konumlar, çok daha düşük opaklık — "düz siyah olursa efekt kaybolur, ama ışıklı da olamaz"):
```css
html[data-theme="dark"] { background: #070b14; }
html[data-theme="dark"] body {
  background:
    radial-gradient(1250px 900px at 6%   0%,  rgba(37, 99, 235, 0.30),  transparent 60%),
    radial-gradient(1050px 820px at 97%  4%,  rgba(139, 92, 246, 0.26), transparent 58%),
    radial-gradient(1150px 900px at 92% 70%,  rgba(13, 148, 136, 0.24), transparent 60%),
    radial-gradient(980px 820px at 2%   72%,  rgba(79, 70, 229, 0.22),  transparent 58%),
    radial-gradient(900px 760px at 44%  36%,  rgba(56, 189, 248, 0.14), transparent 62%),
    linear-gradient(158deg, #0a1020 0%, #080d1a 46%, #0a0f1e 100%) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;
  color: var(--d-ink);
}
```

**Renk paleti mantığı:** Mavi (accent-2), mor, turkuaz (marka rengi), indigo, camgöbeği, pembe — 5-6 radial gradient köşelerde/kenarlarda konumlanır, ortada boşluk bırakılır (paneller orta alanda okunur kalır). Yeni platform farklı bir marka rengi kullanacaksa **turkuaz noktaları o markanın accent rengiyle değiştir**, geri kalan geometriyi (konum, boyut, opaklık oranları) koru.

Scrollbar da temaya göre eşleniyor:
```css
html[data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(23, 43, 99, 0.20) !important; border-radius: 99px; }
html[data-theme="dark"]  ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.14) !important; border-radius: 99px; }
```

---

## 4. Cam Yüzey Formülü (Genel Reçete)

Herhangi bir paneli/kartı/modalı cama çevirmenin standart formülü:

```css
/* Ana panel (sidebar, filtre kartı, modal gövdesi) */
background: var(--g-1) !important;                              /* veya --d-1 koyu temada */
-webkit-backdrop-filter: blur(var(--blur)) saturate(var(--sat));
backdrop-filter: blur(var(--blur)) saturate(var(--sat));
border: 1px solid var(--edge-soft) !important;
border-radius: var(--r-lg) !important;   /* veya r-md/r-sm, hiyerarşiye göre */
box-shadow: var(--sh-2), var(--sheen);   /* gölge + iç ışık ikisi birden */
```

```css
/* İç/ikincil yüzey (kart içindeki kart) — daha az opak, "cam üstünde cam" */
background: var(--g-2) !important;
border: 1px solid var(--edge-soft) !important;
border-radius: var(--r-sm) !important;
box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.6);   /* backdrop-filter YOK — iç içe blur pahalı/gereksiz */
```

**Hiyerarşi kuralı:** Yalnızca **en dıştaki** panel `backdrop-filter` taşır. İçindeki kartlar sadece opaklık farkıyla ayrışır (`--g-1` > `--g-2`), ikinci bir blur eklenmez — hem performans hem de görsel karmaşa nedeniyle.

**Hover geçişi (kart/panel):**
```css
transition: transform .28s var(--spring), background .25s var(--ease), box-shadow .25s var(--ease);
```
```css
&:hover {
  background: var(--g-hover) !important;
  transform: translateY(-3px) scale(1.012);   /* hafif kalkma + hafif büyüme */
  box-shadow: var(--sh-2);
  border-color: var(--edge) !important;
}
```

**Modal (ağır blur + yay animasyonu):**
```css
/* Backdrop */
.modal-bg {
  background: rgba(18, 26, 48, 0.22) !important;
  backdrop-filter: blur(14px) saturate(140%);
}
/* Gövde — panellerden daha ağır blur, daha yüksek radius */
.modal-box {
  border-radius: 28px !important;
  background: rgba(255, 255, 255, 0.52) !important;
  backdrop-filter: blur(44px) saturate(200%);
  box-shadow: var(--sh-3), var(--sheen);
  animation: lgModalIn .46s var(--spring);
}
@keyframes lgModalIn {
  from { opacity: 0; transform: translateY(16px) scale(.94); }
  to   { opacity: 1; transform: none; }
}
```

---

## 5. Sol Menü (Sidebar)

Projede iki panel var, ikisi de aynı sidebar iskeletini kullanıyor ama **team-leader.html'de tam işlevli genişlet/daralt (full ↔ mini) geçişi var**; admin.html'de sidebar her zaman sabit genişlikte. Aşağıdaki tarif team-leader.html'deki tam (iki-durumlu) versiyon — yeni platformda muhtemelen bunu istersin.

### 5.1 Yapı — İki Ayrı `<aside>`, Tek Anahtarla Geçiş

Sidebar **tek bir daraltılabilir öğe değil, iki ayrı `<aside>`** (`#sidebarFull` ve `#sidebarMini`), `display:none`/`flex` ile karşılıklı gizlenip gösteriliyor. Sebep: mini haldeki ikon-only navigasyon, tam haldeki etiketli navigasyondan yapısal olarak farklı (farklı buton boyutu, farklı hizalama) — tek DOM'u CSS ile büzmek yerine iki ayrı, kendi içinde tutarlı görünüm tutuluyor.

```html
<aside id="sidebarFull" style="width:260px;min-width:260px;background:#0f172a;border-right:1px solid #1e293b;
       display:flex;flex-direction:column;height:100vh;position:sticky;top:0;overflow-y:auto;
       flex-shrink:0;transition:width 0.25s">
  <!-- Logo + daralt oku -->
  <div style="padding:18px 16px 14px;border-bottom:1px solid #1e293b;display:flex;align-items:flex-end;justify-content:space-between;gap:8px">
    <div style="flex:1;min-width:0">
      <img src="logo.png" style="width:100%;height:auto;max-height:42px;object-fit:contain;object-position:left">
      <p class="nc-project-name">Alt başlık / proje adı</p>
    </div>
    <button onclick="toggleSidebar()" style="width:26px;height:26px;border-radius:8px;background:#1e293b;
            border:1px solid #334155;color:#64748b;display:flex;align-items:center;justify-content:center;
            transition:all 0.15s"
            onmouseover="this.style.background='#0d9488';this.style.color='#fff'"
            onmouseout="this.style.background='#1e293b';this.style.color='#64748b'">
      <svg style="width:12px;height:12px" ...><path d="M15 19l-7-7 7-7"/></svg>  <!-- sol ok -->
    </button>
  </div>
  <!-- Kullanıcı kartı -->
  <div style="padding:14px 16px;border-bottom:1px solid #1e293b">
    <div style="display:flex;align-items:center;gap:10px">
      <div id="userAvatar" style="width:36px;height:36px;border-radius:50%;
           background:linear-gradient(135deg,#0d9488,#0f766e);color:#fff;font-weight:800;font-size:13px;
           display:flex;align-items:center;justify-content:center;flex-shrink:0">TL</div>
      <div style="min-width:0">
        <div id="sidebarName" style="font-size:12px;font-weight:700;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">—</div>
        <div id="sidebarTeam" style="font-size:10px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">—</div>
        <div id="roleLabel" style="font-size:9px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:0.8px;margin-top:1px">Rol Etiketi</div>
      </div>
    </div>
  </div>
  <!-- Navigasyon -->
  <div style="padding:12px 10px;flex:1">
    <div style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.8px;padding:0 6px;margin-bottom:6px">Navigation</div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <button onclick="switchView('x')" class="nav-btn active" id="nav-x">
        <svg class="h-4 w-4" style="flex-shrink:0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">...</svg>
        <span>Etiket</span>
        <span id="navBadgeX" class="badge-cnt ml-auto" style="background:#dc2626;color:#fff;display:none">0</span>
      </button>
      <!-- ...diğer nav öğeleri aynı desende -->
    </div>
  </div>
  <!-- Alt kısım: dil / tema / uygulamalar / çıkış (bkz. §5.4) -->
</aside>

<aside id="sidebarMini" style="display:none;width:56px;min-width:56px;background:#0f172a;border-right:1px solid #1e293b;
       flex-direction:column;align-items:center;height:100vh;position:sticky;top:0;flex-shrink:0;padding:12px 0">
  <button onclick="toggleSidebar()" style="width:36px;height:36px;border-radius:10px;background:#1e293b;
          border:1px solid #334155;color:#64748b;display:flex;align-items:center;justify-content:center;
          margin-bottom:14px;transition:all 0.15s"
          onmouseover="this.style.background='#0d9488';this.style.color='#fff'"
          onmouseout="this.style.background='#1e293b';this.style.color='#64748b'">
    <svg style="width:14px;height:14px" ...><path d="M9 5l7 7-7 7"/></svg>  <!-- sağ ok -->
  </button>
  <div id="miniAvatar" style="width:32px;height:32px;border-radius:50%;
       background:linear-gradient(135deg,#0d9488,#0f766e);color:#fff;font-weight:800;font-size:11px;
       display:flex;align-items:center;justify-content:center;margin-bottom:16px">TL</div>
  <div style="display:flex;flex-direction:column;gap:4px;align-items:center;flex:1">
    <button onclick="switchView('x')" id="mini-nav-x" title="Etiket"
            style="width:36px;height:36px;border-radius:10px;background:#0d9488;border:none;color:#fff;
                   display:flex;align-items:center;justify-content:center;transition:all 0.15s">
      <svg style="width:16px;height:16px" ...>...</svg>   <!-- yalnızca ikon, etiket YOK -->
    </button>
    <!-- pasif öğe: background:transparent, color:#64748b -->
  </div>
  <!-- Alt kısım aynı sırayla, yalnızca ikon (bkz. §5.4) -->
</aside>
```

```js
function toggleSidebar() {
  const full = document.getElementById('sidebarFull');
  const mini = document.getElementById('sidebarMini');
  if (full.style.display !== 'none') { full.style.display = 'none'; mini.style.display = 'flex'; }
  else { full.style.display = 'flex'; mini.style.display = 'none'; }
}
// Dar ekranda (≤900px) ilk açılışta mini ile başla — tam sidebar içeriği ezip kullanılmaz hale getiriyordu
(function () {
  if (window.innerWidth <= 900) {
    document.getElementById('sidebarFull').style.display = 'none';
    document.getElementById('sidebarMini').style.display = 'flex';
  }
})();
```

**Aktif durumun İKİ yerde ayrı yönetilmesi gerekir:** `#nav-x` (full) ve `#mini-nav-x` (mini) aynı görünümü temsil ediyor ama farklı DOM düğümleri — `switchView()` fonksiyonu görünüm değişince her ikisinde de `.active` sınıfını / `background`'ı güncellemeli, yoksa sidebar daraltılıp genişletildiğinde aktif sekme "unutulmuş" görünür.

### 5.2 Nav Butonu — Full (İkon + Etiket + Rozet)

```css
.nav-btn {
  width: 100%; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700;
  border-radius: 10px; display: flex; align-items: center; gap: 8px;
  transition: all 0.15s; cursor: pointer; white-space: nowrap; border: none; background: none;
}
.nav-btn.active { background: #0D9488; color: #fff; }      /* team-leader.html: marka turkuazı */
.nav-btn:not(.active) { color: #94A3B8; }
.nav-btn:not(.active):hover { background: #1f2937; color: #e2e8f0; }
```

**Panel bazlı renk farkı — bilinçli:** `admin.html`'de aktif nav rengi **indigo** (`#4F46E5`), `team-leader.html`'de **turkuaz** (`#0D9488`). Bu, "hangi panelde olduğunu anla" sinyali — admin ve takım lideri paneli görsel olarak hafifçe ayrışıyor. Yeni platformda birden fazla rol/panel varsa bu deseni kopyalayabilirsin: aynı bileşen iskeleti, panel/role göre farklı bir vurgu rengi.

Rozet (okunmamış sayısı vb.):
```css
.badge-cnt {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; padding: 0 5px; height: 18px; border-radius: 9999px;
  font-size: 9px; font-weight: 800; line-height: 1;
}
```
Kullanım: `<span class="badge-cnt ml-auto" style="background:#dc2626;color:#fff;display:none">0</span>` — varsayılan gizli, sayı > 0 olunca JS ile `display:inline-flex` yapılır ve arka plan durum rengine göre değişir (kırmızı = acil, yeşil = nötr bilgi).

### 5.3 Mini Nav Butonu — Yalnızca İkon, Kare Rozet Yerine Dolgu Rengi

```css
/* Aktif (satır içi, JS ile set edilir) */
background:#0d9488; color:#fff;
/* Pasif */
background:transparent; color:#64748b;
```
Mini modda etiket ve sayısal rozet **yok** — yalnızca `title="..."` ile native tooltip. İkon boyutu `16×16px` (full moddaki `h-4 w-4` = `16×16px` ile aynı), buton kutusu `36×36px` kare.

### 5.4 Alt Blok — Dil / Tema / Uygulamalar / Çıkış

Sidebar'ın en altında, ana navigasyondan ayrı bir grup:
```html
<!-- Dil değiştir -->
<button onclick="I18N.toggle()" title="TR / EN" style="width:36px;height:26px;border-radius:9999px;
        background:#1e293b;border:1px solid #334155;color:#94a3b8;font-size:8px;font-weight:800;">
  <span id="miniLangLabel">TR</span>
</button>
<!-- Tema değiştir -->
<button onclick="toggleThemeMode()" class="lg-theme-toggle" title="Görünüm" style="width:36px;height:36px;border-radius:10px">
  <svg class="lg-icon-moon">...</svg>
  <svg class="lg-icon-sun">...</svg>
</button>
<!-- Uygulama seçici -->
<button onclick="window.location.href='apps.html'" title="Uygulamalar" style="...">☰ ikonu</button>
```

**Tema değiştirme butonu (`.lg-theme-toggle`) — ay/güneş ikon takası:**
```css
.lg-theme-toggle {
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform .3s cubic-bezier(.34, 1.4, .56, 1), background .22s ease, color .22s ease;
}
.lg-theme-toggle:active { transform: scale(.92); }
.lg-theme-toggle .lg-icon-sun  { display: none; }   /* koyu temada AY ikonu görünür (tıklayınca güneşe geçer) */
.lg-theme-toggle .lg-icon-moon { display: block; }
html[data-theme="dark"] .lg-theme-toggle .lg-icon-sun  { display: block; }
html[data-theme="dark"] .lg-theme-toggle .lg-icon-moon { display: none; }

/* Taban (tema uygulanmadan önceki/koyu varsayılan) */
html[data-theme="dark"] .lg-theme-toggle,
html:not([data-theme]) .lg-theme-toggle { background: #1e293b; border: 1px solid #334155; color: #94a3b8; }
html[data-theme="dark"] .lg-theme-toggle:hover { background: #0d9488; color: #fff; }

/* Açık temada cam pill */
html[data-theme="light"] .lg-theme-toggle {
  background: rgba(255, 255, 255, 0.58) !important;
  border: 1px solid rgba(255, 255, 255, 0.32) !important;
  color: #4b5364 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 2px 8px rgba(23, 43, 99, 0.08) !important;
  border-radius: 999px !important;   /* tam pill, kare değil */
}
html[data-theme="light"] .lg-theme-toggle:hover { background: rgba(255, 255, 255, 0.8) !important; color: #0f766e !important; }
```

İki ikon her zaman DOM'da, CSS `display` ile hangisi göründüğü değişiyor — JS ikon değiştirmiyor, yalnızca `data-theme` özniteliğini set ediyor, geri kalan CSS'in işi.

### 5.5 Sidebar'ın Cam Katmanı (Açık Tema)

```css
html[data-theme="light"] #sidebarFull,
html[data-theme="light"] #sidebarMini {
  background: var(--g-1) !important;
  -webkit-backdrop-filter: blur(var(--blur)) saturate(var(--sat));
  backdrop-filter: blur(var(--blur)) saturate(var(--sat));
  border: 1px solid var(--edge-soft) !important;
  border-radius: var(--r-lg) !important;      /* 26px — sidebar KÖŞELİ değil, tamamen yuvarlatılmış panel */
  box-shadow: var(--sh-2), var(--sheen);
  margin: 10px 0 10px 10px !important;         /* kenardan biraz boşluklu, "yüzen panel" hissi */
  height: calc(100vh - 20px) !important;
  top: 10px !important;
}
html[data-theme="light"] #sidebarFull > div,
html[data-theme="light"] #sidebarMini > div { border-color: var(--edge-soft) !important; }

html[data-theme="light"] #userAvatar,
html[data-theme="light"] #miniAvatar { box-shadow: 0 6px 18px -4px rgba(13, 148, 136, 0.55), var(--sheen); }
html[data-theme="light"] #sidebarName { color: var(--ink) !important; }
html[data-theme="light"] #sidebarTeam { color: var(--ink-2) !important; }
html[data-theme="light"] .nc-project-name { color: #5a6180 !important; }

/* Sidebar kendi kaydırma çubuğunu alır (dış scrollbar'dan ayrı, ince) */
html[data-theme="light"] #sidebarFull::-webkit-scrollbar { width: 5px; }
html[data-theme="light"] #sidebarFull::-webkit-scrollbar-thumb { background: rgba(23, 43, 99, 0.18); border-radius: 99px; }
html[data-theme="light"] #sidebarFull:hover::-webkit-scrollbar-thumb { background: rgba(23, 43, 99, 0.30); }

/* Açık temada iç boşluklar biraz sıkılaştırılıyor — cam üstünde koyu temanın boşlukları biraz gevşek duruyordu */
html[data-theme="light"] #sidebarFull .nav-btn { padding: 7px 11px !important; }
```

**Önemli geometri kararı:** Sidebar açık camda `margin: 10px 0 10px 10px` ile ekran kenarından **kopuk, yüzen bir panel** haline geliyor (`height: calc(100vh - 20px)`). Koyu temada ise sidebar ekranın kenarına tam yaslı, köşesiz. Bu, "cam" ile "düz panel" arasındaki en görünür farklardan biri — açık temada her şey biraz daha "havada", koyu temada her şey biraz daha "gömülü".

### 5.6 Kayan Aktif Gösterge (`.lq-seg-ind`) — Segment Kontrollerinde

Sekme grubu (tab pill'ler, mini nav gibi yan yana duran aktif/pasif seçim grupları) için, arka planı her seçim değişiminde yeniden boyamak yerine **tek bir katmanı kaydıran** desen:

```css
.lq-seg { position: relative; }             /* geometri temadan BAĞIMSIZ — konumlandırma bağlamı */
.lq-seg-ind { position: absolute; top: 0; left: 0; pointer-events: none; z-index: 0; }

html[data-theme="light"] .lq-seg-ind {
  position: absolute; top: 0; left: 0;
  border-radius: 999px;                      /* pill grubu — tam yuvarlak */
  background: rgba(18, 22, 34, 0.62);         /* KOYU cam — aktif gösterge açık temada da koyu durur */
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  backdrop-filter: blur(16px) saturate(150%);
  box-shadow: 0 6px 20px -6px rgba(12, 16, 30, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition: transform .52s var(--spring), width .42s var(--spring),
              height .42s var(--spring), opacity .25s var(--ease);
  will-change: transform, width;
}
/* Sidebar navigasyonunda köşeler pill değil, yumuşak kare */
html[data-theme="light"] #sidebarFull .lq-seg-ind { border-radius: 12px; }
```

JS tarafı (liquid-ui.js benzeri bir yardımcı), aktif öğe değişince göstergenin `transform: translate()` / `width` / `height` değerlerini yeni öğenin `getBoundingClientRect()`'ine göre günceller — göstergenin kendisi DOM'da **tek** kalır, her geçişte yay (`--spring`) ile kayar. Bu, "aktif renk arka planı aniden değişir" yerine "aktif gösterge bir yerden bir yere akar" hissini verir.

---

## 6. Buton Sistemi

### 5.1 Navigasyon Butonu / Tab Pill

```css
.nav-btn {
  border-radius: 12px !important;
  transition: background .22s var(--ease), color .22s var(--ease),
              transform .3s var(--spring), box-shadow .25s var(--ease) !important;
  position: relative; z-index: 1;
}
.nav-btn:not(.active) { color: var(--ink-2) !important; }
/* Hover — marka rengi DEĞİL, camın koyulaşması */
.nav-btn:not(.active):hover {
  background: rgba(18, 22, 34, 0.09) !important;
  color: var(--ink) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
/* Aktif: zemin şeffaf — koyu cam göstergeyi ayrı kayan bir katman (.lq-seg-ind) çizer */
.nav-btn.active { background: transparent !important; color: #fff !important; box-shadow: none !important; }
.nav-btn.active:not(.lq-seg *) { background: rgba(18, 22, 34, 0.62) !important; }
.nav-btn:active { transform: scale(.955); }
```

**Kayan aktif gösterge deseni (`.lq-seg-ind`):** Segmentli kontrol (tab grubu) içinde aktif sekmeyi vurgulayan arka plan ayrı bir `<div>` olarak var, JS ile `transform: translateX()` kullanarak sekmeler arasında kayarak geçiş yapıyor — bu da bir "tek katman" prensibi: arka planı her `.active` değişiminde yeniden boyamak yerine tek bir öğeyi kaydırmak, animasyonu pürüzsüzleştiriyor.

### 5.2 Birincil Buton (Yenile / Kaydet gibi işlem düğmeleri)

Bu proje başta her sayfada satır içi stil ile tekrarlanan bir buton kullanıyordu; tek sınıfa indirgendi:

```css
.nc-refresh-btn {
  padding: 8px 14px; background: #0d9488; border: none; border-radius: 10px;
  color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  line-height: 1.25; transition: background .15s;
}
.nc-refresh-btn:hover { background: #0f766e; }
```

Cam katmanı bu düğmeyi **hem sınıf hem de eski satır-içi `style*="background:#0d9488"` seçicisiyle** birlikte yakalayıp cam bir birincil buton görünümüne çeviriyor (bkz. §6.4) — geçiş döneminde ikisi bir arada tutuldu.

### 5.3 İkincil Buton (Ghost / Nötr Aksiyon)

```css
.nc-ghost-btn {
  padding: 8px 14px; background: #1e293b; border: 1px solid #334155; border-radius: 10px;
  color: #cbd5e1; font-size: 11px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  line-height: 1.25; transition: background .15s, border-color .15s, color .15s;
}
.nc-ghost-btn:hover { background: #334155; border-color: #475569; color: #fff; }
```

**Kural:** Birincil ve ikincil buton **aynı geometriye** (padding, radius, font-size) sahip — yan yana dururken yükseklikleri eşit olsun, hiyerarşi yalnızca renk/kontrastla anlatılsın.

### 5.4 Cam Katmanının Birincil Butonu "Camlaştırma" Kuralı (Açık Tema)

```css
html[data-theme="light"] button[style*="background:#0d9488" i]:not(aside button),
html[data-theme="light"] button[style*="background:#0f766e" i]:not(aside button),
html[data-theme="light"] .nc-refresh-btn,
html[data-theme="light"] button[style*="background:#4f46e5" i]:not(aside button) {
  position: relative;
  overflow: hidden;
  background: linear-gradient(150deg, #17c1ad 0%, #0d9488 55%, #0e7c72 100%) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.26) !important;
  border-radius: 12px !important;
  letter-spacing: .01em;
  box-shadow: 0 6px 20px -5px rgba(13, 148, 136, 0.58),
              0 1px 3px rgba(13, 148, 136, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
  transition: box-shadow .26s var(--ease), transform .3s var(--spring), filter .2s var(--ease) !important;
}
/* Üst yarıda parlama katmanı — camın ışığı yakalaması */
html[data-theme="light"] .nc-refresh-btn::after {
  content: ""; position: absolute; inset: 0 0 52% 0;
  background: linear-gradient(rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0));
  border-radius: inherit; pointer-events: none;
}
html[data-theme="light"] .nc-refresh-btn:hover {
  transform: translateY(-1.5px);
  filter: saturate(115%) brightness(1.05);
  box-shadow: 0 10px 28px -6px rgba(13, 148, 136, 0.68), inset 0 1px 0 rgba(255, 255, 255, 0.55) !important;
}
html[data-theme="light"] .nc-refresh-btn:active { transform: scale(.965); }
```

**Önemli tasarım kararı:** Farklı marka renkleriyle yazılmış butonlar (turkuaz `#0d9488`, indigo `#4f46e5`) **cam katmanında AYNI görünüme** indirgeniyor. Yani "kaç farklı renkte birincil buton var" sorusu görünürde tek cevaba sahip — bilinçli bir "tek birincil stil" kuralı. Yeni projede birden fazla marka rengi varsa, bunları cam katmanında tek bir birincil görünüme (kendi accent renginle) indirgemeyi düşün.

### 5.5 İkincil (Ghost) Butonun Camlaşması

```css
html[data-theme="light"] button[style*="background:#1e293b" i]:not(aside button),
html[data-theme="light"] .nc-ghost-btn {
  background: var(--g-3) !important;
  border: 1px solid var(--edge-soft) !important;
  color: var(--ink-2) !important;
  border-radius: 12px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 2px 8px rgba(23, 43, 99, 0.06) !important;
}
```

### 5.6 Sidebar Butonları (`aside button`)

Sidebar içi butonlar genel `.nav-btn` kuralından **hariç tutuluyor** (`:not(.nav-btn)`) çünkü farklı bir cam tonu kullanıyorlar:
```css
html[data-theme="light"] aside button:not(.nav-btn) {
  background: var(--g-2) !important;
  border: 1px solid var(--edge-soft) !important;
  color: var(--ink-2) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition: background .22s var(--ease), transform .3s var(--spring), color .2s var(--ease) !important;
}
html[data-theme="light"] aside button:not(.nav-btn):hover { background: var(--g-hover) !important; color: var(--ink) !important; transform: translateY(-1px); }
html[data-theme="light"] aside button:not(.nav-btn):active { transform: scale(.93); }
```

### 5.7 Toolbar Yükseklik Hizalama Kuralı

Bir başlık araç çubuğunda farklı türde denetimler (input, select, buton) yan yana durduğunda **doğal yükseklikleri birkaç piksel farklı olabiliyor** (input padding'i ≠ buton padding'i). Çözüm: hepsini sabit bir yüksekliğe zorlamak.

```css
.nc-toolbar { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }
.nc-toolbar .nc-refresh-btn,
.nc-toolbar .nc-ghost-btn,
.nc-toolbar .nc-export-btn,
.nc-toolbar input.filter-select,
.nc-toolbar input.filter-input,
.nc-toolbar .lq-trigger { height: 32px; box-sizing: border-box; }
```

`box-sizing: border-box` **şart**: cam katmanı bazı öğelere `border: 1px solid` ekliyor, bu olmadan kenarlık yüksekliğe eklenip 1-2px kayma yaratıyor.

---

## 7. Tablo Sistemi (İki Farklı Tablo Dili — Bilinçli Ayrım)

Bu projede **iki farklı tablo yoğunluğu** var ve hangisinin hangi içerik türüne uygun olduğu net bir kuralla ayrılmış:

### 6.1 `.tbl` — Kişi/Liste Tabloları (Kullanıcılar, Takım Üyeleri, Ayrılan Kişiler)

Daha ferah, 11px punto, kişi verisi için (az sütun, okunabilirlik öncelikli).

```css
.tbl th { position: sticky; top: 0; background: #111827; z-index: 2; }
.tbl td, .tbl th { padding: 8px 10px; font-size: 11px; text-align: left; border-bottom: 1px solid #1f2937; white-space: nowrap; }
.tbl tr:hover td { background: #12182b; }
```

Sarmalayıcı: `<div class="overflow-auto rounded-xl border border-gray-800"><table class="tbl w-full">`.

Hücre tipografi kuralı (satır içi, JS'te üretilen markup):
- Ana kimlik alanı (ad): `class="py-2 text-white font-semibold"`
- Kimlik/kod alanları (kullanıcı adı, telefon): `class="py-2 text-slate-300 font-mono text-sm"` — **mono font kimlik/kod hissi verir**
- Genel metin: `class="py-2 text-slate-300 text-sm"`

Sıralanabilir başlık deseni:
```css
.sortable-th { cursor: pointer; user-select: none; white-space: nowrap; }
.sortable-th:hover { color: #e2e8f0; }
.sortable-th .sort-arrow { font-size: 9px; margin-left: 3px; opacity: .7; }
```
JS render: aktif sütunda ok karakteri (`▲`/`▼`), diğerlerinde boş.

Boş durum: `<div class="hidden text-center py-12 text-slate-500 text-sm">Mesaj</div>`, `classList.add/remove('hidden')` ile gösterilir (`style.display` değil — proje genelinde tutarlılık için).

Tema eşlemesi (her iki tema da tam kapsıyor):
```css
html[data-theme="light"] .tbl th { /* açık cam başlık */ }
html[data-theme="light"] .tbl td { /* açık cam hücre */ }
html[data-theme="light"] .tbl tr:hover td { background: rgba(255, 255, 255, 0.6) !important; }
html[data-theme="dark"]  .tbl th { /* koyu cam başlık */ }
html[data-theme="dark"]  .tbl td { border-bottom: 1px solid rgba(255, 255, 255, 0.055) !important; }
html[data-theme="dark"]  .tbl tr:hover td { background: rgba(255, 255, 255, 0.075) !important; }
```

### 6.2 `.am-alarm-tbl` — Yoğun Veri Tabloları (Alarm/Deal Listeleri)

Daha sıkı, 9-10px, çok sütunlu, yüksek yoğunluklu veri için. Yapışkan (`sticky`) başlık + zebra + hover.

```css
.am-alarm-wrap { overflow: auto; max-height: 68vh; border-radius: 14px; scrollbar-width: thin; }
.am-alarm-tbl { width: 100%; border-collapse: separate; border-spacing: 0; }
.am-alarm-tbl thead th { position: sticky; top: 0; z-index: 2; white-space: nowrap; }
.am-alarm-tbl tbody td { vertical-align: middle; }
.am-th { padding: 8px 10px; font-size: 9px; text-align: left; color: #475569; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #1e293b; white-space: nowrap; }
.am-sort { cursor: pointer; user-select: none; }
.am-sort:hover { color: #94a3b8; }
.am-sarrow { margin-left: 3px; color: #475569; font-size: 8px; }
.am-sarrow.active { color: #38bdf8; }

/* Geometri temadan bağımsız */
.am-alarm-tbl thead th:first-child { border-top-left-radius: 13px; }
.am-alarm-tbl thead th:last-child  { border-top-right-radius: 13px; }
.am-alarm-tbl tbody td { border-top: 0; border-left: 0; border-right: 0; }
.am-alarm-row { transition: background .16s ease; }
```

Açık tema camlaşması:
```css
html[data-theme="light"] .am-alarm-wrap {
  border: 1px solid var(--edge-soft);
  background: rgba(255, 255, 255, 0.34);
  scrollbar-color: rgba(23, 43, 99, 0.16) transparent;
}
html[data-theme="light"] .am-alarm-tbl thead th {
  background: rgba(244, 247, 255, 0.96) !important;   /* opak-ish — yapışkan başlığın altından satır görünmesin */
  backdrop-filter: blur(18px) saturate(180%);
  border-bottom: 1px solid var(--edge) !important;
}
html[data-theme="light"] .am-alarm-tbl tbody tr:nth-child(even) td { background: rgba(23, 43, 99, 0.022); }
html[data-theme="light"] .am-alarm-tbl tbody tr:hover td { background: rgba(13, 148, 136, 0.075); }
html[data-theme="light"] .am-alarm-tbl tbody td { border-bottom: 1px solid rgba(23, 43, 99, 0.055); }
```

**Kritik ayrıntı:** Ayırıcı çizgiler asla satır içi `border-bottom:#0f172a` gibi sabit koyu renk kullanmaz — açık temada neredeyse siyah, sert bir ızgara çıkarır (tema eşlemesi arka plana bakar, kenarlık rengine dokunmaz). Ayrım **çizgiyle değil yüzeyle** yapılır: kılcal alt kenar (`opacity` çok düşük) + zebra + hover rengi. Dikey çizgi projede **hiç kullanılmıyor** — cam üstünde tam ızgara ağır durur.

### 6.3 Toplam/Özet Şeridi (`.am-totals`)

Tablonun üstünde toplam sayaç:
```css
.am-totals { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px 18px; margin: 12px 0 14px; padding: 10px 16px; border-radius: 14px; position: relative; z-index: 2; }
.am-totals-count { font-size: 11.5px; font-weight: 650; }
.am-totals-figs { display: flex; flex-wrap: wrap; gap: 8px 22px; }
.am-total { display: inline-flex; flex-direction: column; line-height: 1.25; }
.am-total i { font-style: normal; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
.am-total strong { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }
```
Açık temada camlaşma: `background: var(--g-2); backdrop-filter: blur(18px) saturate(175%); border: 1px solid var(--edge-soft);`

**Not:** `.am-totals` yoğun tablo dilinin bir parçası — kişi listelerinde (`.tbl`) kullanılmaz, oradaki sayaç düz metin notu olarak başlığın altına yazılır (`<p class="text-[10.5px] text-slate-500 mt-1">`).

### 6.4 Hangi Tabloyu Ne Zaman Kullan (Karar Kuralı)

| İçerik türü | Kullan | Neden |
|---|---|---|
| Kişi listesi (kullanıcı, ekip üyesi, ayrılan çalışan) | `.tbl` + `sortable-th` | Az sütun, okunabilirlik öncelik, 11px ferah |
| Yoğun işlem/veri listesi (alarm, deal, log) | `.am-alarm-tbl` + `.am-th`/`.am-sort` | Çok sütun, tarama hızı öncelik, 9-10px sıkı |

Bu proje bir ara "Ayrılan Kişiler" sayfasını yanlışlıkla yoğun tabloya çevirmiş ve geri alınmıştı — **içerik türü karar verir, "hangisi daha yeni" değil.**

---

## 8. Form Elemanları

```css
.filter-select { background: #111827; border: 1px solid #374151; color: #E2E8F0; border-radius: 8px; padding: 6px 10px; font-size: 12px; width: 100%; }
.filter-select:focus { outline: none; border-color: #6366F1; }
.filter-select option { background: #111827; color: #E2E8F0; }
input.filter-input { background: #111827; border: 1px solid #374151; color: #E2E8F0; border-radius: 8px; padding: 6px 10px; font-size: 12px; width: 100%; }
```

Açık temada `<select>` elemanları özel bir "liquid" bileşene (`.lq-trigger`) dönüştürülüyor (native select stilize edilemediği için JS ile custom dropdown'a sarılıyor); native `<input>` ise doğrudan CSS ile camlaştırılıyor. Yeni projede select'leri custom bir bileşene sarmayı planla, input'ları doğrudan stil ver.

---

## 9. Rozet / Durum Etiketleri (Pill)

```css
.stage-pill { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 700; white-space: nowrap; }
.stage-Won        { background: #134E1B; color: #4ADE80; }
.stage-Cancelled  { background: #450A0A; color: #F87171; }
.stage-Appointment{ background: #1E3A5F; color: #60A5FA; }
.stage-Reservation{ background: #451A03; color: #FB923C; }
.stage-Waiting    { background: #1C2A1C; color: #86EFAC; }
.stage-default    { background: #1e2536; color: #94A3B8; }
```

**Desen:** Her durum, koyu (neredeyse siyah tonlu) bir arka plan + o durumun canlı rengiyle eşleşen açık metin. Örn. "Won" = koyu yeşil zemin + parlak yeşil metin. Açık temada bu roz zler `color-mix` veya doygunluk düşürülerek yeniden eşlenir (aşağıda KPI kartı örneğine bak).

---

## 10. KPI Kartları (İkon + Işıma Efekti)

```css
.am-kpi {
  position: relative; border-radius: 18px; padding: 18px 14px 16px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.06);
  border-top: 2.5px solid color-mix(in srgb, var(--am-glow, #6366f1) 55%, transparent);
  background: linear-gradient(155deg, rgba(255,255,255,.05), rgba(255,255,255,0) 60%), #0d1220;
  transition: transform .25s ease, box-shadow .25s ease;
}
.am-kpi::after {
  content: ''; position: absolute; right: -18px; top: -18px; width: 72px; height: 72px;
  border-radius: 50%; filter: blur(18px); opacity: .35; background: var(--am-glow, #6366f1);
}
.am-kpi.am-critical { border-color: rgba(248,113,113,.35); }
.am-kpi.am-critical .am-kpi-val { animation: amCriticalGlow 2.2s ease-in-out infinite; }
.am-kpi-icon {
  width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 8px; font-size: 15px;
  background: color-mix(in srgb, var(--am-glow, #6366f1) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--am-glow, #6366f1) 35%, transparent);
}
```

Kullanım: her karta `style="--am-glow:#22d3ee"` gibi bir CSS custom property veriliyor, kartın üst kenarı, köşedeki ışıma ve ikon zemini **o tek değişkenden** türüyor. Kritik/uyarı durumundaki kartlar (`am-critical`) yanıp sönen bir `text-shadow` animasyonu alıyor.

**Dikkat — `color-mix()` risk notu:** Bu proje bilinçli olarak bazı yerlerde `color-mix()` kullanmaktan **kaçındı** çünkü desteklenmeyen bir tarayıcıda **tüm bildirim geçersiz sayılır** (CSS "invalid at computed-value time" davranışı) ve öğe tamamen görünmez kalabilir. KPI kartlarında kullanılıyor olması kabul edilebilir bir risk olarak değerlendirilmiş; ama Yenile butonu gibi kritik interaktif öğelerde `color-mix()` yerine sabit `rgba()` gölge tercih edilmiş. Yeni projede: **kritik/her zaman görünmesi gereken öğelerde `color-mix()` kullanma, dekoratif öğelerde (ışıma, arka plan) kullanılabilir.**

Açık temada köşe ışıması yumuşatılıyor (leke gibi durmasın diye):
```css
html[data-theme="light"] .am-kpi::after { opacity: .16 !important; filter: blur(26px) !important; width: 58px !important; height: 58px !important; }
html[data-theme="light"] .am-kpi.am-critical .am-kpi-val { animation: none !important; }  /* kirli/gürültülü görünüyordu */
```

---

## 11. Kart İç Detayları (Modern Popup Deseni — Lider Takibi Örneği)

Bu proje bir detay popup'ını "efsane modern" hale getirirken şu bileşenleri tanımladı — herhangi bir detay/karne kartı için yeniden kullanılabilir kalıp:

```css
/* Kartın üstünde cam kalınlığı hissi veren ince ışık çizgisi */
.tl-card { position: relative; }
.tl-card::before {
  content: ''; position: absolute; top: 0; left: 12px; right: 12px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent);
}
/* Hover'da aksan kenarlığı */
.tl-card:hover { border-color: var(--tm-accent-edge); }

/* Bölüm başlıklarında sol aksan çubuğu */
.tl-card-title::before { content: ''; width: 3px; flex: none; background: linear-gradient(...); border-radius: 2px; }

/* Skor halkasının arkasında skorun rengiyle eşleşen ışık havuzu */
.tl-card-score { overflow: hidden; }  /* ışık havuzu dışarı taşmasın diye KIRPILIYOR */
.tl-card-score::after {
  content: ''; position: absolute; /* ortalanmış */ border-radius: 50%;
  background: radial-gradient(circle, var(--tl-hero-glow), transparent 70%);
  filter: blur(30px);
}
/* NOT: renk JS'ten geliyor -- style="--tl-hero-glow:${sGlow}" -- skorun durumuna (iyi/orta/kötü) göre değişir */

/* İstatistik kutularında hover aksan şeridi + ikon rozeti */
.tl-stat { position: relative; overflow: hidden; }
.tl-stat::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--tm-accent); transform: scaleX(0); transition: transform .2s; }
.tl-stat:hover::before { transform: scaleX(1); }
.tl-stat-ico { /* küçük yuvarlak simge rozeti, istatistik kutusunun içinde */ }

/* Hareket satırlarında hover aksan çizgisi */
.tl-log-row { position: relative; }
.tl-log-row::before { content: ''; position: absolute; left: 0; ...; opacity: 0; transition: opacity .15s; }
.tl-log-row:hover::before { opacity: 1; }

/* İnce, tema-duyarlı kaydırma çubuğu */
.tl-log::-webkit-scrollbar { width: 6px; }
.tl-log::-webkit-scrollbar-thumb { background: var(--tm-edge); border-radius: 99px; }
```

**Skor halkası (SVG donut chart):**
```html
<svg width="88" height="88" viewBox="0 0 88 88">
  <circle cx="44" cy="44" r="34" ... />  <!-- arka plan halkası -->
  <circle cx="44" cy="44" r="34" stroke-dasharray="C" stroke-dashoffset="..." />  <!-- değer halkası -->
</svg>
```
```js
const R = 34, C = 2 * Math.PI * R;
```
Skor rengi durum bazlı: `--tl-score-ok` (iyi), `--tl-score-warn` (orta), `--tl-score-bad` (kötü) — bunlar da hem açık hem koyu temada ayrı tanımlı token'lar (bkz. §2.3).

**Kart-içi flex/scroll düzeni (önemli layout kalıbı):** İki kart yan yana bir grid'de (`grid md:grid-cols-2 gap-3`) farklı miktarda içerik gösterirken, grid `stretch` davranışı ikisini eşit yüksekliğe geriyor ama içerideki liste **sabit `max-height`'a** kilitliyse liste yarıda kesilip altında boşluk kalıyor. Çözüm:
```css
.tl-card-col { display: flex; flex-direction: column; min-height: 0; }  /* min-height:0 -- grid ögesi kısalabilsin */
.tl-card-col .tl-log { flex: 1 1 0; max-height: none; min-height: 200px; }  /* kalan yüksekliği yutar, kendi içinde kayar */
```
Bu kalıp her yerde geçerli: **"içerik miktarı değişken olan, komşusuyla eşit yükseklikte durması gereken, kendi içinde kayması gereken liste"** senaryosunda `flex:1 1 0` + `min-height:0` + `overflow-y:auto` üçlüsü kullan.

---

## 12. Geçiş (Transition) ve Easing Sözlüğü

| Değişken | Değer | Kullanım |
|---|---|---|
| `--ease` / `--d-ease` | `cubic-bezier(.22, 1, .36, 1)` | Renk/arka plan geçişleri, genel yumuşak geçiş |
| `--spring` / `--d-spring` | `cubic-bezier(.34, 1.4, .56, 1)` | Transform (hover kalkma, basma, modal giriş) — **hafif aşırı-sekme (overshoot) hissi** |

**Standart süreler:**
- Renk/arka plan geçişi: `.15s`–`.25s`
- Transform (hover kalkma): `.28s`–`.3s` (`--spring` ile)
- Modal giriş animasyonu: `.46s` (`--spring` ile)
- Basma tepkisi (`:active`): anlık `transform: scale(.93–.965)`, ayrı süre tanımlanmaz (geçişin kendisi üstlenir)

**Basma (active) kalıbı:** Her tıklanabilir öğe basılınca hafifçe küçülür — `scale(.93)` (sidebar butonu, güçlü basma) ile `scale(.965)` (birincil buton, hafif basma) arasında, öğenin "ağırlığına" göre değişir.

**Hover kalkma kalıbı:** Kartlar hover'da yukarı kalkar + hafif büyür: `translateY(-3px) scale(1.012)` (orta kart) ile `translateY(-4px) scale(1.015)` (öne çıkan kart) arasında.

---

## 13. Tipografi

```css
body { font-family: 'Inter', sans-serif; }
h1, h2, h3 { font-family: 'Outfit', sans-serif; }
```
Google Fonts: `Outfit` (300-700) — başlıklar; `Inter` (300-700) — gövde metni. (Projede ayrıca dekoratif amaçlı `Cormorant Garamond` de yükleniyor ama aktif kullanımı sınırlı.)

Başlıklar hafif sıkılaştırılmış harf aralığı alıyor: `letter-spacing: -0.015em`.

**Punto ölçeği (küçükten büyüğe, projede fiilen kullanılan):**
- 8-9px: mikro etiket (sıralama oku, KPI etiketi)
- 10-11px: tablo hücresi, ikincil metin
- 11.5-12px: form input, toplam sayaç
- 14px: KPI değeri, önemli sayı
- 20-25px: skor/büyük rakam

**Sayısal hizalama:** Sayısal değerler `font-variant-numeric: tabular-nums` alır (rakamlar eşit genişlikte durur, tablo/liste içinde titreşim olmaz).

---

## 14. Radius Ölçeği

| Token | Değer | Kullanım |
|---|---|---|
| `--r-lg` / `--d-r-lg` | 26px | Sidebar, en dıştaki büyük panel |
| `--r-md` / `--d-r-md` | 20px | Modal, orta panel |
| `--r-sm` / `--d-r-sm` | 14px | İç kart |
| (satır içi) | 12px | Buton, nav öğesi |
| (satır içi) | 10px | Küçük buton, badge |
| (satır içi) | 8px | Input, form elemanı |
| (satır içi) | 999px | Pill/rozet, tam yuvarlak |

**Kural:** Radius hiyerarşiyle orantılı — dıştaki kap ne kadar büyükse radius o kadar büyük. İç içe geçen kutularda içteki her zaman dıştakinden küçük radius alır (asla eşit veya büyük değil).

---

## 15. Uygulama Kontrol Listesi (Yeni Platform İçin)

Yeni platformu kurarken sırayla:

1. **İki CSS dosyası oluştur:** `liquid-glass.css` (light) ve `liquid-glass-dark.css` (dark), her ikisi de `html[data-theme="..."]` seçicisiyle scope'lanmış, birbirine dokunmayan.
2. **Kök token bloklarını kopyala** (§2.1, §2.2) — `--g-*`/`--edge*`/`--sheen`/`--sh-*`/`--blur`/`--sat`/`--ink*`/`--r-*`/`--ease`/`--spring` ve koyu eşdeğerleri `--d-*`. **Marka rengini** (`--accent: #0d9488`) yeni platformun kendi marka rengiyle değiştir, geri kalan oranları koru.
3. **Mesh gradient zemini** kur (§3) — aynı geometri (6 radial-gradient, köşe/kenar konumları), yeni marka rengine göre en az bir noktayı o renge çevir.
4. **Semantik token katmanını** (§2.3, `--tm-*` tarzı) kur — durum renkleri (danger/warn/info/ok/accent) her iki temada da tanımlı olsun.
5. **Cam yüzey formülünü** (§4) her panel/kart/modal seviyesine uygula — dıştaki `backdrop-filter` taşır, içteki yalnızca opaklıkla ayrışır. **Sol menüyü** (§5) full/mini iki durumlu yap — sabit tek genişlik yerine, dar ekranda otomatik mini moda düşen bir yapı kur.
6. **Buton sistemini** (§6) kur: birincil/ikincil/nav/tab, hepsi aynı geometri farklı renk; `.nc-toolbar` tarzı hizalama yardımcı sınıfı ekle.
7. **Tablo dilini seç** (§7.4 karar tablosu) — sayfanın içerik türüne göre ferah kişi-tablosu mu, sıkı veri-tablosu mu olacağına önceden karar ver, ikisini karıştırma.
8. **Kontrastı ölç, tahmin etme** (§2.4) — küçük punto + soluk renk kombinasyonlarını WCAG formülüyle doğrula.
9. **Geçiş/easing sözlüğünü** (§12) birebir kopyala — `--ease`/`--spring` ikilisi bu tasarım dilinin "imzası", farklı bir easing kullanmak hissi bozar.
10. **Test yaz:** Bu projede her tasarım değişikliği gerçek DOM/CSS içeriğini regex ile doğrulayan Node script'leriyle test edildi (görsel "iyi görünüyor" değil, "bu token gerçekten kullanılıyor mu" kontrolü). Yeni platformda da böyle bir doğrulama alışkanlığı kur.

---

## 16. Kaynak Dosya Haritası (Bu Projede)

| Dosya | İçerik |
|---|---|
| `liquid-glass.css` | Açık tema — tüm `html[data-theme="light"]` kuralları (~3580 satır) |
| `liquid-glass-dark.css` | Koyu tema — tüm `html[data-theme="dark"]` kuralları (~1760 satır) |
| `admin.html` `<style>` bloğu | Taban (tema-bağımsız) bileşen tanımları: `.tbl`, `.am-*`, `.nc-*`, `.filter-*`, `.stage-*`, `.tl-*` vb. + `--tm-*`/`--tl-*` token blokları |
| `team-leader.html` `<style>` bloğu | Aynı desenlerin bu paneldeki tekrarı (bazı sınıflar birebir kopya, örn. `.nc-refresh-btn`); ayrıca `#sidebarFull`/`#sidebarMini`/`toggleSidebar()` — **tam işlevli genişlet/daralt sidebar burada** (bkz. §5) |
| `export-util.js` | `SIZES` objesi — export butonlarının standart ölçüleri (`sm`/`lg`/`am`), buton geometrisiyle senkron tutulur |

Yeni platformda muhtemelen tek bir HTML dosyası yerine bileşen bazlı bir yapı (React/Vue vb.) olacağı için, buradaki `<style>` bloklarını **paylaşılan bir `design-tokens.css` + `components.css` ikilisine** bölmek daha sürdürülebilir olur; ama görsel çıktı birebir bu dokümandaki değerlerle eşleşmeli.
