# n8n Integration Guide for ADNEXUS

This guide explains how to set up automatic content uploads from Google Sheets using n8n.

## Overview

- **Source**: Google Sheets (ContentQueue)
- **Destination**: ADNEXUS Admin API
- **Frequency**: Once per day
- **Logic**: Upload one pending row per execution

---

## 1. Environment Setup

### Backend Environment Variables

Add to your Render environment:

```
ADMIN_API_TOKEN=your-secure-random-token-here
```

Generate a secure token:
```bash
openssl rand -hex 32
```

### n8n Environment Variables

In n8n, create a credential or use environment variables:

```
ADMIN_API_TOKEN=your-secure-random-token-here
ADNEXUS_API_URL=https://your-render-domain.onrender.com
```

---

## 2. Google Sheets Setup

### Sheet Structure

Create a sheet named `ContentQueue` with these columns:

| Column | Description | Example |
|--------|-------------|---------|
| A: `title` | Content title (required) | "Premium Video Pack" |
| B: `description` | Content description | "High quality video content" |
| C: `thumbnail_url` | Thumbnail image URL | "https://example.com/thumb.jpg" |
| D: `file_url` | Download file URL | "https://example.com/file.zip" |
| E: `ads_required` | Number of ads to unlock (default: 3) | 3 |
| F: `status` | Content status | "active" |
| G: `upload_status` | Automation status | "pending" |
| H: `retry_count` | Failed upload attempts | 0 |
| I: `uploaded_at` | Upload timestamp | (auto-filled) |
| J: `error_message` | Last error (if failed) | (auto-filled) |

### Initial Values

- Set `upload_status` to "pending" for new content
- Set `retry_count` to 0
- Leave `uploaded_at` and `error_message` empty

---

## 3. API Endpoints

### Base URL
```
https://your-render-domain.onrender.com/api/v1/content
```

### Authentication
All requests require Bearer token:
```
Authorization: Bearer YOUR_ADMIN_API_TOKEN
```

### Endpoints

#### Create Content (POST)
```bash
curl -X POST https://your-domain.onrender.com/api/v1/content \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Content",
    "description": "Description here",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "file_url": "https://example.com/file.zip",
    "ads_required": 3,
    "status": "active"
  }'
```

#### Response (Success - 201)
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "My Content",
    ...
  },
  "message": "Content created successfully"
}
```

#### Response (Duplicate - 409)
```json
{
  "success": false,
  "error": "duplicate",
  "message": "Content with title \"My Content\" already exists"
}
```

#### Check Duplicate (POST)
```bash
curl -X POST https://your-domain.onrender.com/api/v1/content/check-duplicate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Content"}'
```

---

## 4. n8n Workflow

### Import the Workflow

1. In n8n, go to **Workflows** → **Import**
2. Paste the JSON from `n8n-workflow.json`
3. Configure credentials:
   - Google Sheets API
   - HTTP Header Auth (with ADMIN_API_TOKEN)

### Workflow Steps

```
[Cron Trigger] → [Read Sheet] → [Filter Pending] → [Limit to 1] 
    → [Check Duplicate] → [Upload Content] → [Update Sheet Status]
```

### Node Configuration

#### 1. Cron Trigger
- Schedule: `0 9 * * *` (9 AM daily)

#### 2. Google Sheets - Read Rows
- Spreadsheet: Your ContentQueue sheet
- Sheet: ContentQueue
- Operation: Read All Rows

#### 3. Filter - Pending Only
- Condition: `upload_status` equals "pending"
- AND: `retry_count` less than 3

#### 4. Limit - One Per Day
- Max Items: 1

#### 5. HTTP Request - Check Duplicate
- Method: POST
- URL: `{{$env.ADNEXUS_API_URL}}/api/v1/content/check-duplicate`
- Headers: `Authorization: Bearer {{$env.ADMIN_API_TOKEN}}`
- Body: `{"title": "{{$json.title}}"}`

#### 6. IF - Not Duplicate
- Condition: `{{$json.exists}}` equals false

#### 7. HTTP Request - Upload Content
- Method: POST
- URL: `{{$env.ADNEXUS_API_URL}}/api/v1/content`
- Headers: `Authorization: Bearer {{$env.ADMIN_API_TOKEN}}`
- Body:
```json
{
  "title": "{{$json.title}}",
  "description": "{{$json.description}}",
  "thumbnail_url": "{{$json.thumbnail_url}}",
  "file_url": "{{$json.file_url}}",
  "ads_required": {{$json.ads_required}},
  "status": "{{$json.status}}"
}
```

#### 8. Google Sheets - Update Success
- Operation: Update Row
- Update Fields:
  - `upload_status`: "uploaded"
  - `uploaded_at`: `{{$now.toISO()}}`

#### 9. Error Handler - Update Failure
- On Error branch:
  - Increment `retry_count`
  - Set `error_message` to error details
  - If `retry_count` >= 3, set `upload_status` to "failed"

---

## 5. Error Handling

### Retry Logic

| retry_count | Action |
|-------------|--------|
| 0-2 | Retry next day |
| 3+ | Mark as "failed", skip permanently |

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid token | Check ADMIN_API_TOKEN |
| 409 Duplicate | Title already exists | Already uploaded |
| 400 Validation | Missing required fields | Check title field |
| 500 Server Error | Backend issue | Check server logs |

---

## 6. Testing

### Test API Connection
```bash
curl -X GET https://your-domain.onrender.com/api/v1/content \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Content Creation
```bash
curl -X POST https://your-domain.onrender.com/api/v1/content \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Content", "ads_required": 3, "status": "draft"}'
```

### Manual n8n Trigger
1. Open workflow in n8n
2. Click "Execute Workflow"
3. Check execution logs

---

## 7. Monitoring

### Check Upload Status in Sheet
- Filter by `upload_status` column
- "uploaded" = successful
- "failed" = permanently failed
- "pending" = waiting

### Check Content in Admin Panel
- Login to admin panel
- View content list
- Verify new content appears

---

## 8. Troubleshooting

### Content Not Appearing
1. Check n8n execution logs
2. Verify API token is correct
3. Check backend server logs

### Duplicate Errors
- Content with same title already exists
- Update `upload_status` to "uploaded" in sheet

### Connection Timeout
- Increase HTTP request timeout in n8n
- Check Render server status

---

## Files Created

| File | Purpose |
|------|---------|
| `server/middleware/adminApiAuth.ts` | Token-based authentication |
| `server/api/adminContent.ts` | API endpoints for n8n |
| `docs/n8n-integration.md` | This documentation |
| `docs/n8n-workflow.json` | Importable n8n workflow |

## Unchanged Files

- All frontend React components
- Ads unlock logic (`server/routes.ts` ad endpoints)
- Database schema (`shared/schema.ts`)
- Session-based admin authentication
- Existing admin panel routes

---

## Security Notes

1. **Token Security**: Keep ADMIN_API_TOKEN secret
2. **Rate Limiting**: API has no built-in rate limiting
3. **Duplicate Prevention**: Checked by title match
4. **Audit Trail**: All uploads logged to console
