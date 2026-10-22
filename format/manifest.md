# package.yaml

`package.yaml` is the manifest of a spec package. It names the package, declares its version and the identifier areas it uses, and lists the capabilities an implementation must take from verified primitives instead of synthesizing them.

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `format` | string | yes | Version of the spec package format. MUST be `vds-spec/0.1` for this version. |
| `name` | string | yes | Package name, `<namespace>/<name>`. The namespace identifies the publisher. |
| `version` | string | yes | Package version, Semantic Versioning 2.0.0 (see [Versioning](index.md#versioning)). |
| `title` | string | yes | Human-readable name of the component, at most 80 characters. |
| `summary` | string | yes | One paragraph describing what the component does. |
| `license` | string | yes | SPDX license expression covering the specification text and the conformance suite. |
| `maintainers` | list of objects | yes | At least one entry with `name` (required) and `url` (optional). |
| `repository` | string | no | URL of the source repository. |
| `areas` | map | yes | Identifier areas used by this package: key is the area code, value is a one-line description. |
| `primitives` | list of objects | no | Capabilities that MUST come from verified primitives (concept principle P6). See below. |
| `reference` | object | no | Location of the reference implementation. See below. |

### `primitives` entries

| Field | Type | Required | Description |
|---|---|---|---|
| `capability` | string | yes | Capability name, dotted lowercase, for example `tls` or `crypto.hash.sha256`. |
| `description` | string | yes | What the primitive provides and why it must not be synthesized. |
| `applies_when` | expression | no | Profile condition under which the capability is needed. Default: `always`. |

A synthesized implementation MUST obtain every active capability from a primitive that the project profile names, and MUST NOT implement the capability itself.

### `reference` object

| Field | Type | Required | Description |
|---|---|---|---|
| `path` | string | yes | MUST be `reference/`. |
| `language` | string | yes | Implementation language, for example `go`. |
| `adapter` | string | yes | Command that starts the conformance adapter of the reference implementation, relative to `path`. |

## Rules

- `name` and `version` together MUST identify exactly one package digest in a registry. Publishing different content under the same name and version is forbidden.
- Every area code used anywhere in the package MUST appear in `areas`. Areas that are no longer used SHOULD remain declared.

## Example

```yaml
format: vds-spec/0.1
name: specbase/http-client
version: 1.2.0
title: HTTP client
summary: >
  A client for HTTP/1.1 and HTTP/2 requests with strict header validation,
  bounded memory use and configurable redirect and TLS policies.
license: CC-BY-4.0 AND Apache-2.0
maintainers:
  - name: VDS spec maintainers
    url: https://github.com/Verified-Dependency-Synthesis
repository: https://github.com/<org>/spec-http-client
areas:
  HTTP: Request and response handling
  TLS: Transport security
  MEM: Memory and resource limits
primitives:
  - capability: tls
    description: TLS handshake and record layer; the client only configures it.
reference:
  path: reference/
  language: go
  adapter: go run ./cmd/adapter
```
