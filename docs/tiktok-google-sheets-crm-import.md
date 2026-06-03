# TikTok Lead Form to Grand Touch CRM

Use this when TikTok Instant Forms are connected to Google Sheets and direct TikTok API access is unavailable.

Flow:

```text
TikTok Instant Form -> Google Sheet -> Apps Script -> Supabase Edge Function -> Grand Touch CRM
```

## Supabase Function

Endpoint:

```text
https://lkikhrrzhddrdjfbbwjk.functions.supabase.co/tiktok-sheet-lead-intake
```

The function expects a shared secret in the `x-tiktok-sheet-secret` header. Store the matching value in Apps Script Properties as `TIKTOK_SHEET_SECRET`.

## Apps Script

Paste this into Extensions -> Apps Script on the Google Sheet that TikTok writes leads into.

```javascript
const CRM_ENDPOINT = 'https://lkikhrrzhddrdjfbbwjk.functions.supabase.co/tiktok-sheet-lead-intake';
const STATUS_COLUMN = 'CRM Import Status';
const LEAD_ID_COLUMN = 'CRM Lead ID';
const IMPORTED_AT_COLUMN = 'CRM Imported At';
const ERROR_COLUMN = 'CRM Import Error';

function importTikTokLeadsToCrm() {
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('TIKTOK_SHEET_SECRET');
  if (!secret) throw new Error('Missing script property: TIKTOK_SHEET_SECRET');

  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return;

  let headers = values[0].map((value) => String(value || '').trim());
  const requiredColumns = [STATUS_COLUMN, LEAD_ID_COLUMN, IMPORTED_AT_COLUMN, ERROR_COLUMN];

  for (const column of requiredColumns) {
    if (!headers.includes(column)) {
      sheet.getRange(1, headers.length + 1).setValue(column);
      headers.push(column);
    }
  }

  const statusIndex = headers.indexOf(STATUS_COLUMN);
  const leadIdIndex = headers.indexOf(LEAD_ID_COLUMN);
  const importedAtIndex = headers.indexOf(IMPORTED_AT_COLUMN);
  const errorIndex = headers.indexOf(ERROR_COLUMN);

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const rowValues = values[rowIndex];
    const existingStatus = String(rowValues[statusIndex] || '').toLowerCase();
    if (existingStatus === 'imported') continue;

    const row = {};
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];
      if (!header || requiredColumns.includes(header)) continue;
      row[header] = rowValues[colIndex];
    }

    const hasLeadData = Object.values(row).some((value) => String(value || '').trim());
    if (!hasLeadData) continue;

    try {
      const response = UrlFetchApp.fetch(CRM_ENDPOINT, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'x-tiktok-sheet-secret': secret,
        },
        payload: JSON.stringify({
          row,
          row_number: rowIndex + 1,
          sheet_name: sheet.getName(),
          spreadsheet_id: SpreadsheetApp.getActiveSpreadsheet().getId(),
          imported_at: new Date().toISOString(),
        }),
        muteHttpExceptions: true,
      });

      const statusCode = response.getResponseCode();
      const body = JSON.parse(response.getContentText() || '{}');

      if (statusCode < 200 || statusCode >= 300 || !body.ok) {
        throw new Error(body.error || response.getContentText());
      }

      sheet.getRange(rowIndex + 1, statusIndex + 1).setValue('Imported');
      sheet.getRange(rowIndex + 1, leadIdIndex + 1).setValue(body.leadId || '');
      sheet.getRange(rowIndex + 1, importedAtIndex + 1).setValue(new Date());
      sheet.getRange(rowIndex + 1, errorIndex + 1).setValue('');
    } catch (error) {
      sheet.getRange(rowIndex + 1, statusIndex + 1).setValue('Failed');
      sheet.getRange(rowIndex + 1, errorIndex + 1).setValue(error.message || String(error));
    }
  }
}

function createTikTokCrmImportTrigger() {
  ScriptApp.newTrigger('importTikTokLeadsToCrm')
    .timeBased()
    .everyMinutes(1)
    .create();
}
```

## Setup Steps

1. Connect TikTok Instant Form to Google Sheets.
2. Open the Google Sheet.
3. Go to Extensions -> Apps Script.
4. Paste the script above.
5. In Apps Script, go to Project Settings -> Script Properties.
6. Add `TIKTOK_SHEET_SECRET` with the Supabase secret value.
7. Run `importTikTokLeadsToCrm` once and approve permissions.
8. Run `createTikTokCrmImportTrigger` once.
9. New rows should import automatically every minute.

The CRM lead will be saved as:

```text
source_platform: tiktok
lead_source_type: tiktok_lead_form
landing_page_variant: tiktok_instant_lead_form
funnel_name: tiktok_instant_form_ppf
```
