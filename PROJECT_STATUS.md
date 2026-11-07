# LifeVault --- Project Status & Handover

Last updated: 7 November 2026

> This document is the handover source for continuing LifeVault in a new
> ChatGPT conversation or with another coding assistant. It records the
> progress known at the time of writing. If the actual code differs,
> inspect the repository and trust the current code over this document.

## 1. Project overview

**Project name:** LifeVault\
**Purpose:** A MERN application for managing personal/home-life
reminders, such as appliance servicing, vehicle documents, insurance,
health-related appointments, and other recurring maintenance tasks.

**Main learning goal:** Build a practical, portfolio-ready MERN project
and understand the implementation well enough to explain it in developer
interviews.

## 2. Technology stack

-   Frontend: React.js with Vite
-   Backend: Node.js and Express.js
-   Database: MongoDB Atlas with Mongoose
-   Authentication: JWT and bcrypt
-   API communication: Axios
-   Development tools: VS Code, Git/GitHub, Postman, MongoDB Atlas

Typical local development ports: - Frontend: `http://localhost:5173` -
Backend: `http://localhost:5000`

These are the known ports; verify the current `.env` and run scripts if
they have changed.

## 3. Features completed or implemented

The following features have been worked on and were reported working
during development:

-   React application setup with Vite.
-   Express backend and MongoDB Atlas connection.
-   Reminder CRUD operations.
-   Reminder categories and filtering/search.
-   Due-date handling and due-status calculations.
-   JWT authentication and bcrypt password hashing.
-   Protected frontend routes and authenticated API requests.
-   Axios token interceptor and localStorage-based session handling.
-   User-specific reminder ownership and queries.
-   Marking reminders as completed.
-   Dashboard summary cards, including total, completed, upcoming,
    overdue, due today and completion rate.
-   Frontend refactoring into reusable components and pages.

**Important:** Treat this list as historical progress, not proof that
every feature is currently bug-free. Run the app and test before
modifying.

## 4. Current frontend structure (known)

The project has been refactored toward a structure similar to:

``` text
src/
  components/
    SummaryCard.jsx
    ReminderList.jsx
  pages/
    Dashboard.jsx
    RemindersPage.jsx
    Login.jsx
    Register.jsx
  services/
    reminderService.js
  App.jsx
  App.css
```

This is the known structure, not a guaranteed complete file tree.
Inspect the repository for the actual current structure before making
changes.

### Frontend notes

-   `App.jsx` manages authentication/session state and the shared
    reminders data, and passes data/actions to pages.
-   `Dashboard.jsx` displays dashboard summary information.
-   `RemindersPage.jsx` manages reminder creation/editing, search and
    filters.
-   `ReminderList.jsx` is intended to be a presentational component
    receiving reminders and callback props.
-   `reminderService.js` contains API functions.

There was previously an `/about` route and an `About` component in
`App.jsx`. Cleanup was suggested, but do not assume it was removed
unless the current code confirms it.

## 5. Backend structure (known)

Known files include:

``` text
backend/
  models/
    Reminder.js
  controllers/
    reminderController.js
```

There may also be routes, middleware, configuration and
user/authentication files. Inspect the full backend tree.

### Reminder model

Known fields include: - `title` - `category` - `dueDate` -
`recurrence` - `isCompleted` - `user` (user ObjectId) - Mongoose
timestamps

Known category values: - `Home` - `Vehicle` - `Health` - `Documents` -
`Other`

Known recurrence values: - `none` - `daily` - `weekly` - `monthly` -
`every_3_months` - `every_6_months` - `yearly`

The recurrence field was added to the Mongoose schema and the frontend
form. The user confirmed on 7 November 2026 that the selected recurrence
value saves successfully.

## 6. Current task --- Day 22: recurring reminder completion

### User's explicit product decision: Option B

When a recurring reminder is marked complete:

1.  Keep the original reminder as a completed historical occurrence.
2.  Create a separate new reminder with the next due date.
3.  The new reminder must be pending (`isCompleted: false`).
4.  Do not change the due date or completion state of the historical
    completed record.

Recurrence intervals: - Daily: add 1 day - Weekly: add 7 days - Monthly:
add 1 calendar month - Every 3 months: add 3 calendar months - Every 6
months: add 6 calendar months - Yearly: add 1 calendar year

### Current status

-   Recurrence field exists in the model and frontend form.
-   Create/update payloads include recurrence.
-   Edit form loads `reminder.recurrence || "none"`.
-   User confirmed recurrence values save correctly.
-   **Automatic creation of the next occurrence has not yet been
    implemented or verified.**

### Implementation requirements for the next task

Before coding, inspect the current completion-toggle flow and relevant
controller/service code.

Implement carefully: - Only create the next occurrence when a reminder
changes from pending to completed. - Only do this when recurrence is not
`none`. - Preserve title, category, recurrence and user ownership on the
new reminder. - Set the new reminder's `isCompleted` to `false`. -
Calculate the next due date from the completed occurrence's due date
(confirm existing date representation and timezone handling first). -
Keep the completed record unchanged as history. - Avoid duplicate next
occurrences if the same completion request is repeated or retried. Use a
robust idempotency mechanism suitable for the existing design. - Do not
create another occurrence when an already-completed reminder is edited
or marked completed again. - Do not create a new occurrence when a
completed reminder is changed back to pending. - Handle month-end dates
sensibly. For example, adding one month to January 31 should result in
the last valid day of February, not an invalid date or an unexpected
March overflow. - Keep all queries scoped to the authenticated user. -
Preserve existing authorization and validation behavior. - Consider
database consistency if updating the completed record and inserting the
next one are separate operations. Use a transaction only if the current
MongoDB deployment/configuration supports it; otherwise implement a safe
idempotent approach.

After implementation, test all recurrence intervals, non-recurring
reminders, duplicate completion requests, and month-end cases.

## 7. Known earlier issue to verify

An earlier version of `createReminder()` destructured request fields and
then referenced `allowedCategories` without declaring it inside that
function. This caused a `ReferenceError` and HTTP 500. A fix was
suggested by defining the allowed category array locally.

The user later confirmed recurrence saves successfully, but this does
not prove the old issue or all related validation paths are correct.
Inspect the current controller and verify before changing anything.

## 8. Other future ideas (not current scope)

Possible later enhancements: - Reminder notifications. -
Uploading/storing invoices and service documents. - AI-assisted
invoice/document extraction (product, purchase/service date, cost and
next service date). - More polished portfolio presentation and
deployment.

Do not start these until the current recurring-reminder feature is
complete and tested.

## 9. How to continue in a new ChatGPT conversation

Upload this file and the current project files if needed. Use this
instruction:

> Continue my existing LifeVault project using this handover document.
> First inspect the current code and compare it with the handover. Do
> not restart the project or rewrite completed features. The current
> next task is Day 22: implement automatic next-occurrence creation for
> recurring reminders using my chosen Option B. Explain the plan first,
> then guide me one step at a time. Give exact file names and code
> locations, and explain the logic in simple English so I understand it
> for interviews.

## 10. Update discipline

After every major feature: 1. Test the feature. 2. Commit the working
code to Git. 3. Update this document with the actual files changed,
behavior implemented, tests passed and remaining issues. 4. Do not mark
a feature complete until the user has tested it.
