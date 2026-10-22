# spec.md

`spec.md` is the normative specification of the component in prose. It is written for two readers at once: the synthesizer agent that implements it and the humans who review it. Its requirements are numbered so that every other file can refer to them.

## Document structure

`spec.md` MUST begin with a level-1 heading carrying the component title. It MUST then contain the following level-2 sections, in this order:

| Section | Content |
|---|---|
| `## Overview` | Purpose of the component and how it is typically used. Non-normative. |
| `## Scope and non-goals` | What the component does and explicitly does not do. |
| `## Terminology` | Terms used in the requirements, with definitions. |
| `## Requirements` | All requirements, grouped by topic (see below). |
| `## Error semantics` | When each error kind from `interface.yaml` is reported, and what state the component is in afterwards. |
| `## Resource limits` | All limits on memory, time and connections, with the profile parameters that bound them. |
| `## Security considerations` | How the requirements relate to the threat model. Non-normative. |
| `## Change log` | One entry per released version, newest first. |

Additional level-2 sections, such as `## Examples`, MAY follow the change log. They are non-normative.

## Requirements

Inside `## Requirements`, requirements are grouped under level-3 topic headings (for example `### Header handling`). Each requirement is a level-4 heading of the form

`#### <REQ-ID>: <title>`

followed by a field list and the normative text.

### Field list

The heading MUST be followed directly by a bullet list of fields in the form `- **<Field>:** <value>`.

| Field | Required | Value |
|---|---|---|
| `Level` | yes | One of `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`. |
| `Applies when` | yes | An `applies_when` expression in backticks, or `` `always` ``. |
| `Operations` | no | Operations from `interface.yaml` the requirement constrains, comma-separated, in backticks. |
| `Invariants` | no | Invariant IDs this requirement realizes, comma-separated. |
| `Tests` | yes for MUST and MUST NOT | Test IDs or patterns, comma-separated, in backticks. |
| `Status` | no | `active` (default), `deprecated` or `withdrawn`. |

### Normative text

- The text after the field list MUST state the requirement in one or more paragraphs and MUST contain the keyword given in `Level`.
- A paragraph starting with `**Rationale:**` MAY follow. It is non-normative.
- A requirement with status `withdrawn` keeps its heading and field list; its text explains why it was withdrawn and what replaces it.

### Example

```markdown
### Header handling

#### REQ-HTTP-012: Reject header values containing CR or LF

- **Level:** MUST
- **Applies when:** `always`
- **Operations:** `get`, `post`, `put`, `patch`, `delete`
- **Invariants:** INV-HTTP-007
- **Tests:** `adversarial/header-injection/*`

The implementation MUST reject a request whose header names or values contain
CR (0x0D) or LF (0x0A) before any byte is written to the connection, and MUST
report the error kind `invalid_header`.

**Rationale:** Prevents header injection, response splitting and request smuggling.
```

## Rules

- Every requirement ID MUST appear exactly once as a requirement heading.
- Requirement text MUST NOT contradict `interface.yaml` or `invariants.yaml`. Where they disagree, the package is invalid.
- Requirements MUST be implementable without knowledge of any particular programming language.
- A requirement that depends on a profile parameter MUST name it in its `Applies when` expression or its text, never implicitly.
