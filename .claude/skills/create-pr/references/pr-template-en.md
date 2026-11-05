# English PR Template

Use for overseas / international open-source projects (English commits and docs). Write the body with the structure between the `---` lines and delete sections that have no content. `<!-- -->` comments are guidance — remove them from the final body.

If the upstream repository has its own PR template or CONTRIBUTING guide, follow that instead; this template is only the fallback.

---

## Summary

<!-- 1–3 sentences: what problem this solves or what it adds, and why it is needed. -->

## Changes

<!-- Group by meaning, not by file. What changed and how, so reviewers get the big picture before opening the diff. -->

- 
- 

## Motivation

<!-- Rationale for design choices, alternatives considered. Delete for trivial changes. -->

## Testing

<!-- Only list commands you actually ran and their results. If not run, say so and why. Use the project's own test commands. -->

- [ ] Tests pass (`<project test command>`)
- [ ] Lint passes (`<project lint command>`)
- Manual verification: 

## Notes for Reviewers

<!-- Areas needing careful review, open questions, follow-up work. Delete if none. -->

## Related Issues

<!-- Closes #N / Refs #N. Delete if none. -->

## Screenshots

<!-- Only for UI changes. Delete if none. -->

---

## Writing Tips

- Keep the tone neutral and concise; maintainers of international projects often read many PRs.
- Title: Conventional Commits style if the project uses it (`feat: add prompt length validation`), imperative mood, lowercase after the type, no trailing period, ≤72 chars.
- Use `Closes #N` so GitHub auto-closes the issue on merge.
- Don't mention internal company context, tickets, or links the upstream maintainers can't access.

## Example

```markdown
## Summary

Adds a 500-character limit to the prompt input so excessively long prompts are rejected before reaching the AI provider.

## Changes

- Add a pure `validatePrompt` function that counts code points (excluding surrounding whitespace)
- Show an inline error (`role="alert"`) and disable the submit button and Ctrl+Enter when the limit is exceeded

## Testing

- [x] `bun run test` passes (20 tests)
- [x] `bun run lint` passes

## Notes for Reviewers

Validation is client-side only for now; a server-side check will follow in a separate PR.
```
