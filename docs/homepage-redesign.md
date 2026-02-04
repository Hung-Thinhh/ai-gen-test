# DUKY AI - HOMEPAGE REDESIGN SPECIFICATION

## 🎨 TỔNG QUAN THIẾT KẾ

### Color Palette
```
Primary:    #FF6B00 (Orange) - CTA, highlights
Secondary:  #1A1A2E (Dark Navy) - Background
Accent:     #00D9FF (Cyan) - Links, hover
Success:    #00C853 (Green) - Success states
Warning:    #FFD600 (Yellow) - Badges, rewards
Text:       #FFFFFF (White) - Primary text
Muted:      #A0A0A0 (Gray) - Secondary text
```

### Typography
```
Heading:    'Be Vietnam Pro', sans-serif
Body:       'Inter', sans-serif
Hero:       64px / 700 weight
H2:         48px / 600 weight
H3:         24px / 500 weight
Body:       16px / 400 weight
```

### Animation Speeds
```
Fast:       150ms (micro-interactions)
Normal:     300ms (hover, transitions)
Slow:       500ms (page transitions)
Entrance:   800ms (scroll reveal)
```

---

## SECTION 1: ANNOUNCEMENT BAR

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  🔥 Flash Sale: Giảm 50% gói Pro - Chỉ còn 2 giờ!    [X]    │
└─────────────────────────────────────────────────────────────┘
```

### Details
- **Height:** 40px
- **Background:** Gradient (Orange → Red)
- **Text:** White, 14px, center aligned
- **Close button:** Right side, hover opacity 0.7
- **Animation:**
  - Entrance: Slide down from top (300ms)
  - Close: Slide up and fade out (200ms)
  - Flashing text: Pulse animation every 2s

### Code
```tsx
<motion.div
  initial={{ y: -40 }}
  animate={{ y: 0 }}
  exit={{ y: -40, opacity: 0 }}
  className="announcement-bar"
>
  <span className="animate-pulse">🔥 Flash Sale</span>
</motion.div>
```

---

## SECTION 2: HERO BANNER (Nâng cấp từ LeonardoBanner)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] [Tools▼] [Pricing] [Gallery]          [Credits] [👤] │ ← Nav (sticky)
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     [Floating Image 1]         [Floating Image 2]          │
│          ↕️ Parallax              ↕️ Parallax               │
│                                                             │
│                  AI TẠO HÌNH                                 │
│         CHO DOANH NGHIỆP & CÁ NHÂN                          │
│                                                             │
│    ┌─────────────────────────────────────────┐              │
│    │ 📝 Mô tả ảnh bạn muốn tạo...           │              │
│    └─────────────────────────────────────────┘              │
│              [⚡ TẠO ẢNH NGAY - MIỄN PHÍ]                  │
│                                                             │
│    💡 Thử: "Chân dung doanh nhân" | "Poster trà sữa"       │
│                                                             │
│    50K+ Users  •  2M+ Images  •  4.9★ Rating               │
│                                                             │
│     [Floating Image 3]         [Floating Image 4]          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Demo Image] [Demo Image] [Demo Image]            │   │ ← Auto-scrolling showcase
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Background Effects
1. **Gradient Mesh:** Animated gradient blobs (orange/purple)
   - Animation: Slow drift (20s loop)
   - Blur: 100px
   - Opacity: 0.3

2. **Particle Network:** Subtle connecting dots
   - Count: 30-50 particles
   - Connection distance: 150px
   - Mouse interaction: Particles repel on hover

3. **Grid Pattern:** Subtle grid lines
   - Color: rgba(255,255,255,0.03)
   - Size: 50px

### Floating Images (Parallax)
- **Position:** 4 corners
- **Size:** 150-200px
- **Effect:** Parallax on scroll + Idle float animation
- **Animation:**
  ```
  Idle: Y-axis float (±15px, 4s loop, ease-in-out)
  Parallax: moveY based on scroll position
  ```

### Input Box (Live Demo)
```tsx
<div className="demo-input-container">
  <input
    placeholder="📝 Mô tả ảnh bạn muốn tạo..."
    className="glassmorphism-input"
  />
  <button className="gradient-cta">
    ⚡ TẠO NGAY
  </button>
</div>
```

**Effects:**
- Glassmorphism background (blur: 20px, rgba(255,255,255,0.1))
- Border glow on focus (orange pulse)
- Placeholder typing animation ("Mô tả ảnh..." → "Chân dung doanh nhân..." → clear)

### Stats Counter
```
50K+    2M+      4.9★     30+
Users   Images   Rating   Tools
```

**Animation:** Count up từ 0 khi scroll vào viewport
```tsx
<motion.span
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
>
  <CountUp end={50000} suffix="K+" />
</motion.span>
```

### Auto-scrolling Image Strip
- Direction: Right to left
- Speed: 30s per loop
- Images: 10-15 ảnh đẹp nhất từ community
- Hover: Pause animation

---

## SECTION 3: TRUST BADGES

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Được tin dùng bởi          [Logo Công ty 1] [Logo 2] ...   │
│                                                             │
│  🔒 Bảo mật 100%  •  ✅ Hoàn tiền 7 ngày  •  💬 Hỗ trợ 24/7 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Effects
- **Logo carousel:** Infinite scroll (logos công ty/brand)
- **Badges:** Icon pulse nhẹ mỗi 3s
- **Divider:** Gradient line (transparent → orange → transparent)

---

## SECTION 4: LIVE DEMO

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         🎯 THỬ NGAY KHÔNG CẦN ĐĂNG KÝ                      │
│                                                             │
│    ┌──────────────────────────────────────────────┐         │
│    │                                                │         │
│    │    [Generated Image Preview Area]             │         │
│    │                                                │         │
│    │    "Một ngườii phụ nữ chuyên nghiệp..."       │         │
│    │                                                │         │
│    └──────────────────────────────────────────────┘         │
│                                                             │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ 📝 Nhập mô tả...                           [🎲]    │  │
│    └─────────────────────────────────────────────────────┘  │
│                                                             │
│    [⚡ TẠO ẢNH]  [💎 TẠO VỚI PRO]                          │
│                                                             │
│    Gợi ý:                                                   │
│    [Chân dung doanh nhân] [Poster trà sữa] [Avatar chibi]   │
│    [Sản phẩm thời trang]  [Bìa sách]      [Logo startup]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Interactive Features
1. **Real-time Preview:**
   - Ảnh example thay đổi khi click gợi ý
   - Transition: Fade cross-fade (300ms)

2. **Prompt Suggestions:**
   - Chips có thể click
   - Hover: Background light up
   - Click: Auto-fill input + trigger generate

3. **Random Button (🎲):**
   - Quay animation khi click
   - Random prompt từ database

4. **Generate Animation:**
   ```
   Loading states:
   1. Button: "Đang tạo..." + spinner
   2. Preview: Skeleton loading
   3. Progress bar: 0% → 100%
   4. Result: Fade in with scale
   ```

---

## SECTION 5: TOOLS SHOWCASE

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🛠️ 30+ CÔNG CỤ AI                                    [→]   │
│                                                             │
│  [🔥 Tất cả] [Chân dung] [Sản phẩm] [Marketing] [Giải trí] │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ [Image]  │ │ [Image]  │ │ [Image]  │ │ [Image]  │       │
│  │          │ │          │ │          │ │          │       │
│  │ ⚡       │ │ 🆕       │ │ HOT      │ │          │       │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤       │
│  │ Face     │ │ Product  │ │ Avatar   │ │ Poster   │       │
│  │ Swap     │ │ Photo    │ │ Creator  │ │ Creator  │       │
│  │          │ │          │ │          │ │          │       │
│  │ 1 credit │ │ 2 credits│ │ Free     │ │ 1 credit │       │
│  │ ⭐ 12K   │ │ ⭐ 8K    │ │ ⭐ 15K   │ │ ⭐ 5K    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│              [Xem tất cả công cụ →]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Card Design
```tsx
<motion.div
  whileHover={{ y: -10, scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="tool-card"
>
  {/* Image with overlay */}
  <div className="image-container">
    <Image src={tool.previewImage} />
    <div className="overlay-gradient" />

    {/* Badge */}
    {tool.isNew && <span className="badge-new">🆕 Mới</span>}
    {tool.isHot && <span className="badge-hot">🔥 Hot</span>}

    {/* Try button - appears on hover */}
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      whileHover={{ opacity: 1, y: 0 }}
      className="try-button"
    >
      Thử ngay →
    </motion.button>
  </div>

  {/* Info */}
  <div className="card-info">
    <h3>{tool.name}</h3>
    <div className="meta">
      <span className="credit-cost">{tool.cost} credits</span>
      <span className="usage-count">⭐ {formatNumber(tool.usage)}</span>
    </div>
  </div>
</motion.div>
```

### Tab Animation
- **Active tab:** Underline slide (300ms)
- **Content switch:** Fade + slight Y translate
- **Filter:** Stagger animation cho cards (50ms delay mỗi card)

---

## SECTION 6: COMMUNITY SHOWCASE

### Layout (Masonry Grid)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎨 ẢNH TỪ CỘNG ĐỒNG                                 [→]   │
│  Khám phá tác phẩm từ 50K+ người dùng                       │
│                                                             │
│  ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐               │
│  │ Img1 │ │   Img2   │ │ Img3 │ │   Img4   │               │
│  │      │ │          │ │      │ │          │               │
│  │ 👤   │ │   👤     │ │ 👤   │ │   👤     │               │
│  └──────┘ └──────────┘ └──────┘ └──────────┘               │
│  ┌──────────┐ ┌──────┐ ┌──────────┐ ┌──────┐               │
│  │   Img5   │ │ Img6 │ │   Img7   │ │ Img8 │               │
│  │          │ │      │ │          │ │      │               │
│  └──────────┘ └──────┘ └──────────┘ └──────┘               │
│                                                             │
│         [Khám phá thư viện ảnh →]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Card Hover Effect
```tsx
<motion.div
  whileHover="hover"
  className="showcase-card"
>
  <Image src={image.url} />

  {/* Overlay on hover */}
  <motion.div
    variants={{
      hover: { opacity: 1 }
    }}
    initial={{ opacity: 0 }}
    className="card-overlay"
  >
    {/* Prompt preview */}
    <p className="prompt-preview">{truncate(image.prompt, 100)}</p>

    {/* Author */}
    <div className="author">
      <Avatar src={image.author.avatar} />
      <span>{image.author.name}</span>
    </div>

    {/* Actions */}
    <div className="actions">
      <button>❤️ {image.likes}</button>
      <button>🔍 Xem</button>
      <button>📝 Dùng prompt</button>
    </div>
  </motion.div>
</motion.div>
```

### Loading Animation
- Skeleton cards với shimmer effect
- Stagger load (100ms delay mỗi card)
- Infinite scroll: Spinner ở bottom khi load thêm

---

## SECTION 7: HOW IT WORKS

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         ⚡ CHỈ 3 BƯỚC ĐỂ TẠO ẢNH                           │
│                                                             │
│   ┌─────────┐        ┌─────────┐        ┌─────────┐        │
│   │   1️⃣   │   →    │   2️⃣   │   →    │   3️⃣   │        │
│   │  📝    │        │  ⚡    │        │  💾    │        │
│   │         │        │         │        │         │        │
│   │ Mô tả  │        │ AI tạo │        │ Tải    │        │
│   │ ý tưởng│        │ ảnh    │        │ về     │        │
│   └─────────┘        └─────────┘        └─────────┘        │
│                                                             │
│   [DEMO ANIMATION: Screen recording minh họa]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step Animation
- **Scroll trigger:** Khi section vào viewport
- **Animation:** Stagger slide up + fade in
- **Connector lines:** Draw animation (SVG path)

---

## SECTION 8: PRICING

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         💎 CHỌN GÓI PHÙ HỢP                                 │
│         Bắt đầu miễn phí, nâng cấp khi cần                  │
│                                                             │
│   [Monthly] [Yearly -20%] ← Toggle                          │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │   FREE     │ │  STARTER   │ │    PRO     │              │
│  │            │ │            │ │   🔥       │              │
│  │   0đ       │ │  49K/tháng │ │ 149K/tháng │              │
│  │            │ │            │ │            │              │
│  │ ✓ 100      │ │ ✓ 500      │ │ ✓ 2000     │              │
│  │   credits  │ │   credits  │ │   credits  │              │
│  │            │ │            │ │            │              │
│  │ ✓ Cơ bản   │ │ ✓ HD       │ │ ✓ 4K       │              │
│  │ ✗ Watermark│ │ ✓ No WM    │ │ ✓ No WM    │              │
│  │            │ │            │ │ ✓ Priority │              │
│  │            │ │            │ │ ✓ 24/7     │              │
│  │            │ │            │ │            │              │
│  │ [DÙNG NGAY]│ │ [MUA NGAY] │ │ [MUA NGAY] │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│   ✅ Hoàn tiền trong 7 ngày nếu không hài lòng              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Card Effects
- **Popular card:** Nổi lên (translateY: -20px), border glow orange
- **Hover:** Scale 1.02, shadow tăng
- **Toggle animation:** Slide indicator + content fade

---

## SECTION 9: TESTIMONIALS

### Layout (Carousel)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         ⭐ KHÁCH HÀNG NÓI GÌ                                │
│                                                             │
│  ← ┌─────────────────────────────────────────────┐ →       │
│    │                                             │          │
│    │  "Từ khi dùng Duky, tôi không cần thuê      │          │
│    │   photographer nữa. Chỉ 5 phút là có ảnh   │          │
│    │   sản phẩm đẹp cho shop online."            │          │
│    │                                             │          │
│    │  [👤 Avatar] Nguyễn Thị A                   │          │
│    │  Chủ shop thời trang                        │          │
│    │  ⭐⭐⭐⭐⭐                                     │          │
│    │                                             │          │
│    └─────────────────────────────────────────────┘          │
│                                                             │
│                     ● ○ ○ ○ ○                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Carousel Animation
- **Auto-play:** 5s interval
- **Transition:** Slide horizontal + fade
- **Swipe:** Touch enabled on mobile

---

## SECTION 10: FAQ

### Layout (Accordion)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         ❓ CÂU HỎI THƯỜNG GẶP                               │
│                                                             │
│  ▼ Duky AI có miễn phí không?                              │
│    Có! Bạn nhận 100 credits mỗi ngày để dùng thử...       │
│                                                             │
│  ▶ Ảnh tạo ra có bản quyền không?                         │
│                                                             │
│  ▶ Tôi cần hỗ trợ thì liên hệ như nào?                    │
│                                                             │
│  ▶ Có thể dùng cho thương mại không?                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Accordion Animation
- **Expand:** Height auto (300ms), content fade in
- **Icon:** Rotate 90deg
- **Stagger:** Mỗi item có delay nhỏ khi scroll vào

---

## SECTION 11: CTA & FOOTER

### Final CTA
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     🚀 SẴN SÀNG TẠO ẢNH ĐẸP?                               │
│                                                             │
│     Đăng ký ngay để nhận 100 credits miễn phí               │
│                                                             │
│     [📧 Nhập email...]  [BẮT ĐẦU MIỄN PHÍ →]               │
│                                                             │
│     ✓ Không cần thẻ tín dụng  ✓ Hủy bất kỳ lúc nào         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Footer
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                                     │
│  AI tạo hình cho doanh nghiệp và cá nhân                    │
│                                                             │
│  Tools    Company    Support    Legal    Connect            │
│  - Free   - About    - Help     - Terms  - FB               │
│  - Pro    - Blog     - Contact  - Privacy- Zalo             │
│  - API    - Careers  - FAQ      - Refund - Email            │
│                                                             │
│  © 2025 Duky AI    [Vietnam Flag] Made with ❤️ in VN        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎭 ANIMATION LIBRARIES NEEDED

```json
{
  "dependencies": {
    "framer-motion": "^12.x",      // React animations
    "react-countup": "^6.x",        // Number counting
    "react-intersection-observer": "^9.x", // Scroll triggers
    "swiper": "^12.x",              // Carousels
    "react-fast-marquee": "^1.x"    // Infinite scroll
  }
}
```

## 📱 RESPONSIVE BREAKPOINTS

```
Mobile:     < 640px   (1 column)
Tablet:     640-1024px (2 columns)
Desktop:    > 1024px   (4 columns)
Large:      > 1440px   (max-width container)
```

## 🎯 PERFORMANCE TARGETS

- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3.5s
- **Cumulative Layout Shift:** < 0.1

---

Bạn muốn tôi bắt đầu implement section nào trước?
