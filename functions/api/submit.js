function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function torontoParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
}

function nextSubmissionWeek() {
  const p = torontoParts();
  const today = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
  const weekday = today.getUTCDay(); // Sunday=0
  const daysSinceMonday = (weekday + 6) % 7;
  today.setUTCDate(today.getUTCDate() - daysSinceMonday);
  const fridayAfterCutoff = weekday === 5 &&
    (Number(p.hour) > 16 || (Number(p.hour) === 16 && Number(p.minute) >= 30));
  today.setUTCDate(today.getUTCDate() + (fridayAfterCutoff ? 14 : 7));
  return today.toISOString().slice(0, 10);
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "The database is not configured yet." }, 503);
  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Please submit a valid form." }, 400); }

  const code = String(body.code || "").trim().toUpperCase();
  const name = String(body.name || "").trim();
  const availability = String(body.availability || "").trim();

  if (!code || code.length > 64) return json({ error: "Enter your employee code." }, 400);
  if (!name || name.length > 120) return json({ error: "Enter your full name." }, 400);
  if (!availability || availability.length > 12000) return json({ error: "Availability is missing or too long." }, 400);

  const employee = await env.DB.prepare(
    "SELECT code, employee_name FROM employee_codes WHERE code = ? AND active = 1"
  ).bind(code).first();

  if (!employee) return json({ error: "That employee code is not valid or is inactive. Please check with your manager." }, 403);

  // The assigned employee name is authoritative; a code cannot be used to submit under another name.
  if (employee.employee_name.trim().toLowerCase() !== name.toLowerCase()) {
    return json({ error: "The name does not match this employee code. Please use the assigned name or contact your manager." }, 403);
  }

  const weekStart = nextSubmissionWeek();
  try {
    const result = await env.DB.prepare(
      "INSERT INTO submissions (employee_code, employee_name, week_start, availability_text) VALUES (?, ?, ?, ?)"
    ).bind(employee.code, employee.employee_name, weekStart, availability).run();

    if (!result.success || result.meta?.changes !== 1) {
      return json({ error: "We could not confirm your submission. Please try again." }, 500);
    }
    return json({ ok: true, weekStart, message: "Your availability has been submitted and locked for this week." }, 201);
  } catch (error) {
    const message = String(error?.message || "");
    if (/UNIQUE constraint failed|unique constraint/i.test(message)) {
      return json({ error: "You have already submitted availability for this week. Your submission is locked." }, 409);
    }
    return json({ error: "The submission could not be saved. Please try again or contact your manager." }, 500);
  }
}
