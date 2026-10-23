# D-Spot weekly availability — Cloudflare setup

This project uses Cloudflare Pages Functions and D1. The submission endpoint is server-side and the D1 database enforces one submission per employee code per scheduled week.

## 1. Keep source private

Before connecting this repository to Cloudflare, change the GitHub repository visibility to **Private** in GitHub → Settings → General → Danger Zone → Change repository visibility. Confirm that the published Pages site is deployed separately and working before relying on it; changing visibility can affect GitHub Pages.

## 2. Create a Cloudflare Pages project

1. Sign in at https://dash.cloudflare.com/
2. Open **Workers & Pages** and create a Pages project connected to this private GitHub repository.
3. Set the production branch to `main`. This is a plain static HTML project; no framework build command is required and the output directory is the repository root.
4. Deploy the project.

## 3. Create the D1 database

1. In Cloudflare, open **Workers & Pages → D1 SQL Database** (the exact menu label may vary).
2. Create a database named `dspot-availability`.
3. Open its SQL console and execute the complete contents of `schema.sql`.
4. In the Pages project, open **Settings → Functions → D1 database bindings** and add a binding named exactly `DB`, selecting the `dspot-availability` database.
5. Redeploy the Pages project after adding the binding.

## 4. Add employee codes

Create a unique code for every employee and insert each code in the D1 SQL console. Example only — replace the sample code and name with real values:

```sql
INSERT INTO employee_codes (code, employee_name, active)
VALUES ('DSPOT-A7K4Q9', 'Example Employee', 1);
```

Give each employee their code privately. Do not place real employee codes in public source files or in the page's JavaScript. The employee must enter the same full name assigned to that code.

To disable a lost or departed employee's code:

```sql
UPDATE employee_codes SET active = 0 WHERE code = 'DSPOT-A7K4Q9';
```

## 5. Review submissions

In the D1 SQL console:

```sql
SELECT employee_name, week_start, submitted_at, availability_text
FROM submissions
ORDER BY week_start DESC, employee_name;
```

A unique database constraint on `(employee_code, week_start)` prevents duplicate submissions even if two requests arrive at nearly the same time. The API computes the applicable week using Toronto time.

## Important

- The backend files must be deployed as a Cloudflare Pages project with Functions enabled; GitHub Pages alone cannot run this endpoint.
- The current website will not use the new submit endpoint until the updated `index.html` is deployed on Cloudflare Pages.
- Employee codes are bearer credentials: share them privately and disable them if exposed.
- This setup provides a one-submit limit per scheduled week, not a full employee login system.
