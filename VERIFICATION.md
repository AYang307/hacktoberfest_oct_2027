# Verification record

Verified on October 4, 2026. Node.js 22.23.3 on macOS arm64; Next.js 16.3.8, React 19, Tailwind 4, Snowflake SDK 3.4.0. Exact dependency versions are in `package-lock.json`.

## Passed

- `npm run build`: production compilation, TypeScript checking, static generation of all five pages, dynamic `/api/prefill` route.
- `npm run typecheck`: strict TypeScript checks.
- `npm test`: 4 tests covering seed initialization/persistence/reset isolation, publication requirements, malformed/oversized model output, unknown/invalid date/time handling, and SQL parameterization boundaries.
- Browser flows: **34 passed** across desktop Chromium, Pixel 7 Chromium emulation, and iPhone 13 WebKit emulation. The shared 11 checks passed in each project; the additional native touch check passed in mobile Chromium. That CDP-specific check is intentionally skipped in desktop Chromium and WebKit.
- Home and discovery are separate routes: welcome text, live counts, saved links, and navigation on `/`; card swiping and All / Groups / Events filters on `/discover`. Home counts reflect saved/passed decisions when returning from discovery.
- Manual group and event creation, native required-field validation, discover-first publication, reload persistence.
- Exact sample announcement, clearly labeled sample response, two selectable editable drafts, sequential publishing, no automatic publishing, missing fields left blank, arbitrary-text configuration errors.
- Profile edits, initials avatar updates, persistence after reload, reset cancellation/confirmation, unrelated storage left untouched.
- Pass/Interested buttons, filters, short/long horizontal pointer drags, pointer cancellation, saved listing/removal, decisions surviving reload, complete-feed empty state.
- Native mobile Chromium touch swipe and vertical scrolling over the card without making an accidental decision.
- Flyer type and 3MB limit, valid local preview/removal, explicit unavailable image extraction notice.
- Simulated localStorage quota failure: visible error, current card remains, no false successful save.
- API empty input, malformed JSON, unsupported content type, 8,000-character and streamed body-size limits.
- Screenshots inspected for mobile/desktop layout. All five pages fit their viewport width; no page errors in the screenshot checks.
- npm audit after updating Snowflake SDK: **0 known vulnerabilities** at verification time.
- `npm run dev`: startup succeeded; the real browser loaded Discover with HTTP 200.

## Not tested / intentionally deferred

- **Live Snowflake calls:** no real account or credentials were provided. The signature/schema were checked against official documentation, but actual authentication, role/model permissions, region availability, SQL execution, latency, cancellation, and live extraction quality remain unverified. Use the README setup and Snowsight smoke query before a live demo.
- **Physical iPhone/Android devices:** browser emulation is not physical-device testing. WebKit form/navigation/pointer checks passed; native touch injection was tested in Chromium only. Check Safari touch gestures and safe-area behavior on a real iPhone before presenting.
- **Image extraction:** not implemented. The image input is a local-only preview; no upload, stage, `TO_FILE` or vision inference occurs.
- No production multi-user, load, or deployment testing; this is a local hackathon demo.

## Environment notes

Node was absent from the original workspace environment. Verification used a checksum-verified temporary Node runtime at `/tmp/node-v22.23.3-darwin-arm64`, and test browsers under `/tmp/terplink-playwright`. These are not project dependencies and may be removed by the operating system. Install Node.js 22 for normal future use of `npm run dev`. The running development preview uses the temporary runtime.

The default Turbopack compiler hit a process/port restriction in this environment. The project uses Next.js’s Webpack option for both dev and build, retaining the same single-app commands. No extra server or build service is required.

To repeat browser checks elsewhere:

```sh
npm install
npm run build
npx playwright install chromium webkit
npm run test:e2e
```
