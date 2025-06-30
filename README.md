# Cobertura Change Only Action

A GitHub Action that generates code coverage results. Additionally it generates code coverage for only changed files in PR. Also generates badges, passed/failed outputs.

## Description

This action generates a Cobertura code coverage file only on the PR files that have changed. Perfect for teams who want to ensure that new or modified code meets coverage standards without being penalized for legacy code coverage issues. Takes a Cobertura file generated from many test frameworks as input.

Some features:

- Generates a modified Cobertura file containing results for only changed files since PR branch creation. Optional.
- Markdown formatted coverage reports
- Coverage badges for both overall and changed files
- Pass/fail checks based on configurable thresholds

## Usage

### Basic Example

```yaml
# Run your tests and generate coverage report
- name: Run tests with coverage
  run: npm test

# Apply the Cobertura Change Only Action
- name: Check coverage on changed files
  uses: ZeroWiggliness/CoberturaChangeOnly@v1
  with:
    cobertura-file: 'coverage/cobertura.xml'
    output-file: 'coverage/cobertura-changes.xml'
```

### Advanced Example

```yaml
name: Detailed Coverage Analysis

on:
  pull_request:
    branches: [main, develop]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      # Run your tests and generate coverage report
      - name: Run tests with coverage
        run: npm test

      # Apply the Cobertura Change Only Action with custom settings
      - name: Check coverage on changed files
        id: coverage
        uses: your-username/cobertura-change-only@v1
        with:
          cobertura-file: 'coverage/cobertura-coverage.xml'
          output-file: 'coverage/changed-only.xml'
          main-branch: 'develop'
          coverage-threshold: '60 80'
          coverage-changes-threshold: '70 90'
          badge-style: 'for-the-badge'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          file-filters: 'src/**/*.ts,src/**/*.js,!**/*.test.ts,!**/*.spec.js'
          fail-action: 'true'

      # Use the outputs
      - name: Add coverage comment to PR
        if: github.event_name == 'pull_request'
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: coverage
          message: |
            ## Coverage Report

            ${{ steps.coverage.outputs.coverage-markdown }}

            ## Changed Files Coverage

            ${{ steps.coverage.outputs.coverage-changes-markdown }}

            ${{ steps.coverage.outputs.coverage-badge }}
            ${{ steps.coverage.outputs.coverage-changes-badge }}
```

## Inputs

| Input                        | Description                                                      | Required | Default                           |
| ---------------------------- | ---------------------------------------------------------------- | -------- | --------------------------------- | --- | ------------------- |
| `cobertura-file`             | Path to the Cobertura XML input file                             | Yes      | `coverage/cobertura-coverage.xml` |
| `output-file`                | Path to save the filtered coverage output file                   | No       | ``                                |
| `main-branch`                | Name of the main branch to compare against                       | No       | Repository default branch         |
| `coverage-threshold`         | Thresholds for coverage percentage health `<warning% <success%>` | No       | `50 75`                           |
| `coverage-changes-threshold` | Thresholds for changed files coverage                            | No       | `50 75`                           |
| `badge-style`                | GitHub badge style to use                                        | No       | `flat`                            |
| `github-token`               | GitHub token for accessing the repository                        | Yes      | `${{ github.token }}`             |
| `current-branch`             | Name of the current branch                                       | No       | `${{ github.head_ref              |     | github.ref_name }}` |
| `file-filters`               | Comma-separated list of file patterns                            | No       | `**/*.*`                          |
| `fail-action`                | Whether to fail if coverage is below threshold                   | No       | `true`                            |

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
