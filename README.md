# MDOC HRMS (Human Resource Management System)

A comprehensive HR management system built with React, Vite, and Supabase.

## Features
- Employee Management (List, Grid, Details, Add/Edit)
- Attendance & Activity Tracking
- Salary Management & Slips
- Announcements & Messages
- Document Management
- System Analytics & Reports
- Support System (Complaints)

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Analytics**: Google Analytics

## Project Structure
- `src/components`: Reusable UI components.
- `src/context`: React Context for state management.
- `src/layouts`: Page layouts (Admin, User).
- `src/pages`: Application pages categorized by role.
- `src/lib`: Utility libraries (Supabase client).
- `supabase/migrations`: Database schema and migration scripts.

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials.
4. **Run development server**: `npm run dev`

## Deployment
Managed via Vercel. See `vercel.json` for configuration.
