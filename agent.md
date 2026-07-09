# iOS 26 Liquid Glass & SwiftUI API Notes

Saved for workspace agent reference. Sources: Apple Developer Documentation & WWDC25.

**Last updated:** 2026-07-09

---

## Official sources

| Resource | URL |
| --- | --- |
| Adopting Liquid Glass | https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass |
| Applying Liquid Glass to custom views | https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views |
| `glassEffect(_:in:)` | https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:) |
| `GlassEffectContainer` | https://developer.apple.com/documentation/swiftui/glasseffectcontainer |
| WWDC25: Build a SwiftUI app with the new design | https://developer.apple.com/videos/play/wwdc2025/323/ |
| WWDC25: Build a UIKit app with the new design | https://developer.apple.com/videos/play/wwdc2025/284/ |
| Apple Newsroom (Liquid Glass design) | https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/ |

---

## Overview

iOS 26 / iPadOS 26 / macOS Tahoe 26 (and related “26” platform releases) introduce **Liquid Glass**: a dynamic material that blurs content behind it, reflects/refracts surrounding color and light, and reacts to touch/pointer in real time.

- Forms a distinct functional layer for **controls and navigation**.
- Standard SwiftUI / UIKit / AppKit components adopt it automatically when you build with the **latest Xcode / SDKs**.
- Custom UI uses new APIs: `glassEffect`, `GlassEffectContainer`, glass button styles, etc.

Compatibility escape hatch: `UIDesignRequiresCompatibility` in Info.plist keeps the pre–Liquid Glass look while shipping with the latest SDKs.

---

## Key SwiftUI APIs

### Apply glass to a view

```swift
nonisolated func glassEffect(
    _ glass: Glass = .regular,
    in shape: some Shape = DefaultGlassEffectShape()
) -> some View
```

- Default: `.regular` glass in a `Capsule`.
- Renders a Liquid Glass shape behind the view and applies foreground glass effects over it.
- Prefer using inside a `GlassEffectContainer` when combining multiple glass shapes.

```swift
Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect()

Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect(in: .rect(cornerRadius: 16.0))

Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect(.regular.tint(.orange).interactive())
```

WWDC-style variants:

```swift
Label("Desert", systemImage: "sun.max.fill")
    .padding()
    .glassEffect()

Label("Desert", systemImage: "sun.max.fill")
    .padding()
    .glassEffect(in: .rect(cornerRadius: 16))

Label("Desert", systemImage: "sun.max.fill")
    .padding()
    .glassEffect(.regular.tint(.green))

Label("Desert", systemImage: "sun.max.fill")
    .padding()
    .glassEffect(.regular.interactive())
```

### Button styles

```swift
Button("Get Started") { }
    .buttonStyle(.glassProminent)

Button("Learn More") { }
    .buttonStyle(.glass)
```

Also: `PrimitiveButtonStyle.glass(_:)`.

Prefer these over hand-rolling custom glass on buttons.

### GlassEffectContainer

```swift
@MainActor @preconcurrency
struct GlassEffectContainer<Content> where Content : View
```

Combines multiple Liquid Glass shapes so they can:

- Share sampling / rendering (glass cannot sample other glass across separate containers)
- Morph into one another
- Improve rendering performance

`spacing` controls how soon nearby shapes blend: higher spacing → blending starts sooner as shapes approach.

```swift
GlassEffectContainer(spacing: 40.0) {
    HStack(spacing: 40.0) {
        Image(systemName: "scribble.variable")
            .frame(width: 80.0, height: 80.0)
            .font(.system(size: 36))
            .glassEffect()

        Image(systemName: "eraser.fill")
            .frame(width: 80.0, height: 80.0)
            .font(.system(size: 36))
            .glassEffect()
            .offset(x: -40.0, y: 0.0)
    }
}
```

### Morphing IDs & transitions

- `glassEffectID(_:in:)` — coordinate morphing within a `Namespace`
- `glassEffectTransition(_:)` — e.g. `matchedGeometry` (default when within container spacing) or `materialize`
- `glassEffectUnion(id:namespace:)` — multiple views contribute to one unified glass capsule

```swift
@State private var isExpanded: Bool = false
@Namespace private var namespace

var body: some View {
    GlassEffectContainer(spacing: 40.0) {
        HStack(spacing: 40.0) {
            Image(systemName: "scribble.variable")
                .frame(width: 80.0, height: 80.0)
                .font(.system(size: 36))
                .glassEffect()
                .glassEffectID("pencil", in: namespace)

            if isExpanded {
                Image(systemName: "eraser.fill")
                    .frame(width: 80.0, height: 80.0)
                    .font(.system(size: 36))
                    .glassEffect()
                    .glassEffectID("eraser", in: namespace)
            }
        }
    }

    Button("Toggle") {
        withAnimation { isExpanded.toggle() }
    }
    .buttonStyle(.glass)
}
```

Union example:

```swift
let symbolSet: [String] = [
    "cloud.bolt.rain.fill", "sun.rain.fill", "moon.stars.fill", "moon.fill"
]

GlassEffectContainer(spacing: 20.0) {
    HStack(spacing: 20.0) {
        ForEach(symbolSet.indices, id: \.self) { item in
            Image(systemName: symbolSet[item])
                .frame(width: 80.0, height: 80.0)
                .font(.system(size: 36))
                .glassEffect()
                .glassEffectUnion(
                    id: item < 2 ? "1" : "2",
                    namespace: namespace
                )
        }
    }
}
```

### Structure / navigation helpers

```swift
// Background extension under sidebar / inspector
Image(landmark.backgroundImageName)
    .resizable()
    .aspectRatio(contentMode: .fill)
    .backgroundExtensionEffect()

// Tab bar minimize on scroll
TabView { /* tabs */ }
    .tabBarMinimizeBehavior(.onScrollDown)

// Bottom accessory above tab bar
TabView { /* tabs */ }
    .tabBarMinimizeBehavior(.onScrollDown)
    .tabViewBottomAccessory {
        MusicPlaybackView()
    }

// Search tab
TabView {
    Tab(role: .search) {
        NavigationStack { SearchTabContent() }
    }
}
.searchable(text: $searchText)

// Sidebar-adaptable tabs
// TabViewStyle.sidebarAdaptable
```

### Toolbars

```swift
.toolbar {
    ToolbarItem { ShareLink() }
    ToolbarSpacer(.fixed)
    ToolbarItem { FavoriteButton() }
    ToolbarItem { CollectionsButton() }
    ToolbarSpacer(.fixed)
    ToolbarItem { InspectorToggle() }
}

// Flexible spacer (e.g. Mail-style leading/trailing groups)
ToolbarSpacer(.flexible, placement: .bottomBar)

// Hide shared glass background for an item
ToolbarItem { ProfileButton() }
    .sharedBackgroundVisibility(.hidden)

// Badge
Button("Notifications", systemImage: "bell") { }
    .badge(modelData.notifications.count)
```

### Search

```swift
// Top-trailing / adaptive search on NavigationSplitView
NavigationSplitView {
    SidebarContent()
} detail: {
    DetailContent()
}
.searchable(text: $searchText)

// Explicitly minimize search into a toolbar button
.searchToolbarBehavior(.minimize)
```

### Sheets & presentations

- Partial-height sheets are inset with Liquid Glass by default.
- Prefer removing custom `presentationBackground` so system glass can show.
- Sheets can morph from presenting toolbar buttons via zoom transition:

```swift
@Namespace private var namespace

ContentView()
    .toolbar {
        ToolbarItem(placement: .bottomBar) {
            Button { isPresented = true } label: {
                Image(systemName: "map")
            }
            .matchedTransitionSource(id: "transition-id", in: namespace)
        }
    }
    .sheet(isPresented: $isPresented) {
        SheetContent()
            .navigationTransition(.zoom(sourceID: "transition-id", in: namespace))
    }
```

### Controls & concentric corners

```swift
Button(…)
    .buttonBorderShape(.capsule)

CustomControl()
    .background(.tint, in: .rect(corner: .containerConcentric))

ScrollView { /* content */ }
    .scrollEdgeEffectStyle(.hard, for: .top)
```

Sliders: tick marks via `step` / `ticks` closure; `neutralValue` for non-leading fill start.

---

## Adoption guidance (from Adopting Liquid Glass)

1. **Rebuild with latest Xcode SDK** — standard bars, sheets, popovers, controls pick up Liquid Glass automatically.
2. **Remove custom backgrounds** on navigation/toolbars/split views that fight scroll-edge or glass effects.
3. **Use glass sparingly** on custom controls — only the most important functional elements.
4. **Test accessibility** — Reduce Transparency / Reduce Motion and user Liquid Glass preferences adapt system components; verify custom glass.
5. **Group custom glass** in `GlassEffectContainer` for correctness and performance.
6. **Don’t overcrowd** overlapping glass elements; prefer standard spacing metrics.
7. **Color judiciously** — system colors or light/dark (+ increased contrast) variants; tint only for meaning.
8. **watchOS** — mostly automatic; adopt watchOS 10+ standard toolbar/button styles.
9. **tvOS** — glass on focus; use standard focus APIs; Apple TV 4K (2nd gen)+.

### Cross-framework glass APIs

| Framework | Apply glass | Buttons |
| --- | --- | --- |
| SwiftUI | `View.glassEffect(_:in:)` | `.buttonStyle(.glass)` / `.glassProminent` |
| UIKit | `UIGlassEffect` (+ `UIVisualEffectView`) | `UIButton.Configuration.glass()`, `.prominentGlass()`, `.clearGlass()`, `.prominentClearGlass()` |
| AppKit | `NSGlassEffectView` | `NSButton.BezelStyle.glass` |

Related: `UIBackgroundExtensionView` / `NSBackgroundExtensionView`, `UIScrollEdgeElementContainerInteraction`, `safeAreaBar(edge:...)`.

---

## Performance notes

- Too many containers / orphan glass effects outside containers can hurt performance.
- Limit on-screen Liquid Glass effects.
- Apply `glassEffect` **after** other appearance modifiers so the container captures the final content.
- Profile with Instruments; see Apple’s SwiftUI performance / hitch guidance.

---

## WWDC25 session map (323)

| Chapter | Topic |
| --- | --- |
| 0:00 | Introduction |
| 3:07 | App structure (`NavigationSplitView`, `TabView`, sheets) |
| 7:49 | Toolbars |
| 11:10 | Search |
| 14:03 | Controls |
| 17:57 | Liquid Glass effects (custom) |
| 21:31 | Next steps |

---

## Quick checklist for agents

- [ ] Build with Xcode 26 SDK
- [ ] Prefer standard `TabView` / `NavigationSplitView` / toolbar / search APIs
- [ ] Strip obsolete bar/sheet backgrounds
- [ ] Custom chrome → `.glassEffect` + `GlassEffectContainer`
- [ ] Buttons → `.glass` / `.glassProminent` when appropriate
- [ ] Morphing → `glassEffectID` + namespace + animation
- [ ] Optional: `UIDesignRequiresCompatibility` if shipping without visual adoption

---

# Agent role: SwiftUI Helper Engineer

**Saved:** 2026-07-09

You are the user's **SwiftUI Helper Engineer**.

## Mission

Help the user implement SwiftUI features with **robust explanations**, not just code dumps. The user is a **SwiftUI beginner** — assume little prior knowledge.

## Response style (always)

For every implementation question, cover:

1. **What to build** — recommended approach first (one clear default)
2. **Why** — rationale tied to Apple’s current APIs and UX conventions
3. **How** — beginner-friendly code with short comments on *why each piece exists*
4. **Compare** — alternatives with **pros / cons** and when to pick each
5. **Pitfalls** — common beginner mistakes and how to avoid them
6. **Versions** — minimum iOS / availability when it matters

Prefer modern APIs (iOS 17–26 era). Mention Liquid Glass / toolbar updates when relevant. Keep explanations concrete and structured; avoid jargon without a one-line definition.

## Do not

- Invent APIs
- Dump large code without explaining structure
- Assume UIKit knowledge unless comparing intentionally

---

# Horizontal page scrolling (research summary)

**Question:** Best modern way to swipe left/right between pages in SwiftUI.

## TL;DR recommendation

| Target | Default |
| --- | --- |
| **New app, iOS 18+** | `ScrollView(.horizontal)` + `.scrollTargetBehavior(.paging)` + `containerRelativeFrame` + `ScrollPosition` |
| **Simple onboarding / need system dots / iOS 14–16** | `TabView` + `.tabViewStyle(.page)` |
| **Card carousel with peek** | Same ScrollView stack but `.scrollTargetBehavior(.viewAligned)` + `contentMargins` |

**Not paging:** `navigationTransition` / `matchedTransitionSource` = zoom between *screens*, not swipe pages.

iOS 26 did **not** add a new paging API; Liquid Glass only affects chrome around the pager.

## Approach A — TabView page style (iOS 14+)

```swift
@State private var page = 0

TabView(selection: $page) {
    ForEach(0..<3, id: \.self) { i in
        Text("Page \(i)").tag(i) // tag required for selection
    }
}
.tabViewStyle(.page(indexDisplayMode: .always))
```

| Pros | Cons |
| --- | --- |
| Tiny code, built-in dots | Little layout flexibility (peek/cards hard) |
| Familiar onboarding UX | All pages stay alive (not lazy) |
| Easy `page = 2` programmatic jump | Selection can desync if swipe + programmatic race |

**Use when:** 3–8 full-screen wizard pages and system dots are enough.

## Approach B — ScrollView paging (iOS 17+, best default iOS 18+)

```swift
@State private var position = ScrollPosition(idType: Int.self)

ScrollView(.horizontal) {
    LazyHStack(spacing: 0) { // spacing 0 for full-screen pages
        ForEach(0..<5, id: \.self) { index in
            Text("Page \(index)")
                .containerRelativeFrame(.horizontal) // page width = scroll view width
        }
    }
    .scrollTargetLayout() // required for scrollPosition
}
.scrollTargetBehavior(.paging)
.scrollIndicators(.hidden)
.scrollPosition($position) // iOS 18+; iOS 17: .scrollPosition(id: $pageID)
```

Programmatic: `position.scrollTo(id: 2)` (iOS 18) or `pageID = 2` (iOS 17).

| Pros | Cons |
| --- | --- |
| Apple’s modern scroll direction (WWDC23/24) | More modifiers to wire |
| Lazy via `LazyHStack`, custom dots/headers | No built-in page dots |
| Full control of size, peek, safe area | Easy to forget `scrollTargetLayout` / wrong spacing |

**Must-remember pitfalls**

- Wrong page width → add `containerRelativeFrame(.horizontal)`
- Snap wrong → `LazyHStack(spacing: 0)` for full-screen
- Position never updates → missing `.scrollTargetLayout()`
- Prefer `containerRelativeFrame` over `GeometryReader`

## Approach C — viewAligned carousel (iOS 17+)

```swift
ScrollView(.horizontal) {
    LazyHStack(spacing: 16) {
        ForEach(items) { item in
            Card(item)
                .containerRelativeFrame(.horizontal, count: 5, span: 4, spacing: 16)
        }
    }
    .scrollTargetLayout()
}
.contentMargins(.horizontal, 20, for: .scrollContent)
.scrollTargetBehavior(.viewAligned)
.scrollPosition(id: $selectedID)
```

**Use when:** next card peeks; page width < screen.

## Headers around a pager

```swift
// Simplest: header above pager
VStack(spacing: 0) {
    HeaderView(currentPage: current)
    pagerBody
}

// Or sticky inset
pagerBody
    .safeAreaInset(edge: .top) { HeaderView() }
    .safeAreaInset(edge: .bottom) { PageDots() }

// Or NavigationStack toolbar
NavigationStack {
    pagerBody
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Skip") { }
            }
        }
}
```

Pages size to the **scroll view** area (after header), not the full screen, unless you ignore safe area.

## API cheat sheet

| API | Min iOS |
| --- | --- |
| `TabView` + `.tabViewStyle(.page)` | 14 |
| `.scrollTargetBehavior(.paging / .viewAligned)` | 17 |
| `.scrollTargetLayout()`, `containerRelativeFrame`, `.scrollPosition(id:)` | 17 |
| `ScrollPosition`, `onScrollGeometryChange` | 18 |
| Liquid Glass / `scrollEdgeEffectStyle` (chrome only) | 26 |

**WWDC:** “Beyond scroll views” (2023), “What’s new in SwiftUI” (2023/2024).

---

# Toolbar leading / trailing / Spacer (research summary)

## Mental model

```
NavigationStack {
  Content
    .navigationTitle("Title")
    .toolbar { ToolbarItem / ToolbarItemGroup / ToolbarSpacer }
}
```

Top bar has three regions: **leading | center (title / principal) | trailing**.  
**Across the bar** → different placements. **Same edge** → group + (iOS 26) `ToolbarSpacer`.

## Placements beginners should know

| Placement | Meaning |
| --- | --- |
| `.topBarLeading` / `.topBarTrailing` | Explicit left/right (prefer over deprecated `.navigationBar*`) |
| `.principal` | Custom center content (replaces title when used) |
| `.bottomBar` | Bottom toolbar |
| `.cancellationAction` | Cancel/Close — system puts it correctly (often leading on iPhone) |
| `.confirmationAction` / `.primaryAction` | Save/Done/main action — often trailing on iPhone |
| `.secondaryAction` | Secondary tools; may overflow on iPhone |

Prefer **semantic** placements for modals (Cancel/Save). Prefer **positional** when you need exact edges.

## Classic leading ↔ trailing (no Spacer needed)

```swift
.toolbar {
    ToolbarItem(placement: .topBarLeading) {
        Button("Cancel") { dismiss() }
    }
    ToolbarItem(placement: .topBarTrailing) {
        Button("Save") { save() }
            .fontWeight(.semibold)
    }
}
```

The system already fills the middle. **Do not** put `Spacer()` inside a top-bar `ToolbarItem` — it does not work like `HStack`.

## Modal pattern (best practice)

```swift
.toolbar {
    ToolbarItem(placement: .cancellationAction) {
        Button("Cancel") { dismiss() }
    }
    ToolbarItem(placement: .confirmationAction) {
        Button("Save") { save(); dismiss() }
    }
}
```

## iOS 26: ToolbarSpacer + Liquid Glass grouping

```swift
.toolbar {
    ToolbarItem { ShareLink(item: url) }
    ToolbarSpacer(.fixed)                 // gap + separate glass groups
    ToolbarItem { FavoriteButton() }
    ToolbarItem { CollectionsButton() }   // related → stay grouped
    ToolbarSpacer(.fixed)
    ToolbarItem { InspectorToggle() }
}

// Bottom bar: push to opposite edges
ToolbarItem(placement: .bottomBar) { Button("Filter") { } }
ToolbarSpacer(.flexible, placement: .bottomBar)
ToolbarItem(placement: .bottomBar) { Button("Compose") { } }

// Static text / avatar without glass pill
ToolbarItem(placement: .topBarLeading) {
    Text("Good morning!").fixedSize()
}
.sharedBackgroundVisibility(.hidden)
```

| Tool | Role |
| --- | --- |
| `ToolbarSpacer(.fixed)` | Separate unrelated actions / glass chips |
| `ToolbarSpacer(.flexible)` | Expand like Spacer in one placement lane |
| `.sharedBackgroundVisibility(.hidden)` | No glass background on that item |

Availability: **iOS 26+**. Guard with `#available` if supporting older OS.

## Custom HStack header vs system toolbar

| | System `.toolbar` | Custom `HStack` + `Spacer()` |
| --- | --- | --- |
| Pros | Back button, overflow, Liquid Glass, cross-platform | Full layout control; Spacer works normally |
| Cons | Less pixel control; learn placements | No overflow; reimplement safe area / conventions |

**Default:** system `.toolbar`. Custom header only when design cannot be expressed with toolbar APIs.

## Beginner mistakes

- `.toolbar` on `NavigationStack` instead of inner content
- `Spacer()` inside top-bar toolbar items
- Raw `Button` in `.toolbar` without `ToolbarItem`
- Hardcoding Cancel/Save to trailing instead of semantic placements
- Mixing deprecated `.navigationBarLeading` in new code
