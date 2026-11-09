# Release checklist

- [ ] GitHub Actions checks green on the final commit (workflow may require approval for a first run).
- [ ] Play each era on a physical phone and desktop; confirm frame-time budget,
      collision feel, readability and sound levels.
- [ ] Verify browser storage blocked/full and checkpoint replacement messaging.
- [ ] Choose a Node/Docker hosting target; configure HTTPS, PORT and APP_URL.
- [ ] Build and run production smoke checks on that host.
- [ ] If enabling AI, verify configured model access, billing, quotas and output.
      Use shared rate limits/authentication for a public multi-instance service.
- [ ] Check historical scenario language and artwork provenance before broad release.
- [ ] Publish only after the deployment candidate passes these checks.

## Provider references inspected
- https://googleapis.github.io/js-genai/
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/generate-content/image-generation
- https://ai.google.dev/gemini-api/docs/omni

Provider model availability can change. Environment variables are deliberately
configurable; successful compilation does not prove account access to a model.
