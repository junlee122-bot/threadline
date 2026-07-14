# Security policy

Threadline is a deterministic portfolio demo. It does not require credentials, connect to production systems, or execute the operational actions shown in its interface. Security reports are still treated as seriously as reports for a production application.

## Supported versions

Only the latest commit on `main` is supported. There are no long-lived release branches.

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/junlee122-bot/something/security/advisories/new). Please do not disclose a suspected vulnerability in a public issue, discussion, or pull request.

Include, when possible:

- the affected route, component, or dependency;
- reproduction steps or a minimal proof of concept;
- the likely impact and prerequisites;
- any mitigation you already tested.

Do not include real access tokens, personal data, or production customer information. We aim to acknowledge a report within three business days, provide an initial assessment within seven business days, and coordinate disclosure after a fix is available.

## Scope

Useful reports include cross-site scripting, unsafe URL handling, leaked secrets, dependency vulnerabilities with a demonstrated path, service-worker cache poisoning, and bypasses that expose data or trigger privileged behavior.

The UI intentionally simulates incidents and agent actions. Reports that only show that demo buttons do not modify real infrastructure are out of scope. Automated scanning is welcome when it is rate-limited and does not disrupt GitHub, Vercel, or other people’s systems.

## Safe harbor

Good-faith research that respects privacy, avoids persistence, and gives us time to remediate will not be pursued as malicious activity. Stop and report immediately if you encounter non-demo data or gain access beyond what is required to demonstrate the issue.
