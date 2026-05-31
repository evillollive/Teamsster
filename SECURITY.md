# Security policy

## Supported versions

Until Teamsster reaches its first stable release, security fixes will land on the default branch only.

## Reporting a vulnerability

Please do **not** file public GitHub issues for suspected vulnerabilities.

Instead, email `security@teamsster.dev` with:

- a clear description of the issue
- reproduction steps or proof of concept
- potential impact
- any suggested mitigation

We will acknowledge reports as quickly as possible and work toward a coordinated fix and disclosure.

## Data protection

### Sensitive data handling

| Data category | Storage method | Access control | Audit logged |
|---|---|---|---|
| Medical/allergy notes | AES-256-GCM encrypted at rest | Admin/coach only | Yes |
| Insurance records | AES-256-GCM encrypted at rest | Admin/coach only | Yes |
| Waiver signatures | Plaintext with tamper-evident metadata | Admin read, guardian sign | Yes |
| Messages | Plaintext | Thread members only | Moderation actions logged |
| Payment status | Plaintext | Admin only | Yes |
| Push tokens | Plaintext (rate-limited registration) | System only | Registration logged |
| Calendar feed tokens | Cryptographically random, revocable | Token holder | Issuance/revocation logged |

### Minor account safety

- Minor accounts can't manage their own notification preferences.
- All notifications for minors route to linked guardians.
- Minor messaging is restricted by configurable league policy (default: team threads only).
- Minor accounts can't be created without at least one linked guardian.
- Removing the last guardian from a minor is blocked.

### Guardian access boundaries

Linked guardians **can**: view/edit minor profile, view minor's messages, view medical/insurance records, manage registration.

Linked guardians **cannot**: send messages as the minor, delete the minor's account, access other minors' data.

### Account deletion

When a user requests account deletion: profile is soft-deleted (30-day grace), messages are anonymized, volunteer data is soft-deleted, tokens are hard-deleted, guardian links require reassignment first, audit logs are preserved.

### Input validation

All inputs validated with Zod schemas. Email subjects sanitized against header injection. Message content stripped of XSS vectors. CSV exports sanitized against formula injection. Template payloads depth-limited and prototype-stripped.

### Rate limiting

| Endpoint | Limit |
|---|---|
| Push token registration | 5 per 5 minutes |
| Message sending | 30 per minute |
| Thread creation | 10 per hour |
| Message flagging | 10 per hour |
| Registration submission | 10 per hour |
| External API | 60/min, 1000/hour |

### Permission model

Roles ranked from OWNER (80) through GUEST (10). Contact visibility requires COACH+ or BOARD_MEMBER+. Full captains get contact access on their team. REFEREE is league-scoped with read access to schedules, rosters, and coach contacts only.
