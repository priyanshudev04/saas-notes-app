SaaS Notes Application
This is a multi-tenant SaaS application built with Next.js, TypeScript, and Prisma. It allows multiple tenants to securely manage their notes, with features like JWT authentication, role-based access, and subscription gating.

Getting Started
First, ensure you have the necessary prerequisites installed:

Node.js (v18 or later)

Git for version control

A code editor like VS Code

To run the development server locally, clone the repository and install the dependencies:

Bash

git clone <your-repository-url>
cd saas-notes-app
npm install
npm run dev
Open your browser and navigate to http://localhost:3000 to see the application.

Assignment Requirements
This project was developed to meet the following key requirements:

1. Multi-Tenancy
We chose the shared schema with a tenant ID column approach. All tenant data is stored within a single PostgreSQL database, with each Note and User record linked to a specific Tenant via a tenantId. This model ensures strict data isolation by scoping all queries to the authenticated user's tenant ID, preventing cross-tenant data access.

2. Authentication and Authorization
JWT-based Login: The application uses JSON Web Tokens (JWTs) for user authentication. A token is issued upon successful login and is used to authorize all API requests.

Role-Based Access: The system supports two roles:

Admin: Can manage subscriptions (upgrade to Pro plan).

Member: Can create, view, edit, and delete notes.

Test Accounts: The following predefined accounts are available for testing:

admin@acme.test (password: password)

user@acme.test (password: password)

admin@globex.test (password: password)

user@globex.test (password: password)

3. Subscription Feature Gating
Free Plan: Tenants on the Free plan are limited to a maximum of 3 notes.

Pro Plan: The Pro plan provides unlimited notes.

Upgrade Endpoint: An Admin-only endpoint at POST /api/tenants/:slug/upgrade is available to immediately lift the note limit.

4. Notes API (CRUD)
The application provides a RESTful API for managing notes, all with tenant isolation enforced by middleware:

POST /api/notes: Create a new note.

GET /api/notes: List all notes for the authenticated tenant.

GET /api/notes/:id: Retrieve a specific note.

PUT /api/notes/:id: Update an existing note.

DELETE /api/notes/:id: Delete a note.

5. Deployment
The application is deployed on Vercel.

CORS is configured in next.config.js to allow access from automated test scripts.

A health check endpoint is available at GET /api/health which returns { "status": "ok" }.

Project Structure
src/pages/index.tsx: The login page.

src/pages/signup.tsx: The user registration page.

src/pages/dashboard.tsx: The main user dashboard for note management.

src/pages/api/auth/login.ts: Handles user authentication.

src/pages/api/auth/signup.ts: Creates a new tenant and admin user.

src/pages/api/notes/index.ts: Handles listing and creating notes.

src/pages/api/notes/[id].ts: Handles updating and deleting notes.

src/pages/api/tenants/[slug]/upgrade.ts: Handles plan upgrades.

src/middleware.ts: Verifies JWT tokens and attaches user payload to requests.

prisma/schema.prisma: Defines the database schema.







