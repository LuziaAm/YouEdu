"""
Row Level Security (RLS) Setup Script for YouEdu

This script manages RLS policies in the Supabase database.
It can apply either development (permissive) or production (restrictive) policies.

Usage:
    # Apply development policies (interactive)
    python -m database.setup_rls

    # Apply development policies (non-interactive)
    python -m database.setup_rls --mode dev

    # Apply production policies
    python -m database.setup_rls --mode prod

    # Generate SQL files only (no apply)
    python -m database.setup_rls --generate-only --mode prod
"""

import argparse
import sys
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def read_migration_file(filename: str) -> str:
    """Read a migration SQL file."""
    filepath = MIGRATIONS_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Migration file not found: {filepath}")
    return filepath.read_text(encoding="utf-8")


def print_instructions(mode: str, sql_content: str) -> None:
    """Print instructions for applying RLS policies."""
    print("\n" + "=" * 70)
    print(f"  YouEdu RLS Setup - {mode.upper()} Mode")
    print("=" * 70)

    if mode == "dev":
        print("\n  WARNING: Development mode policies are PERMISSIVE!")
        print("  Do NOT use in production.\n")
    else:
        print("\n  Production mode policies restrict access based on auth.uid()")
        print("  Users can only access their own data.\n")

    print("=" * 70)
    print("  MANUAL STEPS REQUIRED")
    print("=" * 70)
    print("""
Supabase requires SQL to be executed via the Dashboard:

1. Open Supabase Dashboard:
   https://supabase.com/dashboard

2. Select your project

3. Go to: SQL Editor (left sidebar)

4. Click 'New query'

5. Copy and paste the SQL below

6. Click 'Run' (or Cmd/Ctrl + Enter)

7. Verify no errors in the output

8. Go to Table Editor to confirm RLS is enabled
   (You should see a shield icon next to table names)
""")

    print("=" * 70)
    print("  SQL TO EXECUTE")
    print("=" * 70)
    print(sql_content)
    print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Setup Row Level Security for YouEdu database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m database.setup_rls                    # Interactive mode
  python -m database.setup_rls --mode dev         # Development policies
  python -m database.setup_rls --mode prod        # Production policies
  python -m database.setup_rls --generate-only    # Just print SQL
        """,
    )
    parser.add_argument(
        "--mode",
        choices=["dev", "prod"],
        help="RLS mode: 'dev' (permissive) or 'prod' (restrictive)",
    )
    parser.add_argument(
        "--generate-only",
        action="store_true",
        help="Only print the SQL without instructions",
    )

    args = parser.parse_args()

    # Interactive mode if no mode specified
    if args.mode is None and not args.generate_only:
        print("\n" + "=" * 70)
        print("  YouEdu - Row Level Security Setup")
        print("=" * 70)
        print("\nSelect RLS mode:\n")
        print("  [1] DEVELOPMENT - Permissive policies (allow all)")
        print("      Use for local development only\n")
        print("  [2] PRODUCTION  - Restrictive policies (auth required)")
        print("      Users can only access their own data\n")

        choice = input("Enter choice [1/2]: ").strip()

        if choice == "1":
            args.mode = "dev"
        elif choice == "2":
            args.mode = "prod"
        else:
            print("\nInvalid choice. Exiting.")
            sys.exit(1)

    # Default to dev if still not set
    mode = args.mode or "dev"

    # Select appropriate migration file
    filename = "001_enable_rls_dev.sql" if mode == "dev" else "001_enable_rls.sql"

    try:
        sql_content = read_migration_file(filename)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    if args.generate_only:
        print(sql_content)
    else:
        print_instructions(mode, sql_content)

        if mode == "dev":
            print("REMINDER: Switch to production policies before deploying!")
            print("Run: python -m database.setup_rls --mode prod\n")


if __name__ == "__main__":
    main()
