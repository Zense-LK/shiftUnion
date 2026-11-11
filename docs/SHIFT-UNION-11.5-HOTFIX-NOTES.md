# Shift Union 11.5 — Demo & Privacy Hotfix

## Scope and compatibility
This is a small update to the V11 optimized app. It retains the Playful card-fall animation (600 ms with 50 ms stagger), outward/inward synchronized content ripple, simple Clock button bounce, damped navigation pill, navigation positioning fix, original fonts, and existing launcher icon. Android application ID and signing configuration are unchanged. Android versionName is **11.5**; the existing CI workflow still assigns a monotonically increasing versionCode.

## Feature 1: Isolated Demo Mode
- Settings contains a Demo mode switch. A **DEMO** pill appears in the upper header **only** while the switch is active.
- A separate in-memory shift and allowance sandbox is created from sample entries. The app's actual shift array, active clock record, work type, allowance data, and cycle are retained in memory and restored verbatim upon exit.
- Demo clocking, shift editing and allowance changes are temporary; persistence of shift records, allowances, work type and cycle is suppressed. Restarting while Demo is enabled creates another sandbox without overwriting stored records.
- Backup export/import and pay-rule/cycle editing are disabled during Demo mode so simulated data cannot overwrite or be mistaken for real records.
- Demo preference is stored in the existing `v4ui` UI preferences. The real `log` storage key is not changed on demo entry/exit.

## Feature 2: Quick Privacy Mode
- A small eye/eye-slash button in the top-right header toggles privacy on any tab.
- Blur is applied to salary, net, overtime-pay, EPF and forecast figures in Home, Stats and Outlook, including the pay chart tooltip, prediction and strategy amounts.
- Only monetary fields are targeted, so card labels, times, controls and animations stay readable and interactive.
- The privacy preference is stored in `v4ui`, defaulting off. It is **visual obscuring**, not encryption or a security lock; values remain available to JavaScript, accessibility tools and backups.

## Performance and device rationale
The Galaxy A06 4G uses a MediaTek Helio G85 (2× Cortex-A75 + 6× Cortex-A55), Mali-G52 MC2 graphics and a 60 Hz, 720×1600 display. A 60 Hz refresh has a 16.7 ms frame budget. V11 had already solved the fixed-nav overflow/layout issue and reduced the icon font to 54.4 KB; these remain untouched.

The 11.5 update adds *revision-based tab rendering*: heavy Stats, Outlook, Logs and Allowance data are rendered when first viewed and then reused on repeat visits while the underlying data revision is unchanged. A real active shift triggers refresh after 30 s to avoid indefinitely stale estimates. Every data update through `build()` invalidates the cache. This removes repeated forecast/training and listing work from common tab-to-tab interactions without delaying initial response or changing the visual transitions.

Privacy is CSS-only and event-driven, with no polling or mutation observer. Demo state uses small in-memory object swaps rather than duplicating DOM trees or writing dummy data to disk. No permanent broad `will-change` layers or background computation loops were introduced.

## Tests performed
1. Node JavaScript syntax validation of both inline scripts: **pass**.
2. Headless Chromium at **360×800**, device-scale factor 2: Home, Stats, Outlook, Allowance, Logs, Settings navigation without JavaScript exceptions.
3. Privacy toggle: tested blur on Home net/today and Stats values; confirmed forecast, next-days pay and strategy amounts are blurred.
4. Demo Mode: seeded a real active shift, entered Demo, clicked Clock In, and confirmed persisted log entry count stayed at **1**. Exiting Demo restored the real Clock Out state.
5. Repeated rapid tab navigation: fixed bottom bar stayed at **y=728 px** throughout 20 navigations at 360×800.
6. Synthetic 56-shift benchmark, same desktop Chromium environment: repeated synchronous Outlook tab-entry work median **17.7 ms on V11** vs **9.9 ms on 11.5** (20 transitions per test). First Outlook entry was **93 ms** vs **55.8 ms** in that test. These are **environment-specific JavaScript measurements**, **not** verified on Galaxy A06; they do not establish device FPS, battery improvement or cold-start savings.

## Device research
- Device class and 60 Hz panel: https://www.notebookcheck.net/Samsung-Galaxy-A06.903521.0.html
- Layout thrashing and INP: https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
- Compositor-friendly animations: https://web.dev/articles/animations-and-performance
- Android startup and Baseline Profiles: https://developer.android.com/topic/performance/baselineprofiles/overview

Baseline Profiles are a promising future optimization but were **not** added here: generating and validating them properly requires a device-side profile/benchmark workflow. The user should measure cold launch, tab feel and any device-specific jank on the actual phone after installing 11.5.

## Upgrade guidance
Install the APK directly over V11 with the same signing key. **Do not uninstall** the app or clear its storage. Optional: export a backup before updating.
