<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Program coordination (read before writing ANY file)
Read `.hermes/PROGRAM.md` first. It is the single source of truth for what exists and who
owns it. Never build a feature another agent already owns — merge or extend instead. After
you change files, update the ownership table in `.hermes/PROGRAM.md`. The program-manager
cron reconciles drift every 3h and will flag you if you skip this.
