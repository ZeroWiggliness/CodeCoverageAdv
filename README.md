# Cobertura Change Only Action

A GitHub Action that generates code coverage results from a commonly used coverage format. Additionally it generates code coverage for only changed files in PR. Also generates badges, passed/failed outputs.

## Description

This action generates a Cobertura code coverage file only on the PR files that have changed. Perfect for teams who want to ensure that new or modified code meets coverage standards without being penalized for legacy code coverage issues. Takes a Cobertura file generated from many test frameworks as input and used but CircleCI, SonarQube, Codecov etc.

![Code Coverage](https://img.shields.io/badge/Code%20Coverage-91.0%25-danger?style=flat) ![Code Changes Coverage](https://img.shields.io/badge/Code%20Changes%20Coverage-91.1%25-danger?style=flat)

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

## Usage

IMPORANT: If you find that changes are not detected, checkout the branch with a fetch-depth: 0.

### Basic Example

```yaml
- uses: actions/checkout@v3
    with:
      fetch-depth: 0

# Apply the Cobertura Change Only Action
- name: Check coverage on changed files
  uses: ZeroWiggliness/CoberturaChangeOnly@v1
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

## Outputs

| Output                      | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `coverage-markdown`         | Markdown formatted overall coverage report          |
| `coverage-changes-markdown` | Markdown formatted report for changed files only    |
| `coverage-passrate`         | Overall coverage pass rate                          |
| `coverage-changes-passrate` | Changed files coverage pass rate                    |
| `coverage-badge`            | Overall coverage badge markdown                     |
| `coverage-changes-badge`    | Changed files coverage badge markdown               |
| `coverage-failed`           | `true` if overall coverage is below threshold       |
| `coverage-changes-failed`   | `true` if changed files coverage is below threshold |

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
