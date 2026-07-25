# Code Coverage Advance

[![Build Status](https://github.com/ZeroWiggliness/CodeCoverageAdv/actions/workflows/ci.yml/badge.svg)](https://github.com/ZeroWiggliness/CodeCoverageAdv/actions/workflows/ci-release.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ZeroWiggliness/CodeCoverageAdv/pulls) [![Issues](https://img.shields.io/github/issues/ZeroWiggliness/CodeCoverageAdv.svg)](https://github.com/your-username/cobertura-change-only/issues) ![Code Coverage](https://img.shields.io/badge/Code%20Coverage-92.6%25-danger?style=flat)

A GitHub Action that generates code coverage results from a commonly used coverage format. Additionally it generates code coverage for only changed files in PR. Also generates badges, passed/failed outputs.

## Description

This action generates a Cobertura code coverage file only on the PR files that have changed. Perfect for teams who want to ensure that new or modified code meets coverage standards without being penalized for legacy code coverage issues. Takes a Cobertura file generated from many test frameworks as input and used but CircleCI, SonarQube, Codecov etc.

![Code Coverage](https://img.shields.io/badge/Code%20Coverage-92.6%25-danger?style=flat)

## Code Coverage Summary

| Package     | Line Rate             | Branch Rate          | Health |
| ----------- | --------------------- | -------------------- | ------ |
| main        | 91.0%                 | 61.4%                | ✅     |
| **Summary** | **91.0%** (173 / 190) | **61.4%** (89 / 145) | **✅** |

_Minimum pass threshold is `50.0%`_

## Code Coverage Summary

| Package     | Line Rate             | Branch Rate         | Health |
| ----------- | --------------------- | ------------------- | ------ |
| main        | 91.1%                 | 60.8%               | ✅     |
| **Summary** | **91.1%** (173 / 190) | **60.8%** (59 / 97) | **✅** |

_Minimum pass threshold is `50.0%`_

Some features:

- Generates a modified Cobertura file containing results for only changed files since PR branch creation. Optional.
- Markdown formatted coverage reports
- Coverage badges for both overall and changed files
- Pass/fail checks based on configurable thresholds
- Uncovered lines table grouped by file and method with compressed line ranges (e.g. `21,23,26-31,33`)

## Usage

IMPORANT: If you find that changes are not detected, checkout the branch with a fetch-depth: 0.

### Basic Example

```yaml
- uses: actions/checkout@v3
    with:
      fetch-depth: 0

# Apply the Cobertura Change Only Action
- name: Check coverage on changed files
  uses: ZeroWiggliness/CodeCoverageAdv@v1
  with:
    cobertura-file: 'coverage/cobertura.xml'
    output-file: 'coverage/changed-only.xml'
    main-branch: 'develop'
    coverage-threshold: '60 80'
    coverage-changes-threshold: '70 90'
    badge-style: 'flat'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    file-filters: 'src/**/*.ts,src/**/*.js,!**/*.test.ts,!**/*.spec.js'
    fail-action: 'true'
    max-missing-lines: '100'

- name: Add coverage comment to PR
        if: github.event_name == 'pull_request'
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: coverage
          message: |
            ${{ steps.coverage.outputs.coverage-badge }} ${{ steps.coverage.outputs.coverage-changes-badge }}
            ## Coverage Report

            ${{ steps.coverage.outputs.coverage-markdown }}

            ## Changed Files Coverage

            ${{ steps.coverage.outputs.coverage-changes-markdown }}

            ${{ steps.coverage.outputs.coverage-changes-missing-lines }}
```

## GitLab CI Usage (Docker / `cca` CLI)

Build the Docker image from the repository root and push it to your registry, then use it as a GitLab CI job image. The `cca` command accepts the same options as the GitHub Action inputs.

### Building the image

```bash
docker build -t registry.example.com/cca:latest .
docker push registry.example.com/cca:latest
```

### CLI options

All flags match the GitHub Action input names (hyphenated, prefixed with `--`).

| Flag                           | Description                                                                                                         | Default                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `--cobertura-file`             | Path to the Cobertura XML input file                                                                                | `coverage/cobertura-coverage.xml` |
| `--output-file`                | Path to save the filtered coverage XML (MR pipelines only). Empty = disabled.                                       |                                   |
| `--main-branch`                | Branch to compare against for changed-files detection                                                               | `main`                            |
| `--current-branch`             | Current branch name (also read from `CI_COMMIT_REF_NAME`)                                                           |                                   |
| `--coverage-threshold`         | `<warning%> <success%>` for overall coverage                                                                        | `50 75`                           |
| `--coverage-changes-threshold` | `<warning%> <success%>` for changed-file coverage                                                                   | `50 75`                           |
| `--badge-style`                | Shield.io badge style (`flat`, `flat-square`, `plastic`, `for-the-badge`, `social`)                                 | `flat`                            |
| `--file-filters`               | Comma-separated glob patterns to include/exclude                                                                    | `**/*.*`                          |
| `--fail-action`                | Exit with code 1 when coverage is below threshold                                                                   | `true`                            |
| `--max-missing-lines`          | Maximum rows in the uncovered lines table                                                                           | `100`                             |
| `--merge-request`              | Force merge-request mode (changed-files analysis). Auto-detected via `CI_PIPELINE_SOURCE` / `CI_MERGE_REQUEST_IID`. | `false`                           |
| `--output-json`                | Path to write all outputs as a JSON file. Prints to stdout if omitted.                                              |                                   |

### Merge-request detection

Changed-file analysis runs automatically when any of these are true:

- `CI_PIPELINE_SOURCE=merge_request_event` (set by GitLab on MR pipelines)
- `CI_MERGE_REQUEST_IID` is set
- `--current-branch` differs from `--main-branch`
- `--merge-request` flag is passed explicitly

Changed files are resolved with `git merge-base origin/<main-branch> HEAD` + `git diff --name-only`. A full clone (`GIT_DEPTH: 0`) is required.

### Basic GitLab CI example

```yaml
coverage:
  image: registry.example.com/cca:latest
  variables:
    GIT_DEPTH: 0
  script:
    - <your test command that generates a Cobertura XML>
    - cca --cobertura-file coverage/cobertura-coverage.xml --main-branch main --coverage-threshold "60 80" --coverage-changes-threshold "70 90" --file-filters "src/**/*.ts,!**/*.test.ts" --output-json cca-output.json
  artifacts:
    paths:
      - cca-output.json
```

### Running locally for testing

Mount your project directory into the container so the tool can read the Cobertura file and access the git history.

**Overall coverage only (no branch comparison):**

```bash
docker run --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  registry.example.com/cca:latest \
  cca --cobertura-file coverage/cobertura-coverage.xml \
      --coverage-threshold "60 80" \
      --output-json /workspace/cca-output.json

cat cca-output.json
```

**Simulating a merge-request pipeline (changed-files analysis):**

The git history must be available inside the container. Mount the repo root (which contains `.git`) and make sure `origin/<main-branch>` is fetchable — the branch must already be fetched locally.

```bash
# Ensure the main branch ref is available locally
git fetch origin main

docker run --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  registry.example.com/cca:latest \
  cca --cobertura-file coverage/cobertura-coverage.xml \
      --main-branch main \
      --current-branch feature/my-branch \
      --coverage-threshold "60 80" \
      --coverage-changes-threshold "70 90" \
      --file-filters "src/**/*.ts,!**/*.test.ts" \
      --output-json /workspace/cca-output.json

cat cca-output.json
```

> **Windows (PowerShell):** replace `$(pwd)` with `${PWD}`.

**Piping the output directly to `jq`:**

```bash
docker run --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  registry.example.com/cca:latest \
  cca --cobertura-file coverage/cobertura-coverage.xml | jq '.["coverage-passrate"]'
```

### Consuming the JSON output in a later job

All GitHub Action outputs are written as keys in the JSON file:

```json
{
  "coverage-badge": "![Code Coverage](...)",
  "coverage-markdown": "## Code Coverage Summary\n...",
  "coverage-passrate": "74.4%",
  "coverage-failed": "false",
  "coverage-missing-lines": "## Uncovered Lines\n...",
  "coverage-changes-badge": "![Code Changes Coverage](...)",
  "coverage-changes-markdown": "## Code Coverage Summary\n...",
  "coverage-changes-passrate": "88.0%",
  "coverage-changes-failed": "false",
  "coverage-changes-missing-lines": "## Uncovered Lines\n..."
}
```

Use `jq` or any JSON tool to extract individual values in downstream jobs:

```yaml
post-coverage:
  needs: [coverage]
  script:
    - BADGE=$(jq -r '.["coverage-badge"]' cca-output.json)
    - echo "Coverage badge $BADGE"
```

## Inputs

| Input                        | Description                                                            | Required | Default                                       |
| ---------------------------- | ---------------------------------------------------------------------- | -------- | --------------------------------------------- |
| `cobertura-file`             | Path to the Cobertura XML input file                                   | Yes      | `coverage/cobertura-coverage.xml`             |
| `output-file`                | Path to save the filtered coverage output file. Empty = No OutputFile. | No       |                                               |
| `main-branch`                | Name of the main branch to compare against.                            | No       | `${{ github.repository_default_branch }}`     |
| `coverage-threshold`         | Thresholds for coverage percentage health `<warning% <success%>`       | No       | `50 75`                                       |
| `coverage-changes-threshold` | Thresholds for changed files coverage.                                 | No       | `50 75`                                       |
| `badge-style`                | GitHub badge style to use.                                             | No       | `flat`                                        |
| `github-token`               | GitHub token for accessing the repository.                             | No       | `${{ github.token }}`                         |
| `current-branch`             | Name of the current branch.                                            | No       | `${{ github.head_ref \|\| github.ref_name }}` |
| `file-filters`               | Comma-separated list of file patterns.                                 | No       | `**/*.*`                                      |
| `fail-action`                | Whether to fail if coverage is below threshold.                        | No       | `true`                                        |
| `max-missing-lines`          | Maximum rows to show in the uncovered lines table.                     | No       | `100`                                         |

## Outputs

| Output                           | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| `coverage-markdown`              | Markdown formatted overall coverage report                                  |
| `coverage-changes-markdown`      | Markdown formatted report for changed files only                            |
| `coverage-passrate`              | Overall coverage pass rate                                                  |
| `coverage-changes-passrate`      | Changed files coverage pass rate                                            |
| `coverage-badge`                 | Overall coverage badge markdown                                             |
| `coverage-changes-badge`         | Changed files coverage badge markdown                                       |
| `coverage-failed`                | `true` if overall coverage is below threshold                               |
| `coverage-changes-failed`        | `true` if changed files coverage is below threshold                         |
| `coverage-missing-lines`         | Markdown table of uncovered lines grouped by file and method (overall)      |
| `coverage-changes-missing-lines` | Markdown table of uncovered lines grouped by file and method (changes only) |

## Differences

The quality of the calculations depends on the Cobertura file supplied to the action. For some reason I cant get it with exactly the same branch results but it generates the right results.

dotCover/reportGenerator doesnt generate branch results. jest cobertura (as used for this) generates branch counts I cant replicate.

## Building and Bundling

To build and bundle this action:

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/cobertura-change-only.git
   cd cobertura-change-only
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Format and lint the code

   ```bash
   npm run format:write
   ```

4. Bundle the action for distribution
   ```bash
   npm run bundle
   ```

This will create a `dist/index.js` file that contains the bundled action code, which is referenced in the `action.yml` file.

## License

[MIT](LICENSE)
