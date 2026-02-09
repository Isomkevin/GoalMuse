# GoalMuse Design Decisions — Stitch → Expo

## A. Login & Registration Design Selection

### Chosen designs

- **Login:** **GoalMuse Premium Login Screen** (Stitch screen ID `4b47357bec7741fbbaf7b305c186c003`)
- **Registration:** **GoalMuse Premium Sign-up Screen** (Stitch screen ID `66e829aef2da4d2ea6a06355b802d303`)

### Why these were chosen

1. **Consistent pair** — Both are named "Premium", which in the Stitch set indicates the same design language and level of polish. Using one login and one register from the same tier keeps auth feeling like a single, cohesive flow.
2. **Clarity** — Premium variants typically emphasize hierarchy (clear title, subtitle, inputs, single primary CTA) and reduce visual noise, which fits GoalMuse’s calm, focused positioning.
3. **Emotional tone** — GoalMuse is a long-term goal companion; auth should feel trustworthy and encouraging. The Premium set aligns with that more than potentially busier or more generic base variants.
4. **Friction minimization** — Premium flows usually avoid extra steps and keep the path to "Create account" and "Log in" obvious and thumb-friendly.
5. **Scalability** — A single, well-defined auth system (Premium) is easier to extend (e.g. "Forgot password", SSO) without redesigning.

### Why others were rejected

- **GoalMuse Login Screen / GoalMuse Register Screen** — Treated as the base set; Premium was chosen for the higher bar and consistency with "production-grade" UI.
- **GoalMuse Login Screen Variant 1 & 2** — Redundant with the chosen Premium login; avoiding multiple login UIs keeps the codebase and UX consistent.

---

## B. Design System Definition

Aligned with Stitch project **9765902665773119980**:

- **Primary:** `#13b6ec` (Stitch `customColor`)
- **Font:** Inter-style (system or loaded Inter)
- **Roundness:** 8dp base (Stitch `ROUND_EIGHT`); 12px for inputs/buttons for touch comfort
- **Mode:** Light (default); dark can be added later with same tokens)

### Tokens (see `frontend/theme/tokens.ts`)

- **Colors:** primary, primaryDark, primaryLight, background, surface, border, text scale, error/success
- **Spacing:** 4–48px scale (xxs → xxl)
- **Radius:** sm 8, md 12, lg 16, xl 20
- **Typography:** hero, title, title2, body, callout, footnote, caption
- **Touch:** minimum 44pt tap targets

### Component usage

- **Buttons:** Primary = filled primary color; full-width on auth; disabled opacity 0.5.
- **Inputs:** Surface bg, border, 12px radius, 48pt+ height, focus border primary.
- **Cards/containers:** Surface or backgroundElevated, radius.md/lg, subtle border or shadow.
- **Links:** Primary color, medium weight; no underline by default.

---

## C. UX Improvements Over Stitch

1. **Keyboard & safe area** — KeyboardAvoidingView and SafeAreaView so inputs stay visible and CTAs remain reachable on notched devices.
2. **Loading & error states** — Button shows "Signing in…" / "Creating account…" and is disabled; error message below form; no double submit.
3. **Demo hint** — Login keeps a small "Demo: …" line to reduce support friction in development and demos.
4. **Link affordance** — "Create account" / "Already have an account? Log in" use press opacity so tap feedback is clear.
5. **No pixel-perfect copy** — Spacing and typography are implemented with the token system so the app stays consistent and maintainable rather than matching a single static mock exactly.
6. **One-hand use** — Primary actions placed in thumb zone; full-width buttons; sufficient padding and touch targets.

---

## D. Implementation Notes

- Auth screens use the same layout structure: header (title + subtitle) → form (inputs + error + CTA) → footer (link). Register omits demo hint.
- All auth colors, spacing, and radii come from `theme/tokens.ts`. Shared components (PrimaryButton, Input) consume these tokens so the rest of the app can adopt the same system.
- Stitch exports (HTML/screenshots) were used as reference for hierarchy and tone; the live implementation is the source of truth for layout and behavior on device.
