# design/

Capture sources. **Nothing in this directory is built, bundled or served** — it
sits outside `src/` and outside `public/` on purpose, so a file here can never
be fetched from the live site.

## electrocup-teaser-v5.html

The reference recording of the 30-second teaser: a single self-contained page
with its own HUD (Play / ratio / Hide UI) for capturing footage at 1920×1080 or
1080×1920.

**Do not edit it to suit the site.** It is the thing the live component is
checked against. If a beat, a timing or a colour has to change, change it here
first and port the change across, so the capture and the site never disagree
about what the teaser is.

The live port is `src/components/teaser/Teaser.tsx`. It differs from this file
in exactly four ways, all deliberate:

1. The HUD is gone. Playback is driven by visibility instead.
2. The end card reads the registration state from `src/data/static.ts` rather
   than hard-coding a date, and shows a working REGISTER NOW link once sign-ups
   are open.
3. The slot-claim beat reads club codes from `CLUBS` (Group A first, then Group
   B) rather than a second hard-coded list that could drift from the real one.
4. Everything is scoped under `.ec-teaser`. The capture uses class names like
   `.grid`, `.beat`, `.cell` and `.slot`, which already mean other things in
   `globals.css`.

The trailing legal notice was also corrected to name both titles, since the
season is played on the later one.

Note on encoding: this file arrived with its UTF-8 punctuation mangled by the
transfer (`Â·` for `·`, and one byte sequence standing in for both `—` and `→`).
The characters here are the intended ones. Nothing else was touched.
