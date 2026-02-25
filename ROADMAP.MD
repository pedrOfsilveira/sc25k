# SC25K Roadmap

_Last updated: 2026-02-25_

## Goal
Ship a stable, delightful, and sticky retro C25K app that improves completion rates, user retention, and social growth.

## Success Metrics
- **Activation:** % of new users who complete first run in 48h
- **Retention:** D7 / D30 active users
- **Completion:** % of users finishing all 27 runs
- **Engagement:** Runs per active user per week
- **Monetization Loop (XP economy):** Shop purchases per active user
- **Quality:** Crash-free sessions, Lighthouse PWA/Perf/A11y scores

---

## Phase 1 — Stabilize Core (Week 1)
**Objective:** Eliminate trust-breaking bugs and clean technical debt that blocks shipping.

### Must-do
- [X] Fix history status mismatch (`CANCELADO` vs `CANCELED`) in [src/layouts/MainLayout.vue](src/layouts/MainLayout.vue)
- [X] Remove residual org mechanics from app flow and data layer (routing/store filters, ranking queries, profile fields, and any org-specific guards)
- [X] Remove duplicate `loadCompletedDaysFromDB()` boot calls between [src/App.vue](src/App.vue) and [src/boot/auth-init.js](src/boot/auth-init.js)
- [X] Fix `.mario-font` mapping in [src/css/app.scss](src/css/app.scss)
- [X] Add shop price validation (`min=1`, sane max) in [src/pages/ShopPage.vue](src/pages/ShopPage.vue)
- [X] Resolve shop recipient identity issue (move from name-based to user-id-based offers)

### Nice-to-have
- [X] Remove unused assets from `src/assets`

### Exit criteria
- History totals are correct after completed/canceled runs
- No org-scoped logic remains in active product behavior
- No duplicate completion-data fetch on startup
- Impossible to create invalid shop offers
- Name changes do not break incoming offers

---

## Phase 2 — Usability & Reliability (Weeks 2–3)
**Objective:** Reduce friction and increase confidence in daily use.

### Must-do
- [X] Add **Forgot Password** flow in [src/pages/LoginPage.vue](src/pages/LoginPage.vue)
- [X] Add offline/online status banner and error toasts for failed sync actions
- [X] Add first-run onboarding (2–3 steps) on [src/pages/IndexPage.vue](src/pages/IndexPage.vue)
- [X] Add manual refresh actions for ranking/shop data
- [X] Add pre-run workout summary confirmation before timer starts
- [X] Decide and implement repeat-run policy (full XP, partial XP, or no XP) — **50% XP for repeats**

### Nice-to-have
- [X] "What changed" micro-copy in dialogs for clearer feedback

### Exit criteria
- User can recover account without support
- Offline state is visible and understandable
- First-time user can complete first run without confusion

---

## Phase 3 — Engagement & Fun (Weeks 4–5)
**Objective:** Increase retention and make progress feel rewarding.

### Must-do
- [X] Expand badges from 4 to ~10 meaningful milestones
- [X] Add stronger completion celebration (confetti + animated XP + improved jingle)
- [X] Add weekly progress summary card (runs done, XP earned, streak)
- [X] Add shareable completion/badge card via Web Share API
- [X] Add settings toggle for sound/vibration

### Nice-to-have
- [ ] Add simple calendar heatmap of run history
- [ ] Add optional “bonus run” system for completed days

### Exit criteria
- Badge unlocks happen regularly through first 3 weeks
- Completion screens generate shares
- Users can tailor feedback intensity (sound/vibration)

---

## Phase 4 — Performance & Polish (Week 6)
**Objective:** Improve load speed and app feel before broader promotion.

### Must-do
- [ ] Scope leaking styles in [src/pages/IndexPage.vue](src/pages/IndexPage.vue) and [src/pages/LoginPage.vue](src/pages/LoginPage.vue)
- [ ] Deduplicate repeated SNES button/card CSS into shared styles/components
- [ ] Lazy-load week assets instead of eager loading all images
- [ ] Reduce font payload (remove unused fonts, ensure `font-display: swap`)
- [ ] Replace `animations: 'all'` with only used Quasar animations
- [ ] Consolidate direct Supabase calls into services layer

### Nice-to-have
- [ ] Add route transitions for native-feeling navigation
- [ ] Replace loading spinners with skeletons where useful

### Exit criteria
- Improved first-load time on mid-range mobile
- No global style collisions from page-local UI
- Cleaner data access boundaries (pages → services/stores)

---

## Phase 5 — Accessibility & Ship Readiness (Week 7)
**Objective:** Make the app broadly usable and launch-ready.

### Must-do
- [ ] Add ARIA labels for custom interactive controls
- [ ] Improve focus-visible styles for keyboard navigation
- [ ] Improve contrast on dark surfaces to WCAG-friendly levels
- [ ] Remove/relax `user-scalable=no` where possible
- [ ] Finalize PWA manifest metadata/screenshots
- [ ] Add core product analytics events (start/complete/cancel run, purchase, badge unlock)
- [ ] Run release checks: `quasar build -m pwa`, install-flow QA, offline QA, Lighthouse audit

### Nice-to-have
- [ ] Add “What’s New” modal after update

### Exit criteria
- Lighthouse PWA passes, performance and accessibility improved
- Keyboard/screen-reader basics work on key flows
- Install + offline behavior validated on iOS and Android

---

## Backlog (Post-Launch)
- Push reminders/notifications (training day nudges)
- Runtime caching + background sync via InjectManifest service worker
- XP leaderboard mode (alongside completion leaderboard)
- Team challenges / seasonal events
- Full i18n (EN/PT-BR)

---

## Implementation Order (Priority)
1. **Correctness fixes** (Phase 1)
2. **Password recovery + onboarding + offline UX** (Phase 2)
3. **Celebration/badges/sharing** (Phase 3)
4. **Performance and CSS debt cleanup** (Phase 4)
5. **A11y + launch QA + analytics instrumentation** (Phase 5)

---

## Notes
- Keep scope tight: finish each phase’s **Must-do** list before moving forward.
- Prefer small PRs grouped by feature area (auth, training, shop, profile, shell).
- Track metrics weekly and adjust roadmap based on user behavior (not assumptions).
