# LUM - Islamic Habit Builder App

## Comprehensive Analysis & Technical Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features List](#2-features-list)
3. [User App UI/UX](#3-user-app-uiux)
4. [Admin Dashboard](#4-admin-dashboard)
5. [Verification System](#5-verification-system)
6. [Technical API](#6-technical-api)
7. [Database Schema](#7-database-schema)
8. [Security](#8-security)
9. [Scalability](#9-scalability)

---

## 1. Project Overview

**Project Name:** LUM - Islamic Habit Builder  
**Platform:** React Native (Android)  
**Core Functionality:** A mobile app helping Muslims build good habits through daily prayers, tasks, and donations using a gamified LUM (points) and level system.

### Core Concept

- 📿 Track 5 daily prayers
- ✅ Complete daily habits (system & personal)
- 📝 Progress through sequential main tasks
- 💰 Donate and earn custom LUM rewards
- 🏆 Level up based on LUM accumulation
- 📱 QR Code verification system

---

## 2. Features List

### 2.1 Authentication & Account

| Feature            | Description                     |
| ------------------ | ------------------------------- |
| Email Registration | Sign up with email and password |
| Email Login        | Sign in with credentials        |
| Google Sign-In     | OAuth 2.0 with Google           |
| Phone Verification | OTP-based phone verification    |
| Forgot Password    | Reset via email link            |
| Profile Management | Name, avatar, settings          |

### 2.2 Daily Tasks

| Type             | Description                                           | LUM Reward  |
| ---------------- | ----------------------------------------------------- | ----------- |
| **Prayers**      | 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)     | 10 LUM each |
| **System Tasks** | Admin-defined habits (Read Quran, Give charity, etc.) | 10 LUM      |
| **User Tasks**   | Personal habits created by user                       | 0 LUM       |

> **Note:** User-created tasks are for personal tracking only - no LUM earned.

### 2.3 Main Tasks (Admin-Created)

| Feature         | Description                                      |
| --------------- | ------------------------------------------------ |
| Sequential Lock | Complete Task 1 → Unlock Task 2                  |
| Content         | Title, images, philosophy, purpose, instructions |
| Tags            | Physical, Emotional, Mental, Spiritual           |
| Verification    | Photo upload OR QR code scan                     |

### 2.4 Level System

| 5     | 1000+        | Guided       |

### 2.6 Social Media

| Feature | Description |
|---------|-------------|
| **Post Creation** | Users can share thoughts and progress |
| **Media Support** | Upload multiple images or videos per post |
| **Comments** | Engage with other users' posts |
| **Likes** | Show appreciation for posts |

> **Note:** Admin can change level names and quotas via Admin Panel.

### 2.5 Donations

- Users can donate any amount
- LUM earned = Donation Amount × Admin-set Multiplier
- Supports multiple payment methods

---

## 3. User App UI/UX

### 3.1 Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     BOTTOM TAB NAVIGATION                    │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   🏠 Home   │  📿 Prayers │  ✅ Tasks   │    👤 Profile    │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

### 3.2 Screen Details

#### Splash Screen

- App logo
- Loading indicator

#### Auth Screens

| Screen       | Fields                                           |
| ------------ | ------------------------------------------------ |
| Login        | Email, Password, Google Button, Forgot Password  |
| Register     | Email, Password, Confirm Password, Google Button |
| Phone Verify | Phone Number, OTP Input                          |

#### Home Screen

| Component   | Description                                   |
| ----------- | --------------------------------------------- |
| Header      | Greeting + Notification Bell                  |
| Level Card  | Level name, Progress bar to next, LUM balance |
| Streak Card | Current streak, Longest streak                |
| Quick Stats | Today's prayers, Tasks done                   |

#### Prayers Screen

| Component       | Description                      |
| --------------- | -------------------------------- |
| 5 Prayer Cards  | Fajr, Dhuhr, Asr, Maghrib, Isha  |
| Each Card       | Arabic name, English name, Time  |
| Tap to Complete | Click prayer when done → +10 LUM |
| Progress Ring   | Shows completed/total            |

#### Tasks Screen

**Tab 1: Daily Tasks**
| Component | Description |
|-----------|-------------|
| System Tasks | Pre-defined tasks (earn LUM) |
| My Tasks | Personal tasks (no LUM) |
| Add Button | Create personal daily task |

**Tab 2: Main Tasks**
| Component | Description |
|-----------|-------------|
| Locked Task | Grayed out, lock icon |
| Unlocked Task | Full color, tap to start |
| Task Card | Title, Tag (color), LUM reward |

**Task Detail Screen**
| Component | Description |
|-----------|-------------|
| Image Carousel | Task images |
| Title & Tag | Task name + color badge |
| LUM Reward | Points to earn |
| Content Sections | Philosophy, Purpose, Your Task, Actions, Why This Test |
| Start Button | "I am ready to begin" |

**Complete Task Screen**
| Option | Description |
|--------|-------------|
| Photo Upload | Take photo or select from gallery |
| QR Code | Show my QR / Scan helper's QR |

#### Profile Screen

| Component   | Description                        |
| ----------- | ---------------------------------- |
| Avatar      | User photo                         |
| Name        | Display name                       |
| Level Badge | Current level with title           |
| LUM Stats   | Total, Current, Towards Next       |
| Menu Items  | My QR Code, Settings, Help, Logout |

### 3.3 User Flows

#### Registration

```
Splash → Welcome → Login/Register → (Google/Email) → Profile Setup → Home
```

#### Daily Prayer

```
Prayers Tab → Tap Prayer → Mark Complete → +10 LUM → Updated
```

#### Main Task (Photo)

```
Tasks → Main Tasks → Tap Task → Read → Start → Do Task →
Upload Photo → Submit → Pending Review → Admin Approves → +LUM
```

#### Main Task (QR Code)

```
Tasks → Main Tasks → Tap Task → Read → Start → Do Task →
Show QR → Helper Scans → Instant Verified → +LUM
```

### 3.4 Tag Colors

| Tag       | Color     |
| --------- | --------- |
| Physical  | 🔴 Red    |
| Emotional | 🟠 Orange |
| Mental    | 🟢 Green  |
| Spiritual | 🔵 Blue   |

---

## 4. Admin Dashboard

### 4.1 Dashboard Home

| Feature         | Description                                           |
| --------------- | ----------------------------------------------------- |
| Stats Cards     | Total users, Active users, Total LUM, Total donations |
| Recent Activity | Latest completions, donations, signups                |
| Charts          | User growth, LUM earned, Donations                    |
| Quick Links     | Pending verifications, recent reports                 |

### 4.2 User Management

| Feature      | Description                      |
| ------------ | -------------------------------- |
| User List    | Search, filter, paginate users   |
| User Details | Profile, LUM, level, history     |
| Edit User    | Name, password, suspend          |
| Activity Log | Task history, prayers, donations |

### 4.3 Task Management

**Task List View**
| Feature | Description |
|---------|-------------|
| All Tasks | View, filter, search tasks |
| Create Task | Full form with all fields |
| Edit Task | Modify existing tasks |

**Create/Edit Task Form**
| Field | Description |
|-------|-------------|
| Title | Task name |
| Core Philosophy | Background/purpose |
| Purpose | Why this matters |
| Your Task | What user does |
| Required Actions | Step by step |
| Why This Test | Explanation |
| Reminder | Reminder text |
| "I am ready to begin" | Button text |
| Tag | Physical/Emotional/Mental/Spiritual |
| LUM Reward | Points earned |
| Order | Sequence number |
| Is Locked | Enable sequential unlock |
| Images | Multiple images with titles |

**Verification Rules (Per Task)**
| Setting | Options |
|---------|---------|
| Requires Verification | Yes/No |
| Allowed Types | QR Code, Photo |
| Max Attempts | 1-10 |
| Deadline (hours) | 24, 48, 72 |

### 4.4 Daily Tasks Management

| Feature       | Description                         |
| ------------- | ----------------------------------- |
| System Tasks  | Create/edit pre-defined daily tasks |
| LUM Reward    | Points per task                     |
| Toggle Active | Enable/disable task                 |

### 4.5 Level Management

| Feature      | Description               |
| ------------ | ------------------------- |
| Level List   | View all levels           |
| Edit Level   | Change name and LUM quota |
| Create Level | Add new level             |

### 4.6 Verification Queue

| Feature      | Description                       |
| ------------ | --------------------------------- |
| Pending Tab  | Photo submissions awaiting review |
| Details View | User, task, photo, date           |
| Actions      | Approve, Reject, Request Info     |
| History Tab  | Past decisions                    |

### 4.7 Donations

| Feature       | Description                          |
| ------------- | ------------------------------------ |
| Donation List | All transactions                     |
| LUM Settings  | Set multiplier                       |
| Filter        | By status (Pending/Completed/Failed) |

### 4.8 App Settings

| Setting             | Description           |
| ------------------- | --------------------- |
| Donation Multiplier | LUM per currency unit |
| Min Donation        | Minimum for LUM       |
| Prayer Reward       | Points per prayer     |
| Daily Task Reward   | Points per task       |
| Registration Open   | Enable/disable signup |

### 4.9 Admin Users

| Feature      | Description       |
| ------------ | ----------------- |
| Admin List   | View all admins   |
| Create Admin | Add new admin     |
| Permissions  | Role-based access |

---

## 5. Verification System

### 5.1 Verification Types

| Type        | Process                                               |
| ----------- | ----------------------------------------------------- |
| **QR Code** | Instant auto-verification when helper scans user's QR |
| **Photo**   | Requires admin manual review                          |

### 5.2 Verification Flow

```
Task Completion
      │
      ▼
┌─────────────────┐
│  Capture Proof  │
├─────────────────┤
│ Option A: Photo │
│ Option B: QR    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   QR Verified   │     │  Photo Review   │
│   (Instant)     │     │    (Admin)      │
├─────────────────┤     ├─────────────────┤
│  LUM Awarded    │     │ Pending → Approve│
│  Immediately    │     │      or Reject  │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                          ┌─────────────────┐
                          │  LUM Awarded    │
                          │  (if approved)  │
                          └─────────────────┘
```

### 5.3 Verification Status

| Status   | Description           |
| -------- | --------------------- |
| PENDING  | Awaiting verification |
| APPROVED | Verified successfully |
| REJECTED | Verification failed   |

---

## 6. Technical API

> **Note:** APIs are separated into User App (mobile) and Admin Panel (web).

### 6.1 User App API - Authentication

#### Email/Password

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | /auth/register        | Register with email    |
| POST   | /auth/login           | Login with credentials |
| POST   | /auth/google          | Google OAuth           |
| POST   | /auth/forgot-password | Request reset          |
| POST   | /auth/reset-password  | Reset password         |
| POST   | /auth/phone/send      | Send OTP               |
| POST   | /auth/phone/verify    | Verify OTP             |

### 6.2 User Endpoints

| Method | Endpoint      | Description     |
| ------ | ------------- | --------------- |
| GET    | /users/me     | Get profile     |
| PUT    | /users/me     | Update profile  |
| GET    | /users/me/lum | Get LUM balance |
| GET    | /users/qr     | Get QR code     |

### 6.3 Prayer/Daily Task Endpoints

| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| GET    | /prayers                  | List prayers        |
| POST   | /prayers/:id/complete     | Complete prayer     |
| GET    | /daily-tasks              | List daily tasks    |
| POST   | /daily-tasks/:id/complete | Complete daily task |

### 6.4 Main Task Endpoints

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| GET    | /tasks              | List tasks          |
| GET    | /tasks/:id          | Task details        |
| POST   | /tasks/:id/start    | Start task          |
| POST   | /tasks/:id/complete | Complete with proof |

### 6.5 Social Media Endpoints

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | /posts                 | List all posts (feed)    |
| POST   | /posts                 | Create new post          |
| GET    | /posts/:id             | Get post details         |
| DELETE | /posts/:id             | Delete my post           |
| POST   | /posts/:id/like        | Like/Unlike a post       |
| GET    | /posts/:id/comments    | List comments on a post  |
| POST   | /posts/:id/comments    | Add comment to a post    |
| DELETE | /comments/:id          | Delete my comment        |

---

### 6.6 Admin API (Web Panel)

#### Dashboard

| Method | Endpoint                  | Description                       |
| ------ | ------------------------- | --------------------------------- |
| GET    | /admin/dashboard/stats    | Get total users, LUM, donations   |
| GET    | /admin/dashboard/activity | Recent activity feed              |
| GET    | /admin/dashboard/charts   | User growth, LUM, donation charts |

#### User Management

| Method | Endpoint                  | Description                     |
| ------ | ------------------------- | ------------------------------- |
| GET    | /admin/users              | List all users (search, filter) |
| GET    | /admin/users/:id          | Get user details                |
| PUT    | /admin/users/:id          | Edit user                       |
| DELETE | /admin/users/:id          | Suspend/delete user             |
| GET    | /admin/users/:id/activity | User activity history           |

#### Task Management

| Method | Endpoint                            | Description               |
| ------ | ----------------------------------- | ------------------------- |
| GET    | /admin/tasks                        | List all tasks            |
| POST   | /admin/tasks                        | Create new task           |
| GET    | /admin/tasks/:id                    | Get task details          |
| PUT    | /admin/tasks/:id                    | Update task               |
| DELETE | /admin/tasks/:id                    | Delete task               |
| PUT    | /admin/tasks/:id/verification-rules | Update verification rules |

#### Daily Tasks Management

| Method | Endpoint               | Description       |
| ------ | ---------------------- | ----------------- |
| GET    | /admin/daily-tasks     | List daily tasks  |
| POST   | /admin/daily-tasks     | Create daily task |
| PUT    | /admin/daily-tasks/:id | Update daily task |
| DELETE | /admin/daily-tasks/:id | Delete daily task |

#### Level Management

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| GET    | /admin/levels     | List all levels |
| POST   | /admin/levels     | Create level    |
| PUT    | /admin/levels/:id | Update level    |
| DELETE | /admin/levels/:id | Delete level    |

#### Verification Queue

| Method | Endpoint                              | Description              |
| ------ | ------------------------------------- | ------------------------ |
| GET    | /admin/verifications/pending          | Pending verifications    |
| GET    | /admin/verifications/history          | Past verifications       |
| GET    | /admin/verifications/:id              | Get verification details |
| POST   | /admin/verifications/:id/approve      | Approve verification     |
| POST   | /admin/verifications/:id/reject       | Reject verification      |
| POST   | /admin/verifications/:id/request-info | Request more info        |

#### Donations

| Method | Endpoint                    | Description           |
| ------ | --------------------------- | --------------------- |
| GET    | /admin/donations            | List donations        |
| GET    | /admin/donations/:id        | Donation details      |
| PUT    | /admin/donations/:id/status | Update status         |
| GET    | /admin/donations/settings   | Get LUM multiplier    |
| PUT    | /admin/donations/settings   | Update LUM multiplier |

#### App Settings

| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| GET    | /admin/settings | Get app settings    |
| PUT    | /admin/settings | Update app settings |

#### Social Media Management

| Method | Endpoint              | Description             |
| ------ | --------------------- | ----------------------- |
| GET    | /admin/posts          | List all posts          |
| DELETE | /admin/posts/:id      | Delete any post         |
| GET    | /admin/posts/:id/comments | List post comments  |
| DELETE | /admin/comments/:id   | Delete any comment      |

#### Admin Users

| Method | Endpoint          | Description  |
| ------ | ----------------- | ------------ |
| GET    | /admin/admins     | List admins  |
| POST   | /admin/admins     | Create admin |
| PUT    | /admin/admins/:id | Update admin |
| DELETE | /admin/admins/:id | Delete admin |

---

## 7. Database Schema

### Key Models

| Model            | Purpose                |
| ---------------- | ---------------------- |
| User             | Authentication         |
| UserProfile      | LUM, level, streaks    |
| Level            | Level quotas           |
| Prayer           | 5 daily prayers        |
| DailyTask        | System & user tasks    |
| Task             | Main tasks             |
| TaskImage        | Task images            |
| TaskCompletion   | Completions with proof |
| TaskVerification | Admin review records   |
| Donation         | Donations              |
| Post             | Social media posts     |
| PostMedia        | Media attached to posts|
| Comment          | Post comments          |
| Like             | Post likes             |

### Key Enums

```prisma
enum UserRole { USER, ADMIN }
enum TaskTag { PHYSICAL, EMOTIONAL, MENTAL, SPIRITUAL }
enum VerificationType { PHOTO, QR_CODE }
enum VerificationStatus { PENDING, APPROVED, REJECTED }
enum PrayerName { FAJR, DHUHR, ASR, MAGHRIB, ISHA }
enum DonationStatus { PENDING, COMPLETED, FAILED }
enum MediaType { IMAGE, VIDEO }
```

### 7.4 Entity Relationships

```
User (1) ────────── (1) UserProfile
  │                         │
  │                         └─ Level (many to one)
  │
  ├─ (N) DailyTaskCompletion
  ├─ (N) PrayerCompletion
  ├─ (N) TaskCompletion
  ├─ (N) Donation
  ├─ (N) Post
  ├─ (N) Comment
  ├─ (N) Like
  └─ (N) TaskCompletion (as helper)

Post (1) ────────── (N) PostMedia
  │
  ├─ (N) Comment
  └─ (N) Like

Task (1) ────────── (N) TaskImage
  │
  └─ (N) TaskCompletion
       │
       └─ (N) TaskVerification
```

### 7.5 Key Fields Per Model

### 7.5 Key Fields Per Model

#### User | Field | Type | Description |

|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email |
| qrCode | String? | Unique QR for helping others |
| role | UserRole | USER or ADMIN |

#### UserProfile | Field | Type | Description |

|-------|------|-------------|
| totalLum | Int | Lifetime LUM |
| currentLum | Int | Available LUM |
| levelId | Int | Current level |
| lumTowardsNext | Int | Progress to next |

#### Task | Field | Type | Description |

|-------|------|-------------|
| requiresVerification | Boolean | Needs proof? |
| allowedVerificationTypes | Array | PHOTO, QR_CODE |
| maxAttempts | Int | Retry limit |
| isLocked | Boolean | Sequential lock |

#### TaskCompletion | Field | Type | Description |

|-------|------|-------------|
| proofType | VerificationType | Photo or QR |
| isQrVerified | Boolean | Instant verification |
| verificationStatus | Status | PENDING/APPROVED/REJECTED |
| lumPending | Boolean | Held until verified |

### 7.6 Query Examples for Developers

```typescript
// Get user with profile
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { profile: { include: { level: true } } },
});

// Get task with images
const task = await prisma.task.findUnique({
  where: { id: taskId },
  include: { images: { orderBy: { order: "asc" } } },
});

// Complete task with QR (instant)
const completion = await prisma.taskCompletion.create({
  data: {
    userId,
    taskId,
    proofType: "QR_CODE",
    helperUserId: helperUserId,
    isQrVerified: true,
    verificationStatus: "APPROVED",
    lumAwarded: task.lumReward,
    lumPending: false,
  },
});

// Admin: pending verifications
const pending = await prisma.taskCompletion.findMany({
  where: { proofType: "PHOTO", verificationStatus: "PENDING" },
  include: { user: true, task: true },
});
```

---

## 8. Security

### Authentication

- Password hashing with bcrypt
- JWT access tokens (15 min)
- Refresh tokens (stored in DB)
- Google OAuth validation

### Data Protection

- Sensitive data encrypted at rest
- QR codes time-limited
- Access controls on images

### API Security

- Input validation (Zod)
- SQL injection prevention (Prisma)
- Rate limiting
- CORS configuration

---

## 9. Scalability

### Database

- Indexes on frequently queried fields
- Pagination on list endpoints
- Optional Redis caching

### Performance

- QR verification: instant
- Photo upload: async
- Bulk admin actions

### Future Growth

- Microservices architecture
- Queue system for processing
- CDN for static assets
- Read replicas for scaling

---

_Document Version: 3.0_
_Last Updated: 2026-03-12_
