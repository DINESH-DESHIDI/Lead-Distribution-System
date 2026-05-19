<<<<<<< HEAD
# Prowider Mini Lead Distribution System (MongoDB Edition)

A production-quality, transaction-safe, full-stack lead generation and fair distribution system. Designed using **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB + Prisma ORM**.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 15 (App Router, React 19), Tailwind CSS, Lucide Icons, Custom Toast & Form Primitives.
- **Backend:** Next.js Route Handlers (REST APIs).
- **Database:** MongoDB (handles composite unique keys at the document level).
- **ORM:** Prisma ORM.
- **Real-Time updates:** Hybrid Server-Sent Events (SSE) stream (`/api/realtime`) with a client-side automatic 3-second backup polling fallback for absolute deployment resilience (Vercel-ready!).
- **Concurrency Safety:** Customized **Promise-based Node Mutex locks** combined with **Atomic filter updates** to coordinate thread-safety on standard standalone MongoDB instances with **0% database transaction replica-set requirements**!

---

## 🚀 Environment Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or 20.x+ recommended).
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (standard standalone `mongodb://localhost:27017` is fully supported), or a cloud instance (MongoDB Atlas).

### Step-by-Step Local Deployment

1. **Clone or Open the Project:**
   Ensure you are in the project folder:
   ```bash
   cd "d:\Prowider Mini Lead Distribution System"
   ```

2. **Configure Environment Variables:**
   Create a `.env` file from the example:
   ```powershell
   Copy-Item .env.example .env
   ```
   Open `.env` and configure your `DATABASE_URL` for MongoDB:
   ```env
   # Local Standalone MongoDB
   DATABASE_URL="mongodb://localhost:27017/prowider_db"
   ```

3. **Install Dependencies:**
   Run npm install in the project directory:
   ```bash
   npm install
   ```

4. **Initialize Database Schemas:**
   Push the schema directly to your MongoDB database (this automatically generates the custom indexes and Prisma client):
   ```bash
   npx prisma db push
   ```

5. **Seed the Database:**
   Populate initial Services, Providers, and AllocationState trackers:
   ```bash
   npx prisma db seed
   ```
   *This seeds:*
   - **Services:** Service 1, Service 2, Service 3.
   - **Providers:** Provider 1 to Provider 8 (each with a monthly quota of 10 and remaining quota of 10).
   - **AllocationState:** Trackers initialized at index `0` for all 3 services.

6. **Start the Application:**
   Boot up the Next.js development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 🏛️ Lead Allocation Algorithm

The system distributes leads to exactly **3 providers total** using a mixture of **Mandatory Assignment Rules** and a **Fair Round-Robin Allocation Pool**.

### 1. Allocation Logic Matrix

| Service | Mandatory Assignment | Round-Robin Pool Candidate Providers |
| :--- | :--- | :--- |
| **Service 1** | **Provider 1** | Provider 2, Provider 3, Provider 4 |
| **Service 2** | **Provider 5** | Provider 6, Provider 7, Provider 8 |
| **Service 3** | **Provider 1** and **Provider 4** | Provider 2, Provider 3, Provider 5, Provider 6, Provider 7, Provider 8 |

---

## 🔒 Concurrency & Safety (MongoDB Specifics)

Under simultaneous concurrent requests, standard document databases suffer from race conditions. We solve these problems completely on standard local MongoDB using two layers of protection:

### 1. Node-Level Promise Mutex (`acquireLock`)
Before any allocation logic evaluates, the thread enters an in-memory serializing promise wrapper per `serviceId`:
```typescript
export async function acquireLock<T>(key: string, fn: () => Promise<T>) { ... }
```
This guarantees that **only one lead allocation for a specific service executes at a single millisecond**, ensuring that round-robin pointers (`currentIndex`) increment in perfect, serial rotation and never overwrite each other.

### 2. Atomic Filter Decrements
To protect remaining quotas from dropping below `0` or double-allocating under extreme conditions, provider allocations run an **atomic filter check** during updates:
```typescript
const updated = await prisma.provider.update({
  where: { id: providerId, remainingQuota: { gt: 0 } },
  data: {
    remainingQuota: { decrement: 1 },
    totalAssigned: { increment: 1 },
  },
});
```
If two processes ever try to decrement a provider with a remaining quota of `1`, only the first update matches the filter and succeeds. The second throws a Prisma `P2025` error, which our engine catches to gracefully bypass the provider and advance to the next candidate.

---

## 📡 Webhook Idempotency Architecture

The quota-reset endpoint `POST /api/webhooks/reset-quota` is protected against double-delivery (e.g. payment gateway retries) using the `@unique` constraint on the `eventId` in the `WebhookEvent` table:

1. The webhook receiver tries to create a new `WebhookEvent` record:
   ```typescript
   await prisma.webhookEvent.create({ data: { eventId } })
   ```
2. If it **succeeds**, it proceeds to reset all provider remaining quotas back to 10.
3. If it **fails** (throws Prisma `P2002` duplicate key error), the server catches it, outputs `Webhook event was already processed. Skipped.`, and returns a safe HTTP 200 without executing another reset!
4. This ensures absolute safety with **zero replica-set transaction requirements**!

---

## 📡 API Documentation

### 1. Lead Submission
- **Endpoint:** `POST /api/leads`
- **Body:**
  ```json
  {
    "customerName": "Jane Doe",
    "phoneNumber": "9998887777",
    "city": "Dallas",
    "serviceId": "srv-1",
    "description": "General repairs enquiry"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Lead created and successfully allocated.",
    "leadId": "mongodb-objectid-here",
    "assignedProviders": ["prov-1", "prov-2", "prov-3"]
  }
  ```

- **Response (409 Duplicate Conflict):**
  *Triggered if same phone number submits again for the same service.*
  ```json
  {
    "error": "Duplicate submission. Same phone number cannot create another lead for the SAME service.",
    "code": "DUPLICATE_LEAD"
  }
  ```
=======
# Lead-Distribution-System
>>>>>>> e0254a9394eeb665e4a0cd5afbebe4d090734a90
