# profile.schema.json

`profile.schema.json` declares the **profile parameters** of a component: the knobs a project can use to restrict the specified behavior, together with the direction in which each knob may be turned. It also defines the `applies_when` expression language used by all other files.

## Schema rules

`profile.schema.json` is a JSON Schema (draft 2020-12) document that validates a project profile.

- The root MUST be of type `object` with `additionalProperties: false`.
- Parameters MAY be grouped in nested objects (for example `tls.min_version`). Nested objects MUST also set `additionalProperties: false`.
- Every **leaf** property is a profile parameter and MUST declare `x-vds-restrict` (see below).
- Every leaf property except those with `x-vds-restrict: add-only` MUST declare a `default`. The default MUST be the **most permissive** value, meaning the full behavior described in `spec.md`.
- Duration parameters MUST use `"type": "string"`, `"pattern": "^[0-9]+(ms|s|m)$"` and `"x-vds-type": "duration"`.

### Restriction kinds

`x-vds-restrict` states how a project value relates to the default. A project profile is valid only if every parameter satisfies its restriction kind (concept principle P3).

| `x-vds-restrict` | Applies to | A project value is valid if |
|---|---|---|
| `subset` | arrays with set semantics | every element also occurs in the default. A default containing `"*"` allows any element valid under `items`. |
| `at-most` | integers, durations | it is less than or equal to the default. |
| `at-least` | integers, durations | it is greater than or equal to the default. |
| `stricter` | enums | it is at the same or a more restrictive position in `x-vds-order`. |
| `add-only` | parameters without a default | any valid value. Setting it only adds a constraint. |
| `fixed` | any | it equals the default. The parameter is documented but cannot be restricted. |

For `stricter`, the property MUST declare `x-vds-order`, listing all enum values from **most restrictive** to **most permissive**. The default MUST be one of them.

## Expressions

`applies_when` fields in all files of a package use the following expression language.

```ebnf
expression  = or ;
or          = and , { "or" , and } ;
and         = not , { "and" , not } ;
not         = "not" , not | comparison ;
comparison  = operand , [ operator , operand ] | "(" , expression , ")" ;
operator    = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" ;
operand     = parameter | string | number | boolean | "null" | list | "always" ;
parameter   = "profile." , name , { "." , name } ;
list        = "[" , [ operand , { "," , operand } ] , "]" ;
```

Strings are written in double quotes. `always` is true. Whitespace between tokens is ignored.

**Semantics:**

- A `parameter` evaluates to the value from the project profile, or to its default if the profile does not set it. A parameter with `x-vds-restrict: add-only` that is not set evaluates to `null`.
- `x in y` is true if `y` is an array that contains `x`. If `y` is an array parameter whose value contains `"*"`, the result is true for every `x`.
- `<`, `<=`, `>`, `>=` compare integers numerically, durations by length, and enum values of a `stricter` parameter by their position in `x-vds-order`, where a lower position counts as smaller.
- Referring to a parameter that does not exist in `profile.schema.json` makes the package invalid.

**Examples:**

| Expression | Meaning |
|---|---|
| `always` | Applies under every profile. |
| `"DELETE" in profile.methods` | Applies if the project allows DELETE requests. |
| `profile.redirects != "none"` | Applies if redirects are followed at all. |
| `profile.tls.pin != null` | Applies if the project pins a certificate key. |
| `"2" in profile.http_versions and profile.max_response_bytes > 1048576` | Combined condition. |

## Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "specbase/http-client profile",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "http_versions": {
      "type": "array", "uniqueItems": true, "minItems": 1,
      "items": { "enum": ["1.1", "2"] },
      "default": ["1.1", "2"],
      "x-vds-restrict": "subset"
    },
    "methods": {
      "type": "array", "uniqueItems": true, "minItems": 1,
      "items": { "enum": ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] },
      "default": ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
      "x-vds-restrict": "subset"
    },
    "allowed_hosts": {
      "type": "array", "uniqueItems": true, "minItems": 1,
      "items": { "type": "string" },
      "default": ["*"],
      "x-vds-restrict": "subset"
    },
    "redirects": {
      "enum": ["none", "same-origin", "any"],
      "default": "any",
      "x-vds-restrict": "stricter",
      "x-vds-order": ["none", "same-origin", "any"]
    },
    "max_response_bytes": {
      "type": "integer", "minimum": 1, "maximum": 67108864,
      "default": 67108864,
      "x-vds-restrict": "at-most"
    },
    "timeouts": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "connect": {
          "type": "string", "pattern": "^[0-9]+(ms|s|m)$", "x-vds-type": "duration",
          "default": "30s", "x-vds-restrict": "at-most"
        },
        "total": {
          "type": "string", "pattern": "^[0-9]+(ms|s|m)$", "x-vds-type": "duration",
          "default": "5m", "x-vds-restrict": "at-most"
        }
      }
    },
    "tls": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "min_version": {
          "enum": ["1.2", "1.3"],
          "default": "1.2",
          "x-vds-restrict": "stricter",
          "x-vds-order": ["1.3", "1.2"]
        },
        "pin": {
          "type": "string", "pattern": "^sha256/[A-Za-z0-9+/]{43}=$",
          "x-vds-restrict": "add-only"
        }
      }
    }
  }
}
```

The project profile from the concept (§5.3) is valid against this schema: every value is a subset of, at most, or stricter than its default.
