const SHEET_NAME = "Submissions";
const SPREADSHEET_TITLE = "D-Spot Staff Availability";

function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SPREADSHEET_ID");
  let spreadsheet;
  if (id) {
    spreadsheet = SpreadsheetApp.openById(id);
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_TITLE);
    id = spreadsheet.getId();
    props.setProperty("SPREADSHEET_ID", id);
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    const headers = ["Submitted at", "Employee name", "Week starts", "Week ends"];
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].forEach(day => {
      headers.push(day + " availability", day + " comment");
    });
    headers.push("General comments");
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.autoResizeColumns(1, headers.length);
  }
  Logger.log("Private scheduler spreadsheet: " + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function doPost(e) {
  try {
    const raw = e && e.parameter && e.parameter.payload;
    if (!raw || raw.length > 30000) throw new Error("Invalid submission.");
    const data = JSON.parse(raw);

    // Basic validation and a hidden honeypot field for casual bot submissions.
    if (data.website) return response_(true, "");
    const name = String(data.name || "").trim().slice(0, 120);
    if (!name) throw new Error("Please enter your full name.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.weekStart || "")) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(data.weekEnd || ""))) {
      throw new Error("Invalid week dates.");
    }
    const allowedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const days = data.days || {};
    const props = PropertiesService.getScriptProperties();
    const spreadsheetId = props.getProperty("SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("Scheduler setup is incomplete. Please contact the scheduler.");

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        const headers = ["Submitted at", "Employee name", "Week starts", "Week ends"];
        allowedDays.forEach(day => headers.push(day + " availability", day + " comment"));
        headers.push("General comments");
        sheet.appendRow(headers);
        sheet.setFrozenRows(1);
      }
      const row = [new Date(), name, data.weekStart, data.weekEnd];
      allowedDays.forEach(day => {
        const item = days[day] || {};
        row.push(String(item.availability || "No hours selected").slice(0, 2000));
        row.push(String(item.comment || "").slice(0, 1000));
      });
      row.push(String(data.comments || "").slice(0, 3000));
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return response_(true, "");
  } catch (err) {
    return response_(false, err && err.message ? err.message : "Unable to save submission.");
  }
}

function response_(ok, error) {
  const result = JSON.stringify({ type: "dspot-sheet-submit", ok: Boolean(ok), error: String(error || "") });
  const html = '<!doctype html><html><body><script>window.top.postMessage(' + result + ', "*");</script>Submission ' + (ok ? "received" : "failed") + '.</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle("D-Spot submission")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
