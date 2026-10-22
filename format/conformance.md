# Conformance suite

The conformance suite in `conformance/` turns the specification into executable checks. It is language-neutral: every synthesized implementation ships a small **conformance adapter** that speaks the harness protocol defined on this page, so the same suite runs against Go, Rust or C implementations.

## Directory layout

| Path | Required | Content |
|---|---|---|
| `conformance/suite.yaml` | yes | Suite manifest: harness version and defaults. |
| `conformance/vectors/` | yes | Test vectors: fixed inputs with expected outcomes. |
| `conformance/adversarial/` | yes | Tests that reproduce attack classes from the threat model. |
| `conformance/properties/` | no | Property tests: generated inputs checked against an oracle. |
| `conformance/fuzz/` | no | Fuzz targets. |
| `conformance/fixtures/` | no | Files that tests refer to, such as test certificates or seed corpora. |

Test files under `vectors/`, `adversarial/`, `properties/` and `fuzz/` are YAML files with the extension `.yaml`. Each file contains a top-level key `tests` holding a list of tests. A test's ID MUST start with the directory it is stored in, for example `adversarial/header-injection/crlf-in-value` lives in a file below `conformance/adversarial/`.

## suite.yaml

| Field | Type | Required | Description |
|---|---|---|---|
| `harness` | string | yes | Harness protocol version. MUST be `vds-harness/0.1`. |
| `defaults.timeout` | duration | yes | Time limit for a single call when a test sets none. |
| `defaults.property_runs` | integer | no | Minimum number of generated cases per property test. Default `1000`. |
| `defaults.fuzz_duration` | duration | no | Minimum fuzzing time per target. Default `120m`. |
| `defaults.sanitizers` | list | no | Sanitizers the gates must enable for fuzzing, for example `address`, `undefined`. |

```yaml
harness: vds-harness/0.1
defaults:
  timeout: 5s
  property_runs: 1000
  fuzz_duration: 120m
  sanitizers: [address, undefined]
```

## Common test fields

All tests share these fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Test ID (see [Identifiers](index.md#identifiers)). |
| `title` | string | yes | Short description. |
| `requirements` | list | yes | Requirement IDs the test verifies (rule T5). |
| `invariants` | list | no | Invariant IDs the test verifies. |
| `attack` | string | adversarial only | Attack class ID the test reproduces. |
| `applies_when` | expression | no | Profile condition under which the test runs. Default: `always`. |
| `fixtures` | map | no | Fixtures the test needs, keyed by name (see [Fixtures](#fixtures)). |
| `timeout` | duration | no | Overrides `defaults.timeout`. |

A test MUST be active under every profile in which all requirements it references are active. Tests MUST NOT depend on each other or on their order.

## Vectors and adversarial tests

Vectors and adversarial tests have the same shape. In addition to the common fields:

| Field | Required | Description |
|---|---|---|
| `call.op` | yes | Operation to call. |
| `call.args` | yes | Input values. `{<fixture>}` in a string is replaced by the fixture's `host:port`. |
| `expect.ok` | yes | `true` if the call must succeed, `false` if it must fail. |
| `expect.value` | no | Expected result, matched as a subset: objects match if every listed key matches, lists must match element by element. |
| `expect.error.kind` | if `ok` is `false` | Expected error kind. |
| `expect.fixtures` | no | Assertions on fixtures after the call, see below. |

```yaml
tests:
  - id: adversarial/header-injection/crlf-in-value
    title: CR LF in a header value is rejected before sending
    requirements: [REQ-HTTP-012]
    invariants: [INV-HTTP-007]
    attack: ATK-HTTP-003
    fixtures:
      server:
        kind: tcp-script
        steps:
          - read_until: "\r\n\r\n"
          - send: "HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n"
    call:
      op: get
      args:
        url: "http://{server}/"
        headers:
          - { name: X-Trace, value: "a\r\nX-Injected: 1" }
    expect:
      ok: false
      error: { kind: invalid_header }
      fixtures:
        server: { connections: 0 }
```

## Fixtures

A fixture is an environment the runner sets up before a call. Version 0.1 defines one fixture kind.

### `tcp-script`

A TCP server on `127.0.0.1` with a random port that accepts connections and plays a script on each one.

| Field | Required | Description |
|---|---|---|
| `kind` | yes | `tcp-script`. |
| `tls` | no | Object with `certificate` and `key`: paths below `conformance/fixtures/`. The runner passes the matching test root certificate to the adapter as environment input. |
| `steps` | yes | Script played on every connection, in order. |

| Step | Meaning |
|---|---|
| `read_until: <string>` | Read until the string has been received. |
| `read_bytes: <n>` | Read exactly `n` bytes. |
| `send: <string>` | Send the string. YAML escapes such as `\r\n` apply. |
| `send_file: <path>` | Send the content of a file below `conformance/fixtures/`. |
| `send_repeat: { data: <string>, bytes: <n> }` | Send `data` repeatedly until `n` bytes are sent. |
| `delay: <duration>` | Wait. |
| `close` | Close the connection. |

Fixture assertions under `expect.fixtures.<name>`:

| Assertion | Meaning |
|---|---|
| `connections: <n>` | Number of accepted connections. |
| `received_contains: <string>` | The received bytes contain the string. |
| `received_not_contains: <string>` | The received bytes do not contain the string. |

## Property tests

Property tests check a statement against many generated inputs. In addition to the common fields:

| Field | Required | Description |
|---|---|---|
| `generate` | yes | Map of generator names to generators. `{gen.<name>}` in strings of `call.args` or fixture steps is replaced by a generated value. |
| `call` | yes | As for vectors. |
| `check` | yes | One or more oracles that must hold for every generated case. |
| `runs` | no | Overrides `defaults.property_runs`. |

| Generator | Produces |
|---|---|
| `int: { min, max }` | An integer in the range. |
| `bytes: { min_length, max_length }` | A random byte sequence. |
| `string: { charset, min_length, max_length }` | A string over the character set. |
| `one_of: [ ... ]` | One of the listed values. |
| `corpus: <path>` | One file from a directory below `conformance/fixtures/`. |

| Oracle | Holds if |
|---|---|
| `no_internal_error: true` | The call never reports the reserved error kind `internal` and the adapter never crashes. |
| `error_kind_in: [ ... ]` | Every failing call reports one of the listed kinds. |
| `max_peak_memory: <bytes>` | Peak memory of the call stays below the limit. |
| `max_duration: <duration>` | Every call completes within the limit. |
| `deterministic: true` | Repeating a case yields the same outcome. |

## Fuzz targets

Fuzz targets declare **what** is fuzzed and **what counts as failure**. How fuzzing is executed (engine, instrumentation, corpus handling) is up to the gates. In addition to the common fields:

| Field | Required | Description |
|---|---|---|
| `call` | yes | As for vectors. |
| `fuzz_input` | yes | What is mutated: `arg:<name>` for an input, or `fixture:<name>` for the bytes a `tcp-script` fixture sends. |
| `seeds` | yes | Directory below `conformance/fixtures/` with seed inputs. |
| `duration` | no | Overrides `defaults.fuzz_duration`. |
| `fail_on` | yes | Any of `crash`, `sanitizer`, `hang`, `internal_error`. |

```yaml
tests:
  - id: fuzz/response-parsing/status-and-headers
    title: Arbitrary server responses never crash the client
    requirements: [REQ-HTTP-040]
    fixtures:
      server: { kind: tcp-script, steps: [ { read_until: "\r\n\r\n" } ] }
    call: { op: get, args: { url: "http://{server}/" } }
    fuzz_input: fixture:server
    seeds: fixtures/seeds/responses/
    fail_on: [crash, sanitizer, hang, internal_error]
```

## Harness protocol

The runner starts the conformance adapter as a child process and exchanges **one JSON object per line** over standard input and output. The adapter MUST NOT write anything else to standard output; diagnostics go to standard error.

| Step | Direction | Message |
|---|---|---|
| 1 | adapter → runner | `{"type": "hello", "protocol": "vds-harness/0.1", "package": "<name>", "version": "<version>", "profile_digest": "sha256:…", "operations": ["get", "post"]}` |
| 2 | runner → adapter | `{"type": "setup", "environment": { … }}` with values for the environment inputs from `interface.yaml` |
| 3 | adapter → runner | `{"type": "ready"}` |
| 4 | runner → adapter | `{"type": "call", "id": "<call id>", "op": "<operation>", "args": { … }}` |
| 5 | adapter → runner | `{"type": "result", "id": "<call id>", "ok": true, "value": …}` or `{"type": "result", "id": "<call id>", "ok": false, "error": {"kind": "<kind>", "message": "<text>"}}` |
| 6 | runner → adapter | `{"type": "shutdown"}`, after which the adapter exits with code 0 |

Steps 4 and 5 repeat for every call.

**Rules:**

- `operations` in the hello message MUST list exactly the active operations. The runner fails the suite if it differs from what the profile implies.
- Calls are processed one at a time in version 0.1.
- An unknown operation is answered with error kind `unsupported_operation`. Any unexpected failure inside the adapter or the implementation is reported as `internal`. Both kinds are reserved and never an expected outcome.
- `bytes` values are encoded as `{"$bytes": "<base64>"}`. Integers outside ±2^53 are encoded as decimal strings. Durations are strings.
- If the adapter crashes, exits early or writes invalid output, the current test fails.

## Test outcomes

Each test ends with one of these outcomes:

| Outcome | Meaning |
|---|---|
| `pass` | All expectations or oracles hold. |
| `fail` | An expectation or oracle does not hold, or the adapter crashed. |
| `skipped_by_profile` | The test is inactive under the project profile. |
| `error` | The runner could not execute the test, for example because a fixture failed to start. |

A suite run succeeds only if no test ends with `fail` or `error`. The counts per outcome are recorded in `spec.lock`.

## Reference implementation

A package MAY include a reference implementation in `reference/`, declared in `package.yaml`.

- It MUST pass the complete suite under the default profile. This validates the suite itself.
- It is used for differential testing of synthesized implementations.
- It MUST NOT be distributed or used as a dependency of projects.
