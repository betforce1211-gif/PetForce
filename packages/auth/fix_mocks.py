#!/usr/bin/env python3
"""
Quick script to identify patterns in the test file that need mock fixes.
This helps us systematically fix all the remaining test mocks.
"""

import re

# Read the test file
with open('/Users/danielzeddr/PetForce/packages/auth/src/__tests__/api/household-api.test.ts', 'r') as f:
    content = f.read()

# Find all test blocks that use mockTableQuery (the old pattern that doesn't work)
pattern = r"it\('([^']+)'.*?mockTableQuery\.(single|order|eq|gte|insert|update|delete)"
matches = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(matches)} tests using mockTableQuery pattern")
for match in matches[:10]:
    print(f"  - {match[0]}")
