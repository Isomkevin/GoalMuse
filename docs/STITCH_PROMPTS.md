# Stitch Prompts for GoalMuse

**Stitch project (MCP-generated):** Project ID `9765902665773119980` — open in [Google Stitch](https://stitch.google.com) to view and export all screens. All 12 screen types below were generated via Stitch MCP with GEMINI_3_FLASH; each design includes screenshots and optional HTML export URLs.

Use these prompts in **Google Stitch** (Generate from text). For each screen:
- **Device type:** MOBILE  
- **Model:** GEMINI_3_PRO (for best quality) or GEMINI_3_FLASH (faster)

**Design system to apply across all screens:**  
GoalMuse is a premium goal and vision-board app. Use a **refined, calm aesthetic**: soft gradients or subtle glassmorphism, generous whitespace, rounded corners (16–20px), a cohesive palette (e.g. deep teal/cyan primary `#0a7ea4`, soft blues/grays for cards, warm white or very light gray backgrounds). Typography: clear hierarchy with a distinctive but readable sans (e.g. SF Pro–style or similar). Use subtle shadows and gentle borders. Avoid clutter; every element should feel intentional. Support both light and dark mode where it makes sense.

---

## 1. Login

**Prompt:**

```
Mobile app login screen for GoalMuse, a vision board and goals app. Top-tier, world-class UI.

Layout: Centered content with plenty of breathing room. At top: app name "GoalMuse" in large, confident type; below it a short tagline like "Your vision, one board." Two input fields: Email and Password, with rounded corners and soft borders. Primary button: "Log in" (full width, teal/cyan). Below: a subtle text link "Create account". Optional: very subtle background gradient or soft pattern so it feels premium, not flat. Include a small demo hint (e.g. "Demo: demo@goalmuse.app") in muted text. Error state: red text below form. Loading state: button shows "Signing in…" and is disabled.

Style: Calm, trustworthy, minimal. No clutter. Generous padding. Inputs should feel touch-friendly (min 48pt height). Support both light theme (default) and consider dark mode with dark background and light text.
```

---

## 2. Register

**Prompt:**

```
Mobile app sign-up screen for GoalMuse. Same visual family as login: premium, calm, minimal.

Layout: Header with "Create account" as main title and "Start your vision board." as subtitle. Two fields: Email and Password. Primary button "Create account" (full width). Footer link "Already have an account? Log in". Error message area below form. Use same spacing, rounded inputs, and teal primary button as the login screen so the two screens feel like one design system.

Style: Match login—soft background, clear typography hierarchy, no visual noise. World-class onboarding feel.
```

---

## 3. Board list (Vision boards home)

**Prompt:**

```
Mobile app screen: list of the user's vision boards for GoalMuse.

Layout: Screen title "Vision boards" or "My boards" in header. List of board cards: each card shows board title (e.g. "2025 Resolutions", "Career") and optionally a small goal count or "3 goals". Cards are tappable, with subtle shadow or border and rounded corners (16px). At bottom of list or in header: prominent "Add board" or "+ New board" button. If list is empty: friendly empty state—illustration or icon, headline "No boards yet", short message "Create your first vision board to start.", and one primary button "Create board".

Style: Clean cards on light background. Consistent with GoalMuse: teal accents, generous padding, premium feel. Each board card should feel inviting to tap.
```

---

## 4. Vision Board detail (single board + goals)

**Prompt:**

```
Mobile app screen: single vision board view showing its goals for GoalMuse.

Layout: Header with board title (e.g. "2025 Resolutions") and subtitle like "4 goals". Optional: board switcher or back to boards. Main content: grid of goal cards (2 columns on mobile). Each card: goal title (bold), optional one-line description, optional target date. Cards are tappable. Floating or header "Add goal" button. If no goals: empty state with headline "No goals on this board", message "Add goals to build your vision.", and primary button "Add goal".

Style: Card grid with consistent spacing. Cards: soft background (e.g. very light blue/teal tint), rounded corners, subtle border or shadow. Top-tier, calm, aspirational feel—like a digital vision board.
```

---

## 5. Goals list (all goals for current board)

**Prompt:**

```
Mobile app screen: list of all goals for the current vision board in GoalMuse.

Layout: Title "Goals" in header. "Add goal" primary button at top. Scrollable list of goal cards (single column). Each card: goal title, optional description (2 lines max), optional target date "By Dec 31, 2025". Cards are tappable for edit. If empty: empty state "No goals yet", "Add your first goal to get started.", button "Add goal".

Style: Same design system—rounded cards, soft borders, teal accents. List should feel scannable and premium.
```

---

## 6. Add goal (form)

**Prompt:**

```
Mobile app form screen: add a new goal in GoalMuse.

Layout: Screen title "New goal". Form fields: (1) "Goal" — single line, placeholder "e.g. Speak at a global event". (2) "Description (optional)" — multiline, placeholder "What does success look like?". (3) "Target date (optional)" — single line, placeholder "YYYY-MM-DD" or "Pick a date". Primary button at bottom: "Save goal" (full width). All inputs rounded, comfortable padding. Secondary/cancel in nav only.

Style: Clean form. Labels above fields, consistent spacing. Same teal primary button and input style as rest of app. World-class form UX.
```

---

## 7. Edit goal (form + delete)

**Prompt:**

```
Mobile app form screen: edit an existing goal in GoalMuse.

Layout: Same as Add goal—title "Edit goal", fields: Goal (title), Description, Target date. Primary button "Save changes" (full width). Below it: text link or subtle button "Delete goal" in red/destructive color. No confirmation dialog in the design; just show the delete option clearly.

Style: Match Add goal. Delete action should be visible but not dominant. Premium, clear hierarchy.
```

---

## 8. Tasks & Journal (tabbed)

**Prompt:**

```
Mobile app screen: Tasks and Journal in one screen with two tabs for GoalMuse.

Layout: Segmented control or pill tabs at top: "Tasks" | "Journal". 

Tasks tab: Quick-add row—text input "Add a task…" and "Add" button. Below: list of tasks. Each row: checkbox (empty or checked), task title. Tapping row toggles complete (strikethrough when done). Optional: swipe or long-press to delete. Empty state: "No tasks yet", "Add daily tasks to track progress."

Journal tab: Text area placeholder "What did you do today?" and "Save entry" button. Below: list of journal entries. Each entry card: date (e.g. "Today", "Yesterday", "Jan 15") and content text. Newest on top. Empty state: "No journal entries", "Write a short note to track your days."

Style: Tabs clearly selected (e.g. teal fill). Tasks and entries in cards or rows with consistent spacing. Same premium, calm GoalMuse look.
```

---

## 9. Insights (AI + progress)

**Prompt:**

```
Mobile app screen: AI insights and progress for GoalMuse. Pull-to-refresh.

Layout: Scrollable. (1) Progress confidence card: headline "Progress confidence", subtitle "Not just task count—momentum & alignment". Large score "72" with "/ 100". Short explanation text. Expandable or visible "How it's calculated": Task completion, Consistency, Alignment, Clarity of next step with percentages. (2) Task completion: "Task completion" title, progress bar (e.g. 60% filled), "60% tasks done", "6 of 10 tasks completed". (3) Section "By goal": for each goal, a small card with goal name, progress bar, "3/5 tasks · 60%". (4) Section "Alignment": score and short explanation. (5) Section "Goal synergy": explanation and bullet list of synergies; optional "Compound actions" list. (6) "Next action" card: highlighted (e.g. teal background), one sentence action and one sentence reason. (7) "Did this help?" with three buttons: Yes | Somewhat | No. After tap: "Thanks for your feedback."

Style: Cards for each section. Clear typography hierarchy. Next action card should stand out. Confidence and progress feel motivating, not overwhelming. Premium, data-rich but readable.
```

---

## 10. Voice (three flows)

**Prompt:**

```
Mobile app screen: Voice features for GoalMuse—three distinct flows.

Layout: Short intro line at top: "Voice augments your board. Use one flow at a time."

Three stacked cards:

(1) Morning planning — Title "Morning planning". Description "Hear your focus and add one intention by voice." Primary button "Start my day" (with sun icon). When active: "Say your intention" mic button and "Stop & add task" stop button; optional status "Recording…".

(2) End-of-day reflection — Title "End-of-day reflection". Description "Say a few words about your day; saved as a journal entry." Primary button "Reflect on today" (moon icon). When active: "Start recording" and "Stop & save"; optional "Recording…".

(3) Gentle nudge — Title "Gentle nudge". Description "Hear your next action and why it matters." Primary button "Read my next action" (volume icon).

Optional: small error banner at top (dismissible). Optional: sticky status bar when speaking or recording ("Stop playback" or recording dot).

Style: Each card same style—rounded, soft background. Buttons with icons. Calm, encouraging. Premium mobile UX.
```

---

## 11. Account (modal)

**Prompt:**

```
Mobile app modal/sheet: Account screen for GoalMuse.

Layout: Title "Account" at top. User email displayed (e.g. "you@example.com") in slightly muted text. Single primary action: "Log out" button (full width, can be secondary/destructive style—e.g. outline or red). Minimal; no settings list unless you add "Edit profile" or "Privacy" as optional.

Style: Clean modal. Same spacing and typography as rest of app. Feels secure and simple.
```

---

## 12. Not found (404)

**Prompt:**

```
Mobile app error screen: 404 / Not found for GoalMuse.

Layout: Centered content. Headline "This screen doesn't exist." or "Page not found." One primary link/button: "Go to home" or "Back to GoalMuse". Optional small illustration or icon. No navbar.

Style: Friendly, not alarming. Same teal accent for the link. Minimal and clear.
```

---

## Implementation order (for Cursor)

After you generate and export from Stitch (or take screenshots/specs), implement in this order so the app stays consistent:

1. Design tokens (Colors, spacing, typography) from one Stitch screen.
2. Auth: Login → Register.
3. Boards: Board list → Board detail (vision board).
4. Goals: Goals list → Add goal → Edit goal.
5. Tasks & Journal: Single screen with Tasks and Journal tabs.
6. Insights: Full insights screen with confidence, progress, AI sections, feedback.
7. Voice: Three-flow voice screen.
8. Account modal.
9. Not found.

Use Stitch’s export (code or assets) where available; otherwise replicate layout and style from the generated screens in React Native / Expo.