from database import get_db
from sqlalchemy import text

db = next(get_db())
try:
    # Check the actual database schema for the enum
    result = db.execute(text('PRAGMA table_info(programs)'))
    columns = result.fetchall()
    print('Programs table schema:')
    for col in columns:
        print(f'  {col}')
        
    print()
    # Check if there are any constraints or check constraints
    result = db.execute(text('SELECT sql FROM sqlite_master WHERE type="table" AND name="programs"'))
    schema = result.fetchone()
    if schema:
        print('Programs table creation SQL:')
        print(schema[0])
        
    print()
    # Check current data
    result = db.execute(text('SELECT id, name, program_type FROM programs LIMIT 3'))
    programs = result.fetchall()
    print('Sample program data:')
    for prog in programs:
        print(f'  ID: {prog[0]}, Name: {prog[1]}, Type: "{prog[2]}"')
finally:
    db.close()
