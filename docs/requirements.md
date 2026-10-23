# Requirements

## Problem and scope

A small support desk needs persistent tickets, clear ownership, private staff discussion, and a record of how an issue was resolved. This fictional application demonstrates those workflows for a first IT portfolio. There are no real customers or organisations.

## Users and acceptance criteria

| User story                                     | Acceptance criteria                                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| As a requester, I can report an issue          | Signed-in users submit a 5–160 character title, 10–10,000 character description, active category, and valid priority; invalid input returns 400 |
| As a requester, I can follow my issue          | Queue, detail, counts, and replies are scoped to my user ID; another requester receives 404 even using a direct URL/API request                 |
| As an agent, I can organise work               | Search, filter, and paginate tickets; assign myself, change priority/status, and write replies or private notes                                 |
| As support, I can resolve an issue             | Resolution needs an explanation of at least 10 characters; the resolution is visible to the requester                                           |
| As a requester, I can reopen my resolved issue | Reopening requires a recorded reason of at least 10 characters and clears the current resolution                                                |
| As an administrator, I can manage the desk     | Create/archive/restore categories, assign staff, change another user's role, and view counts                                                    |

## Permission rules

| Operation                              | Requester          | Agent              | Administrator              |
| -------------------------------------- | ------------------ | ------------------ | -------------------------- |
| Read ticket / public replies / history | Own only           | All                | All                        |
| Create ticket                          | Yes, owned by self | Yes, owned by self | Yes, owned by self         |
| Public reply                           | Own only           | All                | All                        |
| Read or add internal note              | No                 | Yes                | Yes                        |
| Assign                                 | No                 | Self only          | Any staff member           |
| Update priority / ordinary status      | No                 | Yes                | Yes                        |
| Reopen resolved ticket with reason     | Own only           | All                | All                        |
| Categories / roles                     | No                 | No                 | Yes, unless DEMO_MODE=true |

Roles are reloaded from the database for protected operations. Clients cannot set requester ID or submit extra fields on creation. Administrators cannot change their own role. Existing sessions are removed after a role change. Staff with assigned tickets cannot be demoted to requester until those tickets are reassigned. Public signup is disabled. Internal note content and existence are excluded from requester responses and public activity history.

Statuses: Open, In Progress, Waiting for Requester, Resolved. Resolved tickets must reopen to Open before a different status can be selected. Other staff transitions are intentionally flexible. Categories are archived rather than deleted, preserving existing tickets.

## Out of scope

Payments, email delivery, uploads, multiple organisations, complex chat, AI inference, automated replies, and automatic resolution. Shared demo mode is a deployment safeguard, not a separate organisation boundary.
