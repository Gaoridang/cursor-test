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
