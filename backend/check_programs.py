from database import get_db
from sqlalchemy import text

db = next(get_db())
try:
    # Check current program types in database
    result = db.execute(text('SELECT id, name, program_type FROM programs'))
    programs = result.fetchall()
    print('Current programs and their types:')
    for prog in programs:
        print(f'  ID: {prog[0]}, Name: {prog[1]}, Type: "{prog[2]}"')
finally:
    db.close()
