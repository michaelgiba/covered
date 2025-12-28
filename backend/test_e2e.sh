#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Running Curate..."
uv run main.py curate

echo "Running Segment..."
uv run main.py segment

echo "E2E Test Completed Successfully."
