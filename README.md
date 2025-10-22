📦 Dropbox Clone — Backend

A simple backend for a Dropbox-style file storage app with authentication, file upload, and S3 integration.

🚀 Quick Start
1. Prerequisites

Node.js ≥ 14 (tested on v21)

npm

MongoDB (local or cloud)

AWS S3 credentials (optional — only for S3 uploads)

2. Setup
# Clone and install dependencies
git clone <repo-url>
cd dropbox-clone-backend
npm install


Create a .env file in the project root:

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example/dbname
JWT_SECRET=your_jwt_secret_here
PORT=5000

# Optional — for AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket

3. Run the server
# Option A
node server.js

# Option B (with nodemon)
npx nodemon server.js

# OR (add to package.json)
npm start


Server runs at: http://localhost:5000

## 🧩 API Overview

| **Method** | **Endpoint**             | **Description**                          | **Auth** |
|-------------|--------------------------|------------------------------------------|----------|
| POST        | `/auth/register`         | Register new user                        | ❌       |
| POST        | `/auth/login`            | Login user → returns `{ token }`          | ❌       |
| POST        | `/upload`                | Upload a file (`form-data: file`)         | ✅       |
| GET         | `/files`                 | List user’s files                         | ✅       |
| GET         | `/files/:id`             | Get file metadata (owner enforced)        | ✅       |
| GET         | `/files/:id/download`    | Download file                             | ✅       |

⚡ Test via Postman

Register → POST /auth/register

{ "name": "John", "email": "john@example.com", "password": "123456" }


Login → POST /auth/login
Save token in environment:

const json = pm.response.json();
pm.environment.set("authToken", json.token);


Upload → POST /upload

Header: Authorization: Bearer {{authToken}}

Body: form-data → key=file

List files → GET /files
(same Authorization header)