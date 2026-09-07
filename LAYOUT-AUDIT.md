# Layout audit — shell v3

## Evidence and limits

The pre-change audit inspected computed styles and rectangles of every rendered node on training, sleep and history pages: html/body/main, sections/cards, forms, labels, inputs, textareas, buttons, every flex/grid child, exercise cards and navigation. This project uses `.grid2`; it did not contain fieldsets, selects, `.form-grid` or `.form-field` before this change. No fixed viewport-width form, 100vw, or 100vh was found. The fixed pixel sizes found on stepper buttons and logo are intentional touch/icon dimensions.

At 390×844 in desktop WebKit, the old sleep card was x=16…374; its content was x=33…357; inputs were x=33…357 and 52px high. The enclosing label plus input was 80px high, not an 80px input. This engine did **not** reproduce the user's physical iPhone overflow. Its specific trigger cannot honestly be stated as proven without examining that device's computed layout and served asset versions.

The audit did reproduce navigation occlusion: after the old first set completion button called `scrollIntoView({block:'end'})`, its bottom was 844.42px, while navigation began at 772px. Main bottom padding only provided room at the end of the document; it did not reserve a safe region for intermediate scroll targets.

## Sizing defects and corrective constraints

- The original `.grid2` used `1fr 1fr`, retaining an automatic minimum track size. Only some children were explicitly allowed to shrink. Now tracks use `minmax(0,1fr)` and the actual flex/grid child selectors consistently use `min-width:0`. This was a source-level risk; oversized min-content tracks were not reproduced in this desktop-WebKit fixture.
- Form width constraints were fragmented: only date/time explicitly had max-width on phones, and there was no independent inline-size wrapper. All input/select/textarea now have block display, width/max-width 100%, min-width 0 and border-box sizing.
- Generic fields now have `.form-field > .input-wrap`. On phones the wrapper is a definite, shrinkable 100% block with `contain:inline-size`, so native date/time intrinsic width does not contribute to ancestor sizing. Native date/time appearance is normalized, while the input types and picker interaction remain intact. This addresses intrinsic-size risk, not a claim to have reproduced the particular iOS defect.
- Ordinary phone inputs are explicitly height/min-height 52px and 16px or larger. Sleep spacing is 18px between fields and 7px from label to control. Cards have 16px padding and are not clipped.
- Header and main share `.app-container`, max-width 680px, and phone inline padding 16px. Pseudo-elements join the global border-box reset. html/body use overflow-x:clip defensively; the automated test overrides it to visible to prove it is not hiding defects.
- Existing desktop textarea inline-baseline space is retained as label bottom padding after block normalization. Tablet and desktop card/control geometry is checked against the previous app with 1px tolerance; WebKit textarea baseline rounding differs by 0.203px.

## Navigation

ResizeObserver measures the navigation's complete border-box height, including safe-area padding, into `--bottom-nav-height`. Current normal height is 72px; a simulated 34px bottom safe area produces 106px. This measured value is not counted twice with env().

Main reserves measured height + 32px. Root scroll-padding-bottom reserves measured height + 24px, so native scrollIntoView targets stop above navigation. The fallback before measurement is 72px + env(safe-area-inset-bottom). Visual viewport resize remeasures and brings a focused form control into view. Fixed navigation and native pickers remain enabled. Existing dialog heights use dvh; no 100vh dependency was introduced.

Fixed navigation necessarily occupies part of the viewport while manually scrolling. The guarantee tested here is that all requested targets can be scrolled completely into the unobscured area, including intermediate sets, not just the last page element.

## Validation scope

See tests/layout.cjs, tests/layout-results.json and TESTING.md. Browser-toolbar and standalone-safe-area cases are geometry simulations, not execution inside actual iOS Safari/PWA. Device address bars, keyboard animation, home-screen installation and exact native picker rendering remain physical-device checks.
