# Secure defaults

| Setting | Default | Why |
|---|---|---|
| Bad rows | Stop and list every one | A skipped row can hide the one account that matters. |
| Missing people list or rules | That check prints "not checked" | An unrun check must never read as clean. |
| Conflict rules | None built in | Which duties to separate depends on your process and controls. |
| User names | Compared without case | `Dan` and `dan` are the same person in most directories. |
| Exit code | 0, unless `--fail-on-findings` is given | The tool reports by default; a pipeline decides whether findings block it. |
| Network | Never used | The exports contain personal data and stay on the machine. |
| Output | Terminal | Nothing is written to disk unless `--output` is given. |
