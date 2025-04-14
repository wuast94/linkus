# Contributing to Linkus

Thank you for your interest in contributing! To ensure consistency and enable automated release processes, we follow the Conventional Commits specification for all commit messages.

## Commit Message Format

Each commit message consists of a **header**, a **body**, and a **footer**.

```
<type>(<scope>): <short summary>
│       │             │
│       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
│       │
│       └─⫸ Commit Scope: Optional. E.g., `api`, `ui`, `config`, `core`, `docs`, etc.
│
└─⫸ Commit Type: feat | fix | build | chore | ci | docs | perf | refactor | revert | style | test
```

The `<type>` and `<summary>` fields are mandatory; the `(<scope>)` field is optional.

### Type

Must be one of the following:

- **feat**: A new feature for the user. (Corresponds to `MINOR` in SemVer)
- **fix**: A bug fix for the user. (Corresponds to `PATCH` in SemVer)
- **docs**: Documentation only changes.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).
- **chore**: Other changes that don't modify `src` or `test` files.
- **revert**: Reverts a previous commit.

### Scope

The scope provides additional contextual information. It's anything specifying the place of the commit change (e.g., `api`, `auth`, `ui`, `search`, `config`).

### Summary

The summary contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes".
- Don't capitalize the first letter.
- No dot (.) at the end.

### Body (Optional)

Just as in the **summary**, use the imperative, present tense. The body should include the motivation for the change and contrast this with previous behavior.

### Footer (Optional)

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then the description of the change, justification, and migration notes.

Example: `BREAKING CHANGE: The login endpoint now requires an email instead of a username.`

### Examples

```
feat(api): add endpoint for user profile update
```

```
fix(ui): correct button alignment on mobile devices

The button was previously overlapping with the text input on screens smaller than 400px.
```

```
refactor(core): simplify data processing logic

Removed redundant steps in the data pipeline to improve clarity and maintainability.
```

```
docs: update installation instructions in README
```

```
chore: bump dependency versions in package.json
```

```
fix(auth): prevent login redirect loop

Closes #123

BREAKING CHANGE: The `getUser` function now returns a promise instead of user object directly. Update calls accordingly.
```

By adhering to this format, we can automatically generate meaningful changelogs and manage semantic versioning.
