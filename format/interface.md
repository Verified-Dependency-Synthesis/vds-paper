# interface.yaml

`interface.yaml` defines the public interface of the component independently of any programming language: its types, its error kinds, the environment it receives at runtime, and its operations. The synthesizer maps it to the idioms of the target language; the conformance adapter maps it to the harness protocol.

## Top-level structure

| Key | Required | Content |
|---|---|---|
| `types` | no | Named record and enum types. |
| `errors` | yes | All error kinds the component can report. |
| `environment` | no | Runtime inputs supplied by the deployment, such as a trust store. |
| `operations` | yes | All operations of the component. |

## Types

### Type expressions

Wherever a type is expected, one of the following type expressions is used:

| Expression | Meaning |
|---|---|
| `bool` | Boolean. |
| `int64`, `uint64` | Signed and unsigned 64-bit integers. |
| `string` | UTF-8 text. |
| `bytes` | Arbitrary byte sequence. |
| `duration` | Time span (see [Conventions](index.md#conventions)). |
| `list<T>` | Ordered sequence of `T`. |
| `map<string, T>` | Mapping from text keys to `T`. |
| `optional<T>` | Either a `T` or absent. |
| `<TypeName>` | A named type from `types`. |

### Named types

Each entry in `types` is keyed by a type name in `PascalCase` and contains exactly one of:

- `record`: a map of field names to field definitions.
- `enum`: a list of allowed values, each matching `[a-z][a-z0-9_]*`.

A field definition has these keys:

| Key | Required | Description |
|---|---|---|
| `type` | yes | Type expression. |
| `doc` | no | Description of the field. |
| `required` | no | Default `true`. `false` makes the field optional in inputs. |
| `min`, `max` | no | Numeric bounds for integer types. |
| `max_length` | no | Upper bound for `string` (characters), `bytes` (bytes) and `list` (elements). |
| `pattern` | no | Regular expression (ECMAScript syntax) a `string` value must match. |

## Errors

`errors` is a list of error kinds:

| Key | Required | Description |
|---|---|---|
| `kind` | yes | Error kind identifier. |
| `doc` | yes | When this error is reported. MUST refer to the requirement that defines it. |
| `retryable` | yes | Whether repeating the same call can succeed. |

The kinds `internal` and `unsupported_operation` are reserved by the harness protocol and MUST NOT be declared.

## Environment

`environment` is a map of named runtime inputs. Each entry is a field definition (see [Named types](#named-types)).

Environment inputs are values a deployment legitimately supplies at runtime, for example trust anchors. They are **not** profile parameters: profile parameters are fixed at synthesis time and restrict behavior, environment inputs are provided when the component is constructed.

## Operations

`operations` is a map from operation name to an operation definition:

| Key | Required | Description |
|---|---|---|
| `doc` | yes | What the operation does. |
| `applies_when` | no | Profile condition under which the operation exists. Default: `always`. |
| `inputs` | no | Map of input names to field definitions. |
| `output` | no | Type expression of the result. Absent means the operation returns no value. |
| `errors` | yes | Error kinds this operation can report. MAY be empty. |
| `requirements` | yes | Requirement IDs that constrain this operation (rule T6). |
| `idempotent` | no | Whether repeating the call has no additional effect. Default `false`. |

## Mapping to languages

A synthesized implementation MUST map the interface according to these rules:

1. Names are converted to the naming conventions of the target language. Their meaning MUST NOT change.
2. Every **active** operation becomes exactly one public function or method. **Inactive** operations MUST NOT be generated, not even as stubs that return an error (concept principle P4).
3. The implementation MUST NOT expose public operations that are not in `interface.yaml`, except a constructor that receives the environment inputs.
4. Error kinds map to the language's idiomatic error mechanism, for example error values in Go, an enum in a Rust `Result`, or error codes in C. The kind MUST be recoverable by the caller.
5. Profile parameters are compiled into the implementation. They MUST NOT be exposed as runtime configuration.

## Example

```yaml
types:
  Header:
    record:
      name: { type: string, max_length: 256, pattern: "^[!#$%&'*+.^_`|~0-9A-Za-z-]+$" }
      value: { type: string, max_length: 8192 }
  Response:
    record:
      status: { type: uint64, min: 100, max: 599 }
      headers: { type: "list<Header>" }
      body: { type: bytes }

errors:
  - kind: invalid_header
    doc: A header name or value violates REQ-HTTP-012.
    retryable: false
  - kind: host_not_allowed
    doc: The target host is not in the profile's allowed hosts (REQ-HTTP-002).
    retryable: false
  - kind: response_too_large
    doc: The response body exceeds max_response_bytes (REQ-MEM-002).
    retryable: false
  - kind: timeout
    doc: A connect or total timeout expired (REQ-HTTP-030).
    retryable: true
  - kind: tls_failure
    doc: The TLS handshake or certificate validation failed (REQ-TLS-001).
    retryable: false

environment:
  trust_anchors:
    type: "list<bytes>"
    doc: DER-encoded root certificates used to validate server certificates.

operations:
  get:
    doc: Sends a GET request and returns the response.
    applies_when: '"GET" in profile.methods'
    inputs:
      url: { type: string, max_length: 2048 }
      headers: { type: "list<Header>", required: false }
    output: Response
    errors: [invalid_header, host_not_allowed, response_too_large, timeout, tls_failure]
    requirements: [REQ-HTTP-001, REQ-HTTP-002, REQ-HTTP-012]
    idempotent: true
  post:
    doc: Sends a POST request with a body and returns the response.
    applies_when: '"POST" in profile.methods'
    inputs:
      url: { type: string, max_length: 2048 }
      headers: { type: "list<Header>", required: false }
      body: { type: bytes }
    output: Response
    errors: [invalid_header, host_not_allowed, response_too_large, timeout, tls_failure]
    requirements: [REQ-HTTP-001, REQ-HTTP-002, REQ-HTTP-012]
  delete:
    doc: Sends a DELETE request and returns the response.
    applies_when: '"DELETE" in profile.methods'
    inputs:
      url: { type: string, max_length: 2048 }
    output: Response
    errors: [host_not_allowed, response_too_large, timeout, tls_failure]
    requirements: [REQ-HTTP-001, REQ-HTTP-002]
```

With the profile `methods: [GET, POST]`, the operation `delete` is inactive: a synthesized client offers `get` and `post` only, and contains no code path that could send a DELETE request.
