from database import get_db
from models import Program, ProgramType
from sqlalchemy import text

def debug_enum_issue():
    db = next(get_db())
    try:
        print("🔍 Debugging enum issue...")
        
        # Try to query programs directly
        print("\n1. Trying to query programs with SQLAlchemy ORM:")
        try:
            programs = db.query(Program).all()
            print(f"   Success! Found {len(programs)} programs")
            for prog in programs[:3]:
                print(f"   - {prog.name}: {prog.program_type}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Try to query programs with raw SQL
        print("\n2. Trying to query programs with raw SQL:")
        try:
            result = db.execute(text('SELECT id, name, program_type FROM programs'))
            programs = result.fetchall()
            print(f"   Success! Found {len(programs)} programs")
            for prog in programs[:3]:
                print(f"   - {prog[1]}: {prog[2]}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Try to create a new program object manually
        print("\n3. Trying to create Program object manually:")
        try:
            test_prog = Program(
                name="Test Program",
                code="TEST123",
                program_type=ProgramType.BACHELOR,
                department_id=1,
                duration_years=4,
                total_credits=120
            )
            print(f"   Success! Created program with type: {test_prog.program_type}")
        except Exception as e:
            print(f"   Error: {e}")
            
        # Check enum values
        print("\n4. Checking enum values:")
        for item in ProgramType:
            print(f"   {item.name} = '{item.value}'")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_enum_issue()
