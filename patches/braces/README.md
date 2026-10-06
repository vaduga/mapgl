# Local `braces` security patch

This package is based on upstream [`braces` 3.0.3](https://github.com/micromatch/braces/tree/3.0.3). The upstream release has no patched version for [CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), which affects deeply nested brace patterns that can exhaust the call stack. In [the maintainer's comment on issue #70](https://github.com/micromatch/braces/issues/70#issuecomment-5995348316), the maintainer says no fix is planned.

The local patch adds a maximum brace nesting depth of 100 in `lib/parse.js`. Rejecting excessive nesting at parse time bounds the recursive work performed by the compiler and expander. The local package version is `3.0.4` so the lockfile distinguishes it from the vulnerable upstream release.

When upstream publishes a fix, compare it with this guard and remove this local package if the upstream release fully addresses the issue.
