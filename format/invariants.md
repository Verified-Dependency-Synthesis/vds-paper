# invariants.yaml

`invariants.yaml` lists the security and resource properties that must hold for every input, in a form that tools can check. Where `spec.md` explains *how* the component behaves, an invariant states *what must never go wrong*, and links that statement to requirements, attack classes and tests.

## Structure

The file contains one top-level key, `invariants`, holding a list of invariant entries.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Invariant ID, `INV-<AREA>-<NNN>`. |
| `title` | string | yes | Short name, at most 80 characters. |
| `level` | string | yes | `MUST` or `MUST NOT`. Invariants are never optional. |
| `rule` | string | yes | Normative statement. MUST contain the keyword given in `level`. |
| `category` | string | yes | One of `input-validation`, `memory-safety`, `resource-limits`, `crypto`, `protocol`, `information-disclosure`, `concurrency`. |
| `severity` | string | yes | `critical`, `high`, `medium` or `low`: the impact if the invariant is violated. |
| `applies_when` | expression | no | Profile condition under which the invariant applies. Default: `always`. |
| `overridable` | bool | no | Whether a profile may make the invariant inactive. Default `false`. |
| `requirements` | list | yes | Requirement IDs that realize the invariant (rule T2). |
| `mitigates` | list | no | Attack class IDs the invariant mitigates (rule T1). |
| `tests` | list | yes | Test IDs or patterns that verify the invariant (rule T2). |
| `verification` | list | yes | Verification methods used: `vector`, `property`, `fuzz`, `adversarial`, `differential`, `static`. |
| `status` | string | no | `active` (default), `deprecated` or `withdrawn`. |

## Rules

- If `overridable` is `false`, `applies_when` MUST be `always`. No profile can switch off such an invariant.
- An invariant with severity `critical` MUST have `overridable: false` and MUST list `adversarial` or `property` in `verification`, backed by at least one matching test (rule T4).
- Every method listed in `verification` MUST be backed by at least one test of the matching kind, except `static`, which refers to checks performed by the gates (for example forbidden imports).
- An invariant MUST NOT be weaker than the requirements it references. If an invariant and a requirement disagree, the package is invalid.

## Example

```yaml
invariants:
  - id: INV-TLS-001
    title: Certificate chain validation
    level: MUST
    rule: The server certificate chain MUST be validated against the trust anchors from the environment.
    category: crypto
    severity: critical
    overridable: false
    requirements: [REQ-TLS-001]
    mitigates: [ATK-TLS-001]
    tests: [adversarial/tls/expired-*, adversarial/tls/self-signed-*, adversarial/tls/wrong-host-*]
    verification: [adversarial]

  - id: INV-HTTP-007
    title: No CR or LF in header fields
    level: MUST NOT
    rule: A request whose header names or values contain CR or LF MUST NOT be sent.
    category: input-validation
    severity: critical
    overridable: false
    requirements: [REQ-HTTP-012]
    mitigates: [ATK-HTTP-003]
    tests: [adversarial/header-injection/*, properties/header-validation/*]
    verification: [adversarial, property]

  - id: INV-MEM-002
    title: Bounded response body
    level: MUST NOT
    rule: The response body MUST NOT exceed max_response_bytes; exceeding it is an error, not silent truncation.
    category: resource-limits
    severity: high
    requirements: [REQ-MEM-002]
    mitigates: [ATK-MEM-001]
    tests: [vectors/limits/body-*, properties/bounded-memory/*]
    verification: [vector, property]
```
