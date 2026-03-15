import sqlite3

conn = sqlite3.connect('energy_db.sqlite3')
c = conn.cursor()

# Promote all viewers to operator so they can use the simulation
c.execute("UPDATE users SET role='operator' WHERE role='viewer'")
conn.commit()

# Show current users and roles
c.execute("SELECT username, role, requires_password_change FROM users")
rows = c.fetchall()
print("Current users:")
for row in rows:
    print(f"  username={row[0]}, role={row[1]}, requires_pw_change={row[2]}")

conn.close()
