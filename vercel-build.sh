#!/bin/bash
# Vercel build script for React SPA
echo "Starting Vercel build..."

# Install dependencies
npm install

# Build the project
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "Build successful - dist directory created"
    ls -la dist/
else
    echo "Build failed - dist directory not found"
    exit 1
fi

echo "Vercel build completed successfully"
