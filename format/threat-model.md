# threat-model.md

`threat-model.md` states what the component protects, against whom, and which attacks the specification is designed to withstand. Its attack classes are the starting point of the traceability chain: each one must be mitigated by an invariant or be accepted explicitly as a residual risk (rule T1).

## Document structure

`threat-model.md` MUST begin with a level-1 heading and MUST contain the following level-2 sections, in this order:

| Section | Content |
|---|---|
| `## Assets` | What must be protected, for example credentials in requests, integrity of responses, memory of the host process. |
| `## Trust boundaries` | Where data crosses from untrusted to trusted, for example between network peer and component, or between caller and component. |
| `## Attacker model` | Capabilities assumed for the attacker, for example full control of the server, control of request URLs or headers, a network position. |
| `## Attack classes` | All attack classes, grouped by topic (see below). |
| `## Assumptions` | Conditions the specification relies on, for example a correct TLS primitive or a trustworthy environment. |
| `## Out of scope` | Threats deliberately not addressed, with a reason. |
| `## Residual risks` | Attack classes that are not mitigated by an invariant, each with a justification (rule T1). |

## Attack classes

Inside `## Attack classes`, attack classes MAY be grouped under level-3 topic headings. Each attack class is a level-4 heading of the form

`#### <ATK-ID>: <title>`

followed by a field list in the form `- **<Field>:** <value>`:

| Field | Required | Value |
|---|---|---|
| `Vector` | yes | How the attack is carried out. |
| `Impact` | yes | What the attacker gains if it succeeds. |
| `Mitigated by` | yes, unless listed under residual risks | Invariant IDs, comma-separated. |
| `Tests` | yes, if mitigated | Adversarial test IDs or patterns that reproduce the attack, in backticks. |
| `References` | no | CWE, CAPEC or CVE identifiers, comma-separated. |
| `Status` | no | `active` (default) or `withdrawn`. |

An optional paragraph of explanation MAY follow the field list.

## Rules

- Every attack class MUST either name at least one invariant under `Mitigated by` or appear under `## Residual risks` (rule T1).
- An attack class that is mitigated MUST name at least one adversarial test that performs the attack.
- Attack classes SHOULD reference a CWE identifier where one exists.
- When a new attack class becomes known, it MUST be added together with its adversarial tests. If existing invariants already cover it, this is a PATCH release (see [Versioning](index.md#versioning)).

## Example

```markdown
## Attack classes

### Request construction

#### ATK-HTTP-003: Header injection

- **Vector:** Attacker-controlled data reaches a header name or value and contains CR or LF.
- **Impact:** Request smuggling, response splitting, cache poisoning on intermediaries.
- **Mitigated by:** INV-HTTP-007
- **Tests:** `adversarial/header-injection/*`
- **References:** CWE-113, CWE-93

### Resource exhaustion

#### ATK-MEM-001: Oversized response body

- **Vector:** A malicious or compromised server sends an unbounded response body.
- **Impact:** Memory exhaustion and denial of service of the host process.
- **Mitigated by:** INV-MEM-002
- **Tests:** `adversarial/limits/endless-body`
- **References:** CWE-400, CWE-770
```
