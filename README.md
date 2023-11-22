# Compare Node Versions Action

This GitHub Action allows you to compare Node.js versions in your workflow, ensuring compatibility and consistency across environments.

## Features

- **Version Comparison**: Easily compare Node.js versions used in your project.
- **Dockerized**: Runs in a Docker container for consistent environments.

## Usage

To use the Compare Node Versions Action in your workflow, follow these steps:

### Step 1: Set Up Workflow

Create or update your `.github/workflows/[workflow name].yml` file in your repository:

```yaml
name: Node Version Check
on: [push, pull_request]

jobs:
  compare-node-versions:
    runs-on: ubuntu-latest
    name: Compare Node Versions
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3

      - name: Compare Node Versions
        uses: simpleanalytics/compare-node-versions-action@1.0.0
```

### Step 2: Configuration

Configure the action in your `main.yml` workflow file:

```yaml
- name: Compare Node Versions
  uses: simpleanalytics/compare-node-versions-action@1.0.0
  with:
    # Add necessary inputs here
```

## Examples

Here's a simple example to illustrate how to use this action:

```yaml
steps:
  - name: Checkout
    uses: actions/checkout@v3

  - name: Compare Node Versions
    uses: simpleanalytics/compare-node-versions-action@1.0.0
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with your improvements.
