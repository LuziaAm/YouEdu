#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Your-Edu-Interativo Monorepo${NC}"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d" " -f2 | cut -d"." -f1,2)
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION found"

# Check Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node $NODE_VERSION found"
echo ""

# Setup Python venv if not exists
if [ ! -d "apps/api/venv" ]; then
    echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
    cd apps/api
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
else
    echo -e "${GREEN}✓${NC} Python venv exists"
fi

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
    npm install
fi

if [ ! -d "apps/web/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing web dependencies...${NC}"
    cd apps/web
    npm install
    cd ../..
fi

echo ""
echo -e "${GREEN}✨ All dependencies installed!${NC}"
echo -e "${YELLOW}Starting development servers...${NC}"
echo ""

# Run dev servers
npm run dev
