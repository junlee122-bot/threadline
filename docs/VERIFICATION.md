# Professional-polish verification

## Automated checks

- ESLint and strict TypeScript checks.
- 54 tests across six suites: canonical scenario scoring, intervention dynamics, report period/export invariants, replay cancellation and stale callbacks, shared demo data, and server-rendered chart titles.
- Production Next.js build and static route generation.

Local tests ran with `npm run test -- --pool=threads --maxWorkers=1` to keep worker memory bounded on the verification machine. CI uses the normal repository commands.

The chart-title regression test renders the actual Reports component on the server. It verifies all seven accessible SVG titles and fails on React rendering warnings; it protects against the hydration mismatch found during fresh-browser verification.

## Browser checks

- Command: investigation/recovery snapshots update metrics, graph labels, incident links, and narrative together. Evidence search handles matching and empty results. All three handoff commitments are required before acknowledgement. The activity inbox supports marking its sample items read.
- Incident: the decision frame enables review, approval advances through monitoring to verified recovery, and the communication draft reflects the selected snapshot. Reducer tests independently cover seeking/resetting during action execution.
- Crisis Lab: six reference choices produce score 97, grade S, three competency scores of 100, a 06:35 traffic guard, and explicit residual errors of 3.9%. Competency selection exposes the corresponding decision evidence.
- Agents: scheduled runs open a preview without starting a job; review records a local approval gate. Reviewed runs no longer count as needing review.
- Reports: period changes update the displayed cohort; the 90-day API matches 231 modeled hours, 5,977 tracked changes, and 5,498 analyzed changes. JSON and CSV attachment responses return HTTP 200 with the correct content types and filenames.
- Responsive inspection includes 320px and 390px mobile, 768px and 1024px tablet, and 1440px desktop. Mobile/tablet checks found no document-level horizontal overflow in the inspected Command, Changes, and Reports views. Wide evidence tables retain their own horizontal scrolling.

## Download verification boundary

On this Windows verification host, both the managed browser and a fresh isolated Chrome profile received the complete JSON, CSV, and Markdown download payloads, then canceled at the file-save stage. A separate 28-byte `data:text/plain` control download failed in the same way. Chrome reported a download error with no dangerous-file classification.

This isolates the observed failure from the application's report handlers, but actual browser file-save completion was **not verified on this host**. Browser security settings were not disabled. The Command export notice therefore says the download was prepared and asks the user to confirm it in their browser, rather than claiming a successful save.

Fresh Chrome also verified that direct Reports server rendering and its JSON action produce no runtime or console errors after the SVG-title correction.

These checks are a scoped portfolio review, not accessibility certification, production load testing, security certification, or validation against live source systems.
