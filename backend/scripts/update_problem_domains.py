"""Update existing problems with domain values based on slug mapping."""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem


# Domain mapping based on problem slugs
DOMAIN_MAPPING = {
    'common': [
        'problem-ve01', 'problem-ve02', 'problem-ve03', 'problem-ve04', 'problem-ve05',
        'problem-e01', 'problem-e02', 'problem-e04', 'problem-e07',
        'problem-e11', 'problem-e13', 'problem-e14', 'problem-e16',
        'problem-m02',
        # Legacy seed problems
        'sum-list', 'count-even-numbers',
    ],
    'commerce': [
        'problem-e05', 'problem-e06', 'problem-e12', 'problem-e15',
        'problem-m03', 'problem-m10',
        'problem-h02',
    ],
    'saas': [
        'problem-e08',
        'problem-m01', 'problem-m04',
        'problem-h03', 'problem-h06', 'problem-h07',
        # Legacy seed problems
        'find-maximum',
    ],
    'fintech': [
        'problem-m05',
        'problem-h01', 'problem-h04',
    ],
    'platform': [
        'problem-m06', 'problem-m07',
        'problem-h05', 'problem-h08', 'problem-h09',
    ],
    'content': [
        'problem-e03', 'problem-e09', 'problem-e10',
        'problem-m08', 'problem-m09',
    ]
}


def get_domain_for_slug(slug: str) -> str:
    """Get domain for a given problem slug."""
    for domain, slugs in DOMAIN_MAPPING.items():
        if slug in slugs:
            return domain
    return 'common'  # Default to common


def update_problem_domains():
    """Update domain field for all existing problems."""
    db: Session = SessionLocal()
    try:
        problems = db.query(Problem).all()

        if not problems:
            print("No problems found in database.")
            return

        print(f"Found {len(problems)} problems. Updating domains...")
        print("=" * 60)

        updated_count = 0
        for problem in problems:
            new_domain = get_domain_for_slug(problem.slug)
            old_domain = getattr(problem, 'domain', None)

            if old_domain != new_domain:
                problem.domain = new_domain
                print(f"Updated: {problem.slug} -> {new_domain}")
                updated_count += 1
            else:
                print(f"Skipped: {problem.slug} (already {new_domain})")

        db.commit()

        print("=" * 60)
        print(f"Done! Updated {updated_count} problems.")

        # Summary by domain
        print("\nDomain summary:")
        domain_counts = {}
        for problem in problems:
            domain = problem.domain
            domain_counts[domain] = domain_counts.get(domain, 0) + 1

        for domain, count in sorted(domain_counts.items()):
            print(f"  {domain}: {count}")

    except Exception as e:
        db.rollback()
        print(f"Error updating domains: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    update_problem_domains()
