# AI Coding Instructions --- LifeVault

Use these instructions whenever working on this repository with GitHub
Copilot, Blackbox AI, or another coding assistant.

## Project context

LifeVault is an existing MERN personal reminders application.

Known stack: - React.js + Vite - Node.js + Express.js - MongoDB Atlas +
Mongoose - JWT + bcrypt - Axios

The repository's current code is the source of truth. A separate
`PROJECT_STATUS.md` file contains the latest known project handover.
Read it before making changes, then inspect the actual relevant files.

## Mandatory workflow

1.  **Inspect first.** Read the relevant files and trace the existing
    flow before proposing edits.
2.  **Plan briefly.** State which files need changes and why.
3.  **Work on one requested feature only.** Do not bundle unrelated
    refactors or enhancements.
4.  **Preserve existing behavior.** Do not rewrite working features or
    change public API behavior without a clear requirement.
5.  **Make focused edits.** Follow the existing project structure,
    naming, formatting and patterns.
6.  **Explain the result.** After editing, list every file changed and
    explain what changed in plain English.
7.  **Test.** Provide exact commands and manual test steps. Do not claim
    tests passed unless they were actually run and passed.
8.  **Stop at the requested scope.** Do not silently continue to the
    next feature.

## Teaching requirements

The developer is learning MERN while building this project. Do not
simply generate code and move on.

For each feature, explain: - What the feature does from the user's
perspective. - The request-to-database flow. - What each changed file is
responsible for. - Why each important code change is needed. - Relevant
React, JavaScript, Node, Express, MongoDB or Mongoose concepts. - How to
test success and failure cases. - A few interview-relevant points the
developer should be able to explain.

Use clear, simple English. Avoid assuming advanced knowledge. Define
unfamiliar terms briefly.

## Code quality and safety rules

-   Never expose, print or commit `.env` values, passwords, API keys,
    JWT secrets or database credentials.
-   Do not replace secrets with guessed values.
-   Do not disable authentication, authorization, validation or security
    checks to make a test pass.
-   Keep user-owned data queries scoped to the authenticated user.
-   Validate request data on the server; frontend validation alone is
    insufficient.
-   Handle expected errors and avoid leaking sensitive internal error
    details.
-   Avoid unnecessary dependencies. Explain the reason before adding a
    package.
-   Do not change package versions or configuration unless required.
-   Do not delete files, data, routes or existing functionality without
    explicit approval.
-   Do not run destructive database operations.
-   Do not overwrite user changes. Inspect `git status` and review diffs
    before broad edits.
-   Do not change multiple unrelated areas in one operation.
-   Prefer readable, maintainable code over clever or overly compressed
    code.
-   Keep date/time handling consistent with the existing application.
    Check how dates are stored and parsed before changing date logic.
-   Consider duplicate requests, retries, edge cases and authorization
    when implementing backend operations.

## Before editing

Show a concise plan in this format:

1.  Existing flow found:
2.  Files to change:
3.  Proposed behavior:
4.  Risks or assumptions:

If a required detail is unclear or the proposed change could affect
data, ask before proceeding.

## After editing

Report:

1.  Files created/modified.
2.  What changed in each file.
3.  Important logic explained.
4.  Commands to run.
5.  Manual test cases, including edge cases.
6.  Any limitations or unverified assumptions.

Show relevant diffs or focused code excerpts when useful. Do not dump
entire files unless requested.

## Current LifeVault feature context

The current known task is recurring reminders (Day 22).

The user's chosen behavior is **Option B**: - When a pending recurring
reminder is completed, preserve that completed reminder as history. -
Create a separate new pending reminder for the next due date. - Do not
mutate the completed historical occurrence.

Recurrence values: - `none` - `daily` - `weekly` - `monthly` -
`every_3_months` - `every_6_months` - `yearly`

The recurrence field has been added to the model and form, and the user
confirmed that recurrence values save successfully. Automatic
next-occurrence creation is the next implementation task and is not yet
confirmed as implemented.

For this feature, inspect the existing completion-toggle
endpoint/controller and reminder model first. Implement idempotently so
duplicate completion requests do not create duplicate future reminders.
Handle month-end dates and preserve user ownership. Only create the next
occurrence on a pending-to-completed transition.

## Git workflow

Before substantial edits: - Check `git status`. - Ask the user to commit
or otherwise back up uncommitted work if necessary. - Never discard or
overwrite uncommitted changes.

After the feature is tested, suggest a clear commit message. Do not
commit or push unless the user explicitly asks.

## Important interaction rule

Do not take over the whole project autonomously. The user wants to learn
and remain in control. Work step by step, explain decisions, and wait
for the user's confirmation at important checkpoints.
