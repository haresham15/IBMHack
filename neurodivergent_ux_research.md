# Neurodivergent UI/UX Design Research
### Deep Research: How Disorders Affect Students & What Design Best Serves Each

> **Goal**: Design digital learning pages that are maximally accessible, comfortable, and effective for students with neurodivergent conditions. Every recommendation here is grounded in peer-reviewed research, WCAG standards, and specialist accessibility guidelines.

---

## Overview: The Core Problem

Neurodivergent students are not "broken" neurotypical students — their brains process information differently. When a UI is designed only for neurotypical users, it creates **invisible barriers**: sensory overload, reading difficulties, navigation confusion, and anxiety. The right design doesn't just help disabled students survive — it helps them thrive equally.

The disorders covered here affect roughly **15–20% of the student population**. Many students are also **co-diagnosed** (e.g., ADHD + Dyslexia, ASD + Anxiety), which makes universal, customizable design the gold standard.

---

## 1. 🧠 ADHD (Attention Deficit Hyperactivity Disorder)

### How It Affects Students
ADHD is a neurological condition affecting **executive function, attention regulation, working memory, and impulse control**. It is one of the most prevalent neurodivergent conditions in schools.

| Domain | Student Experience |
|--------|-------------------|
| **Attention** | Cannot sustain focus on long blocks of uniform content; hyperfocuses on stimulating content |
| **Working Memory** | Difficulty holding multiple pieces of information simultaneously; forgets instructions mid-task |
| **Impulse Control** | May click links/buttons rapidly without reading; hard to stop and self-correct |
| **Time Perception** | Struggles to estimate how long tasks will take; time blindness is common |
| **Motivation** | Needs dopamine; bored by rote content but energized by interactive, gamified, or novel stimuli |
| **Distraction** | Peripheral visual elements, animations, and notifications derail attention instantly |

### Color Palette

| Role | Name | Hex | Why |
|------|------|-----|-----|
| Background | Soft Cloud White | `#F8F9FA` | Reduces glare vs. pure white |
| Background (alt) | Light Slate | `#EFF2F7` | Cool, neutral, non-stimulating |
| Primary Text | Deep Charcoal | `#2C2C2C` | Clear without harsh #000 contrast |
| Accent / CTA | Calm Sky Blue | `#4A90D9` | Stimulating enough to draw focus but not overwhelming |
| Highlight / Focus | Soft Amber | `#F5A623` | Warm focal attention cue (use sparingly) |
| Success | Muted Sage | `#5B9E6A` | Positive reward without overstimulation |
| Error | Muted Coral | `#D96B59` | Visible without triggering anxiety |
| Section Dividers | Light Gray | `#E4E7ED` | Structure without visual noise |

> [!IMPORTANT]
> **Avoid**: Bright red, neon green, flashing elements, auto-playing media, pop-ups, excessive animations.

### UI Layout Recommendations
- **Chunked content**: Break all content into small, discrete modules (max 150–200 words per section)
- **Progress indicators**: Always show where the student is in a task (e.g., "Step 2 of 5")
- **Single focus screens**: One primary action per screen — no competing CTAs
- **Persistent navigation**: Fixed sidebar/top nav so students never lose their place
- **Sticky task summaries**: Show what was last completed when returning to a page
- **No auto-advance**: Students control all progression; no timed slides
- **Auto-save**: Eliminate fear of losing work, which causes ADHD paralysis

### Typography
- Font: **Inter**, **Verdana**, or **Open Sans** — consistent, clean sans-serif
- Size: 16–18px body, 24px+ headings
- Line height: 1.6–1.8x
- Line length: 60–70 characters max per line
- **No justified text** — left-aligned only
- Bold for key terms; avoid italics and ALL CAPS

---

## 2. 🌈 ASD (Autism Spectrum Disorder)

### How It Affects Students
ASD affects **social communication, sensory processing, pattern recognition, and cognitive flexibility**. The spectrum is wide — some students require minimal support while others need significant accommodation. Almost all autistic students are impacted by **sensory sensitivities** in digital environments.

| Domain | Student Experience |
|--------|-------------------|
| **Sensory** | Bright colors, flickering animations, sounds cause genuine physical distress |
| **Predictability** | Unexpected layout changes or surprises cause anxiety and shutdown |
| **Literal Thinking** | Metaphors, idioms, sarcasm, and implied meaning are confusing |
| **Detail Focus** | Strong attention to specific details; may get "stuck" on small inconsistencies |
| **Navigation** | Needs to know exactly where they are and how to return to known ground |
| **Social Cues** | Cannot infer meaning from emoji, tone, or implied context |
| **Time** | May need extended time; countdown timers cause significant anxiety |

### Color Palette

| Role | Name | Hex | Why |
|------|------|-----|-----|
| Background | Warm Oat | `#F5F0E8` | Avoids clinical white; warm and calming |
| Background (alt) | Misty Beige | `#EDE8DF` | Neutral earth tone, zero harshness |
| Primary Text | Dark Earth | `#3A3028` | Warm dark, gentler than pure black |
| Accent | Soft Teal | `#4A9E9E` | Shorter wavelength = less brain stimulation |
| Secondary Accent | Sage Green | `#7CAE8C` | Biophilic (nature-inspired), calming |
| Highlight | Lavender Mist | `#9B8EC4` | Soft purple — used in autism-friendly design research |
| Success | Muted Green | `#6BA683` | Non-alarming positive feedback |
| Warning | Soft Ochre | `#C49B3C` | Warm caution without aggressive yellow |
| Error | Subdued Burgundy | `#8E3B3B` | Clear error signal without high arousal |

> [!CAUTION]
> **Strictly avoid**: Pure white (`#FFFFFF`), pure black (`#000000`), bright yellow, red, flashing elements, auto-playing audio, parallax scrolling, countdown timers.

### UI Layout Recommendations
- **Ultra-consistent layout**: Every page must look identical in structure — same header, same nav, same footer
- **No surprises**: Announcements, pop-ups, or modal dialogs should be avoided or opt-in only
- **Plain language only**: All text at a Flesch-Kincaid Grade 6–8 level; no metaphors, no sarcasm
- **Reduced motion**: All animations off by default with a clear toggle to enable
- **Explicit structure**: Use numbered steps, numbered lists, clearly labeled sections
- **Save state**: Always save position; remove timed-out sessions
- **Icons + text**: Never icons alone — always pair with a text label
- **Quiet mode**: A dedicated mode that strips non-essential UI elements

### Typography
- Font: **Atkinson Hyperlegible**, **Verdana**, or **Lexend**
- Very generous letter spacing (`letter-spacing: 0.05em`)
- Generous line height (1.7–2x)
- Paragraph max-width: 65ch
- No decorative or script fonts

---

## 3. 📖 Dyslexia

### How It Affects Students
Dyslexia is a language-based learning disability affecting **phonological processing, reading fluency, decoding, and spelling**. It affects 10–15% of the population and has no correlation with intelligence. In digital environments, it manifests as difficulty reading dense text, losing place in paragraphs, and letter/word transposition.

| Domain | Student Experience |
|--------|-------------------|
| **Reading** | Letters swim, flip, or blur — especially with high contrast |
| **Tracking** | Loses place mid-paragraph; jumps lines |
| **Decoding** | Sounding out unfamiliar words takes significant effort |
| **Spelling** | Cannot reliably spell, making text entry frustrating |
| **Visual Stress** | High-contrast black-on-white creates "visual snow" or glare |
| **Justified Text** | River effects in justified text make tracking near-impossible |
| **Working Memory** | Text read a moment ago may be forgotten before end of paragraph |

### Color Palette

| Role | Name | Hex | Why |
|------|------|-----|-----|
| Background | Cream | `#FDF6E3` | British Dyslexia Assoc. recommended cream |
| Background (alt) | Warm Off-White | `#F5F0DC` | Reduces "white glare" entirely |
| Background (dark mode) | Dark Warm Slate | `#1F1A14` | Warm dark avoids harsh cool contrast |
| Primary Text | Dark Espresso | `#1A1410` | Not pure black — warm dark |
| Text (dark mode) | Soft Cream | `#E8DDCC` | Sufficient contrast without white flash |
| Accent | Denim Blue | `#3B6FA0` | British Dyslexia Association standard |
| Highlight | Sunflower | `#F0C040` | Black + yellow is BDA's preferred combo |
| Success | Soft Green | `#5A8A5A` | — |
| Error | Warm Rust | `#B05030` | Avoids red-on-white harshness |

> [!TIP]
> The British Dyslexia Association specifically recommends a **black text on cream/yellow background** scheme. Users should always be able to switch between cream and dark mode.

### UI Layout Recommendations
- **Left-aligned text only** — never justified, never centered for body content
- **Short paragraphs**: Max 3–4 sentences; use subheadings liberally
- **Generous line spacing**: 1.5–2x for body text always
- **Text-to-speech**: Every text block must support TTS / read-aloud
- **OpenDyslexic toggle**: Offer an alternative font setting (OpenDyslexic, Lexend)
- **Line focus ruler**: An optional reading ruler/highlight that follows the user's reading line
- **No italic text**: Never use italics — use **bold** only for emphasis
- **No word wrap mid-word** (hyphenation off)
- **Bionic Reading** support: Optional mode where word stems are bolded
- **Wide content columns**: Avoid multi-column layouts for body text

### Typography
- Default Font: **Lexend**, **Open Sans**, or **Verdana**
- Optional: **OpenDyslexic** (user toggle)
- Size: **18–20px** body (larger than standard)
- Line height: **1.8x minimum**
- Letter spacing: `0.05–0.1em`
- Word spacing: `0.1em`
- **No serif fonts**, no decorative typefaces

---

## 4. 🔢 Dyscalculia

### How It Affects Students
Dyscalculia is a specific learning difficulty with **numerical processing, mathematical reasoning, and spatial relationships**. Students with dyscalculia are often intelligent and verbally articulate but struggle severely with anything numerical or spatially sequential.

| Domain | Student Experience |
|--------|-------------------|
| **Numbers** | Cannot easily distinguish numerals; transposes digits (43 → 34) |
| **Sequences** | Struggles with ordered sequences (steps, numbering, timelines) |
| **Spatial** | Difficulty interpreting charts, graphs, tables, and grids |
| **Time** | Clock-reading, scheduling, and time-ordering are challenging |
| **Estimation** | Cannot easily estimate quantities or proportions |
| **Progress** | Percentage-based progress indicators are confusing |
| **Forms** | Number-only inputs (phone, dates, IDs) cause significant friction |

### Color Palette

| Role | Name | Hex | Why |
|------|------|-----|-----|
| Background | Clean Linen | `#FAF7F2` | Neutral, non-clinical |
| Primary Text | Deep Navy | `#1E2A3A` | Clear, no harshness |
| Number Highlight | Vivid Indigo | `#4B5CCC` | Color-codes numbers for scanability |
| Comparison Color A | Sky Blue | `#5BA4CF` | For visual quantity comparisons |
| Comparison Color B | Warm Coral | `#E87553` | Visual contrast for grouped data |
| Progress Fill | Teal | `#2EB8B8` | Progress bars instead of percentages |
| Accent | Amber | `#F0A500` | Call-to-action; high visibility |
| Success | Muted Green | `#4E9B6E` | — |

### UI Layout Recommendations
- **Visual progress bars** always — never show "73%" alone; show a filled bar + optionally the number
- **Avoid timed anything** — no countdowns, no session timeouts during active use
- **Label all numbers in context**: "You are on Lesson 3 (of 10)" — not just "3/10"
- **Pre-fill known numbers**: If a student ID is known, auto-fill it — don't ask them to type it
- **Chunk sequences**: If listing 5 steps, group them visually (e.g., 2 + 2 + 1) rather than 1–5 in one list
- **Color-code data types**: A consistent color for dates, another for quantities, another for IDs
- **Avoid grids/tables where possible**: Use card-based layouts instead
- **Spelling out quantities**: Where possible, write "three" instead of "3" in prose contexts
- **Calculator access**: Always provide an accessible in-page calculator widget
- **Math read-aloud**: Any inline equations should have TTS available

### Typography
- Font: **Inter** or **Lexend** (clean numeral forms are critical)
- Use tabular numeral fonts where numbers stack in columns (CSS: `font-variant-numeric: tabular-nums`)
- Size: 16–18px; increase number size in key contexts (e.g., 20px for progress numbers)
- Avoid condensed fonts that make 1, l, I visually similar

---

## 5. 🏃 Dyspraxia (Developmental Coordination Disorder / DCD)

### How It Affects Students
Dyspraxia affects **motor coordination, planning and sequencing of physical movements, and spatial awareness**. In digital environments, this means difficulty with precise mouse/trackpad control, keyboard shortcuts, and drag-and-drop interactions.

| Domain | Student Experience |
|--------|-------------------|
| **Motor** | Inaccurate cursor control; difficulty clicking small targets |
| **Drag & Drop** | Nearly impossible — requires simultaneous precision motor coordination |
| **Typing** | Frequent typos; difficulty with key combinations (Ctrl+Shift+X) |
| **Forms** | Multi-field forms with precise cursor placement are exhausting |
| **Navigation** | Gets lost between pages; struggles to return to prior location |
| **Writing** | Handwriting/typing is effortful; prefers speech-to-text |
| **Processing** | May need extra time to plan and execute actions |

### Color Palette

| Role | Name | Hex | Why |
|------|------|-----|-----|
| Background | Soft Gray White | `#F4F4F8` | Clean, minimal distraction |
| Primary Text | Slate Gray | `#2D2D3A` | Standard readable dark |
| Interactive/Button | Ocean Blue | `#2563EB` | High-visibility, clearly interactive |
| Button Hover | Deep Blue | `#1D4ED8` | Clear state change feedback |
| Keyboard Focus Ring | Bright Amber | `#F59E0B` | Must be highly visible (`outline: 3px solid`) |
| Success | Forest Green | `#16A34A` | — |
| Error | Red | `#DC2626` | High visibility for error states |
| Section Zones | Light Blue-gray | `#E8EAF0` | Visual grouping cues |

> [!IMPORTANT]
> Focus rings (keyboard navigation indicators) must be **extremely visible** for dyspraxic users who rely on keyboard navigation when mouse control is unreliable.

### UI Layout Recommendations
- **Minimum 44×44px touch targets** for all buttons, links, and form controls (WCAG 2.5.5)
- **Zero drag-and-drop interactions** without a keyboard/button alternative
- **Large, widely spaced buttons** — never pack two CTAs close together
- **Full keyboard navigation**: Every interactive element reachable by Tab key
- **Tab order clarity**: Focus should move logically (top to bottom, left to right)
- **No hover-only menus**: All navigation accessible by click (not just hover)
- **Sticky headers**: Navigation always visible so students don't have to scroll back up
- **Error tolerance**: Form fields must have generous validation; accept reasonable format variations
- **Speech-to-text support**: All text inputs should support voice input natively
- **Undo support**: All destructive actions must be undoable

### Typography
- Font: **Atkinson Hyperlegible** or **Open Sans**
- Size: 18px+ (larger targets for focus)
- Extra-wide line height (1.7x) to reduce accidental tap/click of wrong line

---

## 6. 🌊 Sensory Processing Disorder (SPD)

### How It Affects Students
SPD affects how the brain **receives, organizes, and responds to sensory input**. Students may be hypersensitive (over-reactive) or hyposensitive (under-reactive) to visual, auditory, tactile, or proprioceptive stimuli. In digital environments, hypersensitivity is the dominant challenge.

| Domain | Student Experience |
|--------|-------------------|
| **Visual** | Bright screens, high contrast, and busy layouts cause physical discomfort |
| **Auditory** | Auto-playing audio or notification sounds cause startle/dysregulation |
| **Motion** | Scrolling parallax, animations, or moving elements cause nausea/distress |
| **Flickering** | Even low-level screen flicker or strobing effects are painful |
| **Overload** | Too many simultaneous inputs (text + animation + audio) causes shutdown |
| **Tactile** | Haptic feedback or vibrating devices can be overwhelming |
| **Recovery** | Needs longer to "reset" after a sensory triggering experience |

### Color Palette

| Role | Name | Hex | Why |
|------|------|-----|-----|
| Background | Hazy White | `#FAFBFC` | Barely off-white; gentle on hypersensitive vision |
| Background (low-sensory) | Deep Dusk | `#1A1D2E` | True dark mode for severe light sensitivity |
| Primary Text | Dark Dove | `#333545` | Cooler dark for bright-screen comfort |
| Text (dark mode) | Pale Lilac | `#DADAE8` | Easy on eyes in dark mode |
| Accent | Dusty Violet | `#7B6FA0` | Calming purple; lower saturation |
| Secondary | Muted Sage | `#7A9E82` | Nature-inspired, low arousal |
| Alert | Muted Amber | `#C9932A` | Visible without saturated yellow jolt |
| Success | Muted Teal | `#3B8A82` | — |
| Error | Subdued Crimson | `#9B3A3A` | Error signal with lower aggression |

> [!WARNING]
> Any animation, transition, or video **must** be disabled by default or offer a `prefers-reduced-motion` media query response. Do NOT default to motion-on.

### UI Layout Recommendations
- **Reduced motion by default**: Honor `prefers-reduced-motion` CSS media query always
- **No autoplay audio or video**: User must explicitly choose to play media
- **Brightness control**: In-page brightness slider or offer a "Low Light Mode"
- **Sound controls**: Any page with audio must have volume control + mute prominently available
- **Sparse layout**: Maximum whitespace; absolute minimum of content on screen at once
- **Single-column layouts**: No multi-column or grid-heavy content
- **No pop-ups or modals**: All page changes should be smooth and predictable
- **Dim inactive elements**: Visual focus mode that dims non-focused content to 20% opacity
- **No background patterns or textures**: Flat color backgrounds only

### Typography
- Font: **Inter** or **Lexend** — smooth, regular, nothing jagged
- Size: Adjustable by user (16–24px range slider)
- Line height: 1.7x default
- Avoid letter-spacing extremes (tight or very wide)

---

## 7. 😰 Anxiety Disorders & OCD

### How It Affects Students
Anxiety disorders (GAD, Social Anxiety, Panic Disorder) and OCD affect how students **perceive and interpret uncertainty, errors, and pressure**. In digital contexts, poorly designed feedback, timeouts, and unclear navigation trigger anxiety responses that can prevent task completion entirely.

| Domain | Student Experience |
|--------|-------------------|
| **Error States** | Harsh error messages feel like personal failure; may abandon task |
| **Pressure** | Countdown timers, progress percentages ("you're only 20% done") create panic |
| **Uncertainty** | Unclear navigation ("where does this button go?") triggers avoidance |
| **Feedback** | Lack of clear confirmation feedback ("did it save?") creates rumination |
| **Repetition** | OCD students may feel compelled to re-read, re-check, or repeat steps |
| **Social** | Visible peer comparisons or social scoreboards cause intense anxiety |
| **Control** | Feeling out of control of the page/flow triggers freeze response |

### Color Palette

| Role | Name | Hex | Why |
|------|------|-----|-----|
| Background | Sea Salt | `#D7E2E8` (tinted) / `#F5F7FA` | WGSN's calming "sea salt" blue-white |
| Background (primary) | Cloud | `#F5F8FB` | Light, airy, open feeling |
| Primary Text | Ink | `#1E2533` | Clear without anxiety-inducing harsh black |
| Accent | Teal Calm | `#069494` | Associated with mental health and calm |
| Secondary | Lavender | `#8B7BC8` | Soft purple; used in mental health UI |
| Positive Feedback | Gentle Green | `#5D9E73` | Warm, not clinical |
| Neutral/Info | Dusty Blue | `#6B8CAE` | Non-alarming informational color |
| Error | Warm Amber | `#D4882C` | **Never red for errors** — amber is firm but not frightening |
| Gentle Warning | Peach | `#F5A882` | — |

> [!NOTE]
> For anxiety/OCD specifically, **error design** is the most critical element. Red error messages with harsh language ("INVALID INPUT!") are genuinely harmful. Use amber, soft tones, and gentle language like "Let's try that again."

### UI Layout Recommendations
- **Predictable navigation**: Every page follows identical structural patterns
- **Explicit save confirmations**: "✓ Your work has been saved" after every action
- **No timers**: Eliminate all countdowns; if time-limited, say "You have plenty of time"
- **No social comparisons**: Remove leaderboards, peer rankings, public scores
- **Positive error language**: "Hmm, that didn't work — here's what to try:" vs "Error: Invalid"
- **No data loss**: Accidental browser-back should never lose work
- **Step-by-step with exit**: Flow must allow pausing without penalty
- **Opt-in notifications**: Never surface unexpected notifications or alerts
- **Escape routes**: Every multi-step process must have a "Save and come back later" option
- **Reassuring copy**: Microcopy should be warm, encouraging, and explicit

### Typography
- Font: **Inter** or **Nunito** (rounded terminals feel more approachable)
- Size: 16–18px
- Line height: 1.7x
- Headings: Warm, slightly rounded fonts (not sharp geometric ones)

---

## Cross-Disorder Comparison

| Feature | ADHD | ASD | Dyslexia | Dyscalculia | Dyspraxia | SPD | Anxiety/OCD |
|---------|------|-----|----------|-------------|-----------|-----|-------------|
| **Background** | Off-white | Warm oat/beige | Cream/yellow | Clean linen | Gray-white | Hazy white | Cloud white |
| **Text Color** | Deep charcoal | Warm dark | Dark espresso | Deep navy | Slate gray | Dark dove | Ink |
| **Accent** | Sky blue | Soft teal | Denim blue | Indigo | Ocean blue | Dusty violet | Teal calm |
| **Avoid** | Red, neon, flash | Pure white, yellow, red | High contrast, serif | Grids, timers | Small targets | Any motion | Red errors, timers |
| **Font Family** | Inter, Verdana | Atkinson, Lexend | Lexend, OpenDyslexic | Inter (tabular) | Atkinson | Inter, Lexend | Inter, Nunito |
| **Font Size** | 16–18px | 16–18px | **18–20px** | 16–18px | **18px+** | 16–24px | 16–18px |
| **Line Height** | 1.6–1.8x | 1.7–2x | **1.8x** | 1.6x | 1.7x | 1.7x | 1.7x |
| **Motion** | Disable by default | **Strict off** | Disable | Disable | Disable | **Strict off** | Disable |
| **Timers** | ⚠️ Avoid | ❌ Never | ⚠️ Avoid | ❌ Never | ⚠️ Avoid | ⚠️ Avoid | ❌ Never |
| **TTS (Read Aloud)** | ✅ High value | ✅ High value | 🔴 **Critical** | ✅ High value | 🔴 **Critical** | ✅ Helpful | ✅ Helpful |
| **Progress Bars** | ✅ Required | ✅ Required | ✅ Helpful | 🔴 **Visual only** | ✅ Required | ✅ Required | ✅ Reassuring |
| **Keyboard Nav** | ✅ | ✅ | ✅ | ✅ | 🔴 **Critical** | ✅ | ✅ |

---

## Universal Design Principles (Apply to All)

These recommendations improve experience for **every** user, especially neurodivergent students:

> [!TIP]
> The best accessibility features are ones built into the default experience — not hidden in a settings menu.

1. **Customization Panel**: Always offer a floating accessibility widget that lets users toggle:
   - Font size slider
   - Color theme (cream / dark / high-contrast)
   - Motion on/off
   - Read-aloud on/off
   - Dyslexia-friendly font on/off
   - Reduced information density mode

2. **WCAG 2.1 AA minimum**: All text contrast must be ≥ 4.5:1. Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

3. **Plain Language Standard**: Every instruction and UI label should pass [Hemingway App](https://hemingwayapp.com/) at Grade 6–8.

4. **No information conveyed by color alone**: Every color cue must have a second channel (icon, text, shape).

5. **Multimodal content**: Text + audio + visual diagram for every key concept.

6. **Responsive & keyboard-first**: Never assume mouse use.

7. **Session persistence**: Never destroy a student's work due to timeout or navigation.

8. **Positive framing**: No language that implies failure — always solution-focused.

---

## Practical Priority Order for Implementation

If implementing all of this at once is not feasible, prioritize in this order:

| Priority | Feature | Why |
|----------|---------|-----|
| 🔴 1 | **Cream/dark mode toggle** | Helps dyslexia, ASD, SPD immediately |
| 🔴 2 | **Motion off by default** | Critical for SPD and ASD |
| 🔴 3 | **TTS (Text-to-Speech)** | Critical for dyslexia, high value for all |
| 🔴 4 | **Minimum 44px touch targets** | Critical for dyspraxia |
| 🟡 5 | **Font size slider** | High value for all conditions |
| 🟡 6 | **Remove countdowns/timers** | Helps ADHD, anxiety, dyscalculia |
| 🟡 7 | **OpenDyslexic font option** | High value for dyslexia |
| 🟢 8 | **Progress visualization** | Helps ADHD, dyscalculia, anxiety |
| 🟢 9 | **Keyboard navigation audit** | Critical for dyspraxia |
| 🟢 10 | **Microcopy language review** | Critical for anxiety/OCD |

---

*Sources: British Dyslexia Association, WCAG 2.1 Guidelines, W3C Cognitive Accessibility, Microsoft Inclusive Design, Understood.org, UX Planet, UX Design CC, Smart Interface Design Patterns, WGSN Color Psychology, Milliken Research on Neurodivergence and Color, ResearchGate studies on ASD and UI.*
