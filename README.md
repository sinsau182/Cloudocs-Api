# Dropbox-clone-backend

Minimal instructions to run and test the backend locally.

## Prerequisites
- Node.js (v14+; Node 21 tested)
- npm
- MongoDB (cloud or local)
- AWS S3 credentials (if using S3 upload/download)
- Windows PowerShell (examples provided)

## Install
From project root:
```powershell
npm install
```

## Environment
Create a `.env` file in the project root with these variables:
```text
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example/dbname
JWT_SECRET=your_jwt_secret_here
PORT=5000

# AWS (only if using S3 upload/download)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket
```

## Start
Option A — run directly:
```powershell
node server.js
```
Option B — dev with nodemon (if installed):
```powershell
npx nodemon server.js
```
(Or add `"start": "node server.js"` to package.json and use `npm start`.)

Server default: http://localhost:5000

## Important endpoints
- POST /auth/register
  - Body JSON: { "name", "email", "password" }
- POST /auth/login
  - Body JSON: { "email", "password" } → returns { token }
- POST /upload (protected)
  - Header: Authorization: Bearer <token>
  - Form-data: key `file` (File)
- GET /files (protected) — list current user's files
- GET /files/:id (protected) — file metadata (owner enforced)
- GET /files/:id/download (protected) — download stream

## Quick Postman flow
1. Register user → POST /auth/register (Content-Type: application/json)
2. Login → POST /auth/login; add this in Tests tab to save token:
```javascript
const json = pm.response.json();
pm.environment.set('authToken', json.token);
```
3. Upload → POST /upload
   - Authorization: Bearer {{authToken}}
   - Body: form-data, key `file` (File)
4. List → GET /files (Authorization header as above)
5. Try another user token to confirm 403 on accessing files not owned.

## Common errors / fixes
- "Cannot use import statement outside a module" — ensure package.json contains `"type": "module"` or run server with `.mjs` files.
- "User validation failed: name: Path `name` is required." — client must send `name` in register.
- E11000 duplicate key (phone) — caused by a unique index with null values. Fix by creating a partial index that ignores nulls or require the field. Example in mongosh:
```javascript
db.users.dropIndex("phone_1");
db.users.createIndex({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $exists: true, $ne: null } } });
```

## Notes
- Ensure JWT is signed with user id: jwt.sign({ id: user._id }, process.env.JWT_SECRET)
- Auth middleware attaches `req.userId` — routes use this to enforce ownership.
- Inspect MongoDB to verify File documents have `owner` set to user ObjectId.

If you want, I can add a Postman collection export or add the start script to package.json.// filepath: c:\TypeFace\dropbox-clone-backend\README.md
# Dropbox-clone-backend

Minimal instructions to run and test the backend locally.

## Prerequisites
- Node.js (v14+; Node 21 tested)
- npm
- MongoDB (cloud or local)
- AWS S3 credentials (if using S3 upload/download)
- Windows PowerShell (examples provided)

## Install
From project root:
```powershell
npm install
```

## Environment
Create a `.env` file in the project root with these variables:
```text
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example/dbname
JWT_SECRET=your_jwt_secret_here
PORT=5000

# AWS (only if using S3 upload/download)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket
```

## Start
Option A — run directly:
```powershell
node server.js
```
Option B — dev with nodemon (if installed):
```powershell
npx nodemon server.js
```
(Or add `"start": "node server.js"` to package.json and use `npm start`.)

Server default: http://localhost:5000

## Important endpoints
- POST /auth/register
  - Body JSON: { "name", "email", "password" }
- POST /auth/login
  - Body JSON: { "email", "password" } → returns { token }
- POST /upload (protected)
  - Header: Authorization: Bearer <token>
  - Form-data: key `file` (File)
- GET /files (protected) — list current user's files
- GET /files/:id (protected) — file metadata (owner enforced)
- GET /files/:id/download (protected) — download stream

## Quick Postman flow
1. Register user → POST /auth/register (Content-Type: application/json)
2. Login → POST /auth/login; add this in Tests tab to save token:
```javascript
const json = pm.response.json();
pm.environment.set('authToken', json.token);
```
3. Upload → POST /upload
   - Authorization: Bearer {{authToken}}
   - Body: form-data, key `file` (File)
4. List → GET /files (Authorization header as above)
5. Try another user token to confirm 403 on accessing files not owned.

## Common errors / fixes
- "Cannot use import statement outside a module" — ensure package.json contains `"type": "module"` or run server with `.mjs` files.
- "User validation failed: name: Path `name` is required." — client must send `name` in register.
- E11000 duplicate key (phone) — caused by a unique index with null values. Fix by creating a partial index that ignores nulls or require the field. Example in mongosh:
```javascript
db.users.dropIndex("phone_1");
db.users.createIndex({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $exists: true, $ne: null } } });
```

## Notes
- Ensure JWT is signed with user id: jwt.sign({ id: user._id }, process.env.JWT_SECRET)
- Auth middleware attaches `req.userId` — routes use this to enforce ownership.
- Inspect MongoDB to verify File documents have `owner` set to user ObjectId.

If you want, I can add a Postman collection export or add the start script to