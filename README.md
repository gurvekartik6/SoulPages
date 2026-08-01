# SoulPages

## Where Every Page Speaks to Your Soul

SoulPages is a full-stack book tracking application designed for passionate readers to record their reading journey, track progress, set reading goals, save quotes and notes, and understand their reading habits through detailed statistics.

## Live Demo

[https://soulpages.up.railway.app](https://soulpages.up.railway.app)

## Features

### Book Management

- Add books to your personal library
- Edit and delete existing books
- Store book title, author, total pages, genre, and current page
- Organize books by reading status
- Mark books as completed
- Save book completion dates
- Rate books from 1 to 5
- Add personal notes and reflections

### Reading Progress

- Track the current page for every book
- Compare current progress with total pages
- View visual progress indicators
- Record reading sessions with timestamps
- Monitor reading streaks
- Track completed and currently reading books

### Reading Statistics

- View interactive reading charts
- Track books completed per month and year
- View total pages read
- Analyze reading pace
- Analyze reading time
- Explore genre distribution
- Understand personal reading habits

### Library Organization

- Categorize books by genre
- Search books by title or author
- Filter books by reading status
- Sort books by title, author, or progress
- Use custom tags for better organization

### Quotes and Notes

- Save meaningful quotes from books
- Add page numbers to saved quotes
- Write personal notes and reflections
- Store timestamped entries
- Search through notes and quotes

### Authentication

- Secure user registration and login
- JWT-based authentication
- Refresh token rotation
- Protected API endpoints
- User profile management
- Password change functionality
- Secure logout

### CSV Import

- Bulk import books using CSV files
- Compatible with Goodreads exports
- Supports multiple column-name formats
- Includes input validation
- Provides clear error handling

### User Experience

- Clean and intuitive interface
- Mobile-responsive design
- Dark and light mode support
- Fast navigation using Vite
- Toast notifications for user actions

## Technology Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Axios
- Recharts

### Backend

- Node.js
- Express.js
- ES Modules
- REST API

### Database

- PostgreSQL
- UUID-based primary keys
- Parameterized queries using the `pg` pool

### Authentication and Security

- JSON Web Tokens
- Refresh token rotation
- Bcrypt password hashing
- Helmet.js
- CORS
- Express Rate Limit
- Express Validator

### Deployment

- Railway
- Docker
- Railway PostgreSQL
- Automatic deployment from GitHub

## Application Architecture

```text
User
  |
  v
React and Vite Frontend
  |
  | REST API Requests using Axios
  v
Node.js and Express Backend
  |
  | PostgreSQL Queries
  v
PostgreSQL Database
```

The frontend communicates with the backend through REST API endpoints. The backend handles authentication, validation, application logic, and database operations. PostgreSQL stores user accounts, books, quotes, notes, and reading information.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update user profile |
| PUT | `/api/auth/password` | Change password |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |

### Books

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/books` | Get all books |
| POST | `/api/books` | Add a new book |
| GET | `/api/books/:id` | Get a specific book |
| PUT | `/api/books/:id` | Update a book |
| DELETE | `/api/books/:id` | Delete a book |
| POST | `/api/books/import` | Import books from a CSV file |
| GET | `/api/books/stats` | Get book statistics |

### Quotes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/quotes` | Get all quotes |
| POST | `/api/quotes` | Add a new quote |
| DELETE | `/api/quotes/:id` | Delete a quote |

### Statistics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stats` | Get reading statistics |

## Security Features

### JWT Authentication

SoulPages uses short-lived access tokens and refresh token rotation to manage secure user sessions.

### Password Hashing

Passwords are hashed using Bcrypt before being stored in the database.

### Security Headers

Helmet.js is used to configure secure HTTP headers.

### Rate Limiting

Authentication endpoints are rate-limited to reduce brute-force login attempts.

```text
Maximum authentication requests: 20 requests per 15 minutes
```

### CORS

Cross-origin resource sharing is configurable based on the deployment environment.

### Input Validation

Express Validator is used to validate and sanitize incoming data.

### SQL Injection Protection

Parameterized PostgreSQL queries are used to reduce SQL injection risks.

### Protected Routes

Private API endpoints require a valid access token.

## Database Schema

### Users Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `username` | String | Unique username |
| `email` | String | Unique email address |
| `password_hash` | String | Hashed password |
| `created_at` | Timestamp | Account creation time |
| `updated_at` | Timestamp | Last profile update time |

### Books Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key referencing users |
| `title` | String | Required book title |
| `author` | String | Required author name |
| `total_pages` | Integer | Total number of pages |
| `current_page` | Integer | Current reading page |
| `genre` | String | Book genre |
| `status` | Enum | `reading`, `completed`, or `to-read` |
| `rating` | Integer | Rating from 1 to 5 |
| `notes` | Text | Personal notes |
| `started_at` | Timestamp | Reading start date |
| `completed_at` | Timestamp | Reading completion date |
| `created_at` | Timestamp | Record creation time |

### Quotes Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key referencing users |
| `book_id` | UUID | Foreign key referencing books |
| `quote` | Text | Saved quote |
| `page` | Integer | Page number |
| `created_at` | Timestamp | Quote creation time |

## Deployment Status

| Service | Status |
|---|---|
| Frontend | Live |
| Backend API | Live |
| PostgreSQL Database | Connected |
| Authentication | Working |
| Automatic Deployment | Enabled |

## Deployment Process

The project is deployed on Railway with automatic deployments from GitHub.

```text
Push code to the main branch
        |
        v
Railway starts a new build
        |
        v
Docker builds the frontend and backend
        |
        v
Application is deployed
        |
        v
Railway PostgreSQL is connected
```

Environment variables are configured securely through the Railway dashboard.

## Local Development

### Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- PostgreSQL
- Git

### Clone the Repository

```bash
git clone https://github.com/gurvekartik6/SoulPages.git
cd SoulPages
```

### Install Dependencies

```bash
npm install
```

Install frontend dependencies if the frontend is stored in a separate directory:

```bash
cd client
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Do not upload the `.env` file to GitHub.

### Start the Development Server

Start the backend:

```bash
npm run dev
```

Start the frontend from the frontend directory:

```bash
npm run dev
```

## CSV Import Format

A CSV file can include columns such as:

```csv
title,author,total_pages,current_page,genre,status,rating,notes
Atomic Habits,James Clear,320,120,Self Help,reading,5,Useful ideas about habits
```

SoulPages supports multiple column-name variations and validates imported records before saving them.

## Project Structure

```text
SoulPages/
|
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- hooks/
|   |   |-- context/
|   |   `-- utils/
|   |
|   |-- public/
|   |-- package.json
|   `-- vite.config.js
|
|-- server/
|   |-- controllers/
|   |-- middleware/
|   |-- routes/
|   |-- services/
|   |-- validators/
|   |-- database/
|   `-- app.js
|
|-- Dockerfile
|-- package.json
|-- .gitignore
`-- README.md
```

The actual folder structure may vary depending on the repository implementation.

## Future Improvements

- Reading goals and goal reminders
- Advanced reading streak analytics
- Book cover integration
- Public reading profiles
- Book recommendations
- Social sharing
- Reading groups
- Export library data
- Improved offline support
- Additional statistics and reports

## License

This project is private and proprietary.

Unauthorized distribution, modification, reproduction, or use of this project is strictly prohibited.

## Author

Kartik Yadav Gurve

GitHub: [gurvekartik6](https://github.com/gurvekartik6)

## Acknowledgments

- Railway for deployment and managed PostgreSQL
- PostgreSQL for reliable database management
- Vite for fast frontend development
- Tailwind CSS for responsive interface design
- Recharts for reading statistics visualizations

---

SoulPages - Where Every Page Speaks to Your Soul
