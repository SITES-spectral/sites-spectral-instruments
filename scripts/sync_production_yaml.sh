#!/bin/bash
#
# Sync Production YAML from Cloudflare D1 Database
#
# This script automates the process of fetching production data from Cloudflare D1
# and generating an updated stations.yaml file with timestamp.
#
# Usage:
#   ./sync_production_yaml.sh
#
# Environment Variables Required:
#   CLOUDFLARE_API_TOKEN - Your Cloudflare API token with D1 read permissions
#
# Output:
#   yamls/stations_production_YYYYMMDD_HHMMSS.yaml - Timestamped production data
#   yamls/stations_latest_production.yaml - Always points to latest sync
#

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Output directory
OUTPUT_DIR="$PROJECT_ROOT/yamls"
mkdir -p "$OUTPUT_DIR"

# Python script (use wrangler version if API token not available)
PYTHON_SCRIPT="$SCRIPT_DIR/fetch_production_data_wrangler.py"

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo -e "${RED}ERROR: Python script not found at $PYTHON_SCRIPT${NC}"
    exit 1
fi

# Header
echo -e "${BLUE}================================================================================${NC}"
echo -e "${BLUE}SITES Spectral - Production YAML Sync${NC}"
echo -e "${BLUE}================================================================================${NC}"
echo ""

# Check for wrangler authentication
echo -e "${BLUE}Checking wrangler authentication...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}ERROR: wrangler CLI not found!${NC}"
    echo "Please install wrangler: npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}ERROR: Wrangler not authenticated!${NC}"
    echo "Please run: wrangler login"
    exit 1
fi

echo -e "${GREEN}✓ Wrangler authenticated${NC}"
echo ""

# Check Python dependencies
echo -e "${BLUE}Checking Python dependencies...${NC}"

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo -e "${RED}ERROR: uv is not installed!${NC}"
    echo "Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if venv exists, create if not
if [ ! -d "$PROJECT_ROOT/.venv" ]; then
    echo -e "${YELLOW}Creating virtual environment with Python 3.12.9...${NC}"
    uv venv --python 3.12.9 "$PROJECT_ROOT/.venv"
fi

# Activate virtual environment
source "$PROJECT_ROOT/.venv/bin/activate"

# Install dependencies using uv pip
python3 -c "import yaml" 2>/dev/null || {
    echo -e "${YELLOW}Installing required Python packages with uv...${NC}"
    uv pip install pyyaml
}

echo -e "${GREEN}✓ Python dependencies OK${NC}"
echo ""

# Run the Python script (with venv activated)
echo -e "${BLUE}Fetching production data from Cloudflare D1...${NC}"
echo -e "${BLUE}Using Python: $(which python3) ($(python3 --version))${NC}"
echo ""

if python3 "$PYTHON_SCRIPT"; then
    echo ""
    echo -e "${GREEN}================================================================================${NC}"
    echo -e "${GREEN}SUCCESS: Production YAML sync completed!${NC}"
    echo -e "${GREEN}================================================================================${NC}"
    echo ""
    echo "Output files:"
    echo "  • Latest: $OUTPUT_DIR/stations_latest_production.yaml"
    echo "  • Archive: $OUTPUT_DIR/stations_production_*.yaml"
    echo ""

    # Show latest files
    echo "Recent production YAML files:"
    ls -lht "$OUTPUT_DIR"/stations_production_*.yaml 2>/dev/null | head -5 || echo "  (none yet)"
    echo ""

    exit 0
else
    echo ""
    echo -e "${RED}================================================================================${NC}"
    echo -e "${RED}ERROR: Production YAML sync failed!${NC}"
    echo -e "${RED}================================================================================${NC}"
    echo ""
    exit 1
fi
