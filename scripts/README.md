# NoteCottage Scripts

Utility scripts for development, testing, and database maintenance.

## Database Maintenance

### `fix-database.js`

**Purpose:** Repair and verify the SQLite database integrity.

**Usage:**
```bash
node scripts/fix-database.js
```

**What it does:**
- Checks database integrity
- Repairs corrupted tables if possible
- Rebuilds FTS (Full-Text Search) indexes
- Verifies foreign key constraints
- Creates a backup before making changes

**When to use:**
- Database errors or corruption
- After upgrading SQLite version
- FTS search not working properly
- Foreign key constraint issues

---

## Testing Scripts

### `test-heading-v17.js`

**Purpose:** Test markdown heading renderer compatibility with marked.js v17.

**Usage:**
```bash
node scripts/test-heading-v17.js
```

**What it does:**
- Tests heading rendering with the new marked.js v17 API
- Verifies `this.parser.parseInline(token.tokens)` works correctly
- Tests heading ID slugification
- Validates HTML output

**When to use:**
- After upgrading marked.js
- Debugging heading display issues
- Verifying slugify utility works correctly

---

### `test-tags.js`

**Purpose:** Test tag functionality and database operations.

**Usage:**
```bash
node scripts/test-tags.js
```

**What it does:**
- Tests tag creation and deletion
- Verifies tag-note associations
- Tests tag search functionality
- Validates tag autocomplete
- Checks tag normalization (lowercase, trimming)

**When to use:**
- After modifying tag-related code
- Debugging tag issues
- Verifying tag database schema

---

### `test-tag-fixes.js`

**Purpose:** Test specific tag bug fixes and edge cases.

**Usage:**
```bash
node scripts/test-tag-fixes.js
```

**What it does:**
- Tests tag edge cases (empty tags, duplicates, special characters)
- Verifies tag deletion cascade behavior
- Tests tag filtering and search
- Validates tag count accuracy

**When to use:**
- After fixing tag-related bugs
- Regression testing for tag functionality
- Verifying edge case handling

---

## Development Guidelines

### Running All Tests

```bash
# Run all test scripts
for script in scripts/test-*.js; do
    echo "Running $script..."
    node "$script"
done
```

### Creating New Scripts

When creating new utility scripts:

1. **Place in `scripts/` directory**
2. **Use descriptive names:** `verb-noun.js` (e.g., `test-auth.js`, `migrate-data.js`)
3. **Add documentation** to this README
4. **Include usage examples**
5. **Handle errors gracefully**
6. **Add `#!/usr/bin/env node` shebang if making executable**

### Script Naming Conventions

- `test-*.js` - Testing scripts
- `fix-*.js` - Repair/maintenance scripts
- `migrate-*.js` - Database migration scripts
- `generate-*.js` - Code generation scripts
- `setup-*.js` - Setup/initialization scripts

---

## Notes

- All scripts assume they're run from the project root: `node scripts/script-name.js`
- Scripts may modify the database - always backup first if unsure
- Test scripts are safe to run multiple times
- Maintenance scripts (`fix-*`) may make changes - review before running on production data

---

Last updated: January 10, 2026
