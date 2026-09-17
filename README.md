# InsuredMine Node.js Technical Assessment

## Stack

- Node.js
- Express.js
- JavaScript
- MongoDB / Mongoose
- Worker Threads
- Multer
- CSV Parser
- XLSX
- Jest / Supertest
- PM2

## Assessment coverage

### Task 1

1. Upload CSV/XLSX/XLS into MongoDB.
2. File parsing/import is executed in a Node.js Worker Thread.
3. Separate MongoDB collections:
   - Agent
   - User
   - UserAccount
   - LOB
   - Carrier
   - Policy
4. Search policy information by username.
5. Aggregate policy information for every user using MongoDB aggregation.

### Task 2

1. Monitor Node.js server CPU utilization.
2. When CPU reaches the configured 70% threshold, gracefully stop the server process.
3. PM2 is configured to automatically restart the process.
4. Schedule a message using message/day/time in a POST request.
5. Scheduled messages are persisted in MongoDB and processed by a background scheduler.

## CSV mapping

The supplied assessment data contains fields such as:

- agent -> Agent.name
- firstname -> User.firstName
- dob -> User.dob
- address -> User.address
- phone -> User.phone
- state -> User.state
- zip -> User.zipCode
- email -> User.email
- gender -> User.gender
- userType -> User.userType
- account_name -> UserAccount.accountName
- category_name -> LOB.categoryName
- company_name -> Carrier.companyName
- policy_number -> Policy.policyNumber
- policy_start_date -> Policy.policyStartDate
- policy_end_date -> Policy.policyEndDate
- policy_mode -> Policy.policyMode
- policy_type -> Policy.policyType
- premium_amount -> Policy.premiumAmount

## Prerequisites

- Node.js 20+
- MongoDB 6+
- npm
- Optional: PM2 for automatic process restart

## Installation

```bash
npm install
```

Create a `.env` file in the project root:

Add these values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/insuredmine_assessment
PORT=3000
CPU_THRESHOLD=70
CPU_CHECK_INTERVAL_MS=5000
SCHEDULER_INTERVAL_MS=1000
MAX_IMPORT_BATCH_SIZE=500
```

## Run

Development:

```bash
npm run dev
```

During development, a CPU threshold shutdown signals Nodemon to restart the
server automatically. In production, run the app with PM2 so its configured
`autorestart` policy handles the same shutdown.

Production:

```bash
npm start
```

With PM2:

```bash
npm install -g pm2
npm run start:pm2
```

## APIs

### Health

```http
GET /health
```

### Upload

Use Postman:

```http
POST /api/upload
```

Body:

`form-data`

Key:

`file`

Value:

CSV/XLSX/XLS file.

Example response:

```json
{
  "success": true,
  "message": "File imported successfully",
  "data": {
    "totalRows": 1198,
    "users": 1198,
    "agents": 1198,
    "accounts": 1198,
    "lobs": 1198,
    "carriers": 1198,
    "policiesInserted": 1198,
    "policiesSkipped": 0
  }
}
```

The exact counts can vary if the same file is imported multiple times because policy numbers are unique.

### Search policies by username

```http
GET /api/policies/user/Lura%20Lucca
```

### Aggregate policies by user

```http
GET /api/policies/aggregate
```

The API uses MongoDB `$lookup`, `$group`, `$project`, and `$sort`.

### Schedule message

```http
POST /api/messages/schedule
Content-Type: application/json
```

Body:

```json
{
  "message": "Policy renewal reminder",
  "day": "2026-09-20",
  "time": "10:30"
}
```

The API stores the message in MongoDB. The scheduler checks pending messages every second and marks due messages as processed.

## CPU restart design

The application calculates CPU utilization periodically.

At 70% or higher, the behavior depends on the process manager:

```text
CPU >= 70%
      |
      v
Log warning
      |
      v
Graceful server shutdown
      |
      +--> Nodemon: SIGUSR2 and automatic restart
      |
      +--> PM2/Docker/Kubernetes: process.exit(1) and supervisor restart
```

The process should be managed by PM2, Docker, Kubernetes, ECS, or another process supervisor in a production environment.

## Design notes

### Why Worker Threads?

Parsing a large CSV/XLSX file and transforming many records can consume CPU and block the main event loop. Worker Threads move this work away from the main request-processing thread.

### Why separate collections?

The assessment explicitly asks for Agent, User, User Account, LOB, Carrier and Policy as separate MongoDB collections. Policy stores ObjectId references to related documents.

### Why MongoDB aggregation?

The aggregation endpoint demonstrates database-side grouping and joining rather than loading all policies into application memory.

### Idempotency

`policyNumber` is unique. Re-uploading the same file therefore skips duplicate policies instead of creating duplicate policy records.

## Suggested Postman requests

1. `GET http://localhost:3000/health`
2. `POST http://localhost:3000/api/upload`
3. `GET http://localhost:3000/api/policies/user/Lura%20Lucca`
4. `GET http://localhost:3000/api/policies/aggregate`
5. `POST http://localhost:3000/api/messages/schedule`

## GitHub

Before pushing:

```bash
git init
git add .
git commit -m "Complete InsuredMine Node.js assessment"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Do not commit `.env`, credentials, or MongoDB passwords.
