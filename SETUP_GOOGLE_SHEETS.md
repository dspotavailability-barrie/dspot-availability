# Connect D-Spot Availability to Google Sheets

This connects the existing public availability form to a spreadsheet that only the scheduler can open. Staff do not need employee codes or Google accounts. The sheet itself must remain private.

## 1. Create the Google Apps Script

1. Sign in to the Google account that should own the private schedule.
2. Open https://script.google.com/
3. Click **New project** and name it **D-Spot Availability Intake**.
4. Replace the contents of `Code.gs` with the code in this repository's `AppsScript/Code.gs`.
5. Click **Save**.

## 2. Create the private spreadsheet

1. In Apps Script, choose the function **setup** in the function dropdown.
2. Click **Run** and approve the requested Google Sheets permissions.
3. In **Execution log**, open the URL labelled **Private scheduler spreadsheet**.
4. Keep this spreadsheet private. Do not share it with staff; only share it with trusted schedulers if needed.

The script creates a spreadsheet named **D-Spot Staff Availability** with one row per submission, including weekly hours and day-specific comments.

## 3. Deploy the submission endpoint

1. In Apps Script, click **Deploy → New deployment**.
2. Select the gear icon / deployment type and choose **Web app**.
3. Set **Execute as** to **Me** (the spreadsheet owner).
4. Set **Who has access** to **Anyone** so staff can submit without signing in. This makes the endpoint public; the spreadsheet remains private. Do not put private information or secrets in the form.
5. Click **Deploy** and authorize if asked.
6. Copy the Web app URL. It should begin with `https://script.google.com/macros/s/` and end with `/exec`.

If your Google Workspace administrator does not allow public web apps, ask the administrator about an approved deployment option.

## 4. Connect the website

1. Open this repository's `index.html` on GitHub.
2. Click the pencil (**Edit**) button.
3. Find this line near the top of the JavaScript:
   `const SHEETS_WEB_APP_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";`
4. Replace only the placeholder text with your deployed Web app URL, keeping the quotation marks.
5. Commit the change to `main`.
6. Wait for GitHub Pages to publish, then open the form and hard-refresh with **Ctrl + F5**.

## 5. Test it

1. Submit a test availability using your own name and one or two selected hours.
2. Confirm that a new row appears in the private Google Sheet with the day comments.
3. Test the WhatsApp button separately; it still prepares a message for the existing prefilled recipient.

## Privacy and limitations

- The Google Sheet is private to its owner and anyone explicitly shared with.
- The form does not ask for an employee code.
- The public intake URL can be used by anyone who has the form link. The script validates inputs and includes a hidden honeypot, but this is basic spam protection, not identity verification.
- There are no WhatsApp alerts in this version; the dashboard is the Google Sheet.
- A successful form submission adds a new row. It does not overwrite earlier submissions from the same employee.
