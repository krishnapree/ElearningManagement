"""
Fix enum data inconsistencies in the database
This script fixes the program_type enum values to be consistent
"""

from database import get_db
from models import Program, ProgramType
from sqlalchemy import text

def fix_program_types():
    """Fix program type enum values to be lowercase"""
    db = next(get_db())
    try:
        print("🔧 Fixing program type enum values...")

        # Check current values in database using raw SQL
        result = db.execute(text('SELECT id, name, program_type FROM programs'))
        programs = result.fetchall()

        print("Current program types in database:")
        for prog in programs:
            print(f"  ID: {prog[0]}, Name: {prog[1]}, Type: '{prog[2]}'")

        # Map uppercase enum names to lowercase enum values
        type_mapping = {
            'BACHELOR': 'bachelor',
            'MASTER': 'master',
            'PHD': 'phd',
            'DIPLOMA': 'diploma',
            'CERTIFICATE': 'certificate'
        }

        fixed_count = 0
        for prog in programs:
            prog_id, prog_name, current_type = prog

            if current_type in type_mapping:
                new_value = type_mapping[current_type]
                print(f"  Fixing program '{prog_name}': {current_type} -> {new_value}")

                # Update using raw SQL to avoid enum validation issues
                db.execute(
                    text("UPDATE programs SET program_type = :new_type WHERE id = :prog_id"),
                    {"new_type": new_value, "prog_id": prog_id}
                )
                fixed_count += 1

        if fixed_count > 0:
            db.commit()
            print(f"✅ Fixed {fixed_count} program type values")
        else:
            print("✅ No program types needed fixing")

        # Verify the fix
        print("\n📊 Current program types after fix:")
        result = db.execute(text('SELECT id, name, program_type FROM programs'))
        programs = result.fetchall()
        for prog in programs:
            print(f"  ID: {prog[0]}, Name: {prog[1]}, Type: '{prog[2]}'")

    except Exception as e:
        print(f"❌ Error fixing program types: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_program_types()
