# Classroom Hub

Classroom Hub is a full-stack web application designed to streamline classroom management and communication. It provides a centralized platform for teachers and students to interact, share materials, and manage assignments.

## Features

### For Teachers
- **Dashboard:** Get a quick overview of all your classrooms, upcoming deadlines, and recent activity.
- **Classroom Management:**
    - Create new classrooms with unique join codes.
    - View and manage all created classrooms.
    - See a list of enrolled students for each class.
- **Announcements:**
    - Post announcements with attachments to specific classrooms.
    - Comment on announcements to provide clarifications.
- **Assignments:**
    - Create assignments with titles, descriptions, due dates, and attachments.
    - View student submissions and see who has submitted.
- **Doubt Solving:** Answer student questions in a dedicated, threaded doubt-solving forum.
- **Real-time Chat:** Engage in one-on-one or group chats with students.
- **Profile Management:** Update personal information and change passwords.

### For Students
- **Dashboard:** See a summary of your enrolled classes, pending assignments, and recent announcements.
- **Classroom Interaction:**
    - Join classrooms using a unique code provided by the teacher.
    - View all enrolled classrooms.
- **Stay Updated:**
    - Receive announcements from teachers.
    - View and comment on announcements.
- **Assignments:**
    - View all assigned tasks and their due dates.
    - Submit assignments with file attachments.
- **Doubt Solving:**
    - Post questions and doubts for teachers to address.
    - Participate in discussions to clarify concepts.
- **Real-time Chat:** Communicate with teachers and classmates.
- **Profile Management:** Update your profile and manage account settings.

### General Features
- **Role-Based Access Control:** Distinct interfaces and permissions for Teachers and Students.
- **Real-time Notifications:** Get instant notifications for new announcements, assignments, and messages.
- **Secure Authentication:** JWT-based authentication to protect user accounts and data.
- **File Sharing:** Easily upload and share files for assignments and announcements.
- **Responsive Design:** A seamless experience across desktop and mobile devices.

<!-- ## Screenshots

*(Add your application screenshots here)* -->

## Technologies Used


### Backend

- **NestJS:** A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- **PostgreSQL:** A powerful, open-source object-relational database system.
- **TypeORM:** A TypeScript ORM for Node.js.
- **Socket.IO:** For real-time, bidirectional and event-based communication.
- **JWT:** For secure user authentication.
- **BullMQ:** For background job processing (notifications).

### Frontend

- **React:** A JavaScript library for building user interfaces.
- **Vite:** A fast build tool for modern web development.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **Shadcn/ui:** A collection of re-usable components built using Radix UI and Tailwind CSS.
- **React Query:** For data fetching, caching, and state management.
- **Axios:** A promise-based HTTP client for the browser and Node.js.
- **React Router:** For declarative routing in React applications.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL

## Installation and Setup

### Server

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Trinankur002/classroom-hub-.git

    cd classroom-hub-full/server
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the `server` directory and add the following environment variables:

    ```
    DATABASE_URL="postgresql://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"
    JWT_SECRET="your_jwt_secret"
    ```

4.  **Run database migrations:**

    The application uses `synchronize: true` in the TypeORM configuration, which automatically creates the database schema on application startup.

### Web Client

1.  **Navigate to the web directory:**

    ```bash
    cd ../web
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the `web` directory and add the following environment variable to point to your backend server:

    ```
    VITE_API_URL="http://localhost:3000"
    ```

## Running the Application

1.  **Start the backend server:**

    From the `server` directory, run:

    ```bash
    npm run start:dev
    ```

    The server will be running on `http://localhost:3000`.

2.  **Start the frontend development server:**

    From the `web` directory, run:

    ```bash
    npm run dev
    ```

    The application will be accessible at `http://localhost:5173`.

## Available Scripts

### Server

- `npm run build`: Build the application for production.
- `npm run format`: Format the code using Prettier.
- `npm start`: Start the application in production mode.
- `npm run start:dev`: Start the application in development mode with watch.
- `npm run start:debug`: Start the application in debug mode.
- `npm run lint`: Lint the code using ESLint.
- `npm test`: Run tests.

### Web Client

- `npm run dev`: Start the development server.
- `npm run build`: Build the application for production.
- `npm run lint`: Lint the code using ESLint.
- `npm run preview`: Preview the production build.
