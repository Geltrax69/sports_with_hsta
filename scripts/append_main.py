#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/pages/admin/TournamentRegistrations.tsx"
text = p.read_text()
if "const isRegistered" in text:
    print("main return already present")
    raise SystemExit(0)

main = (Path(__file__).parent / "main_return.tsx").read_text()
text = text.rstrip() + "\n" + main
p.write_text(text)
print("done", len(text.splitlines()), "lines")
