# URL Shortener Service

This project is a URL shortener service built with Node.js, Express, and MongoDB. It allows users to create shortened URLs and manage them.

It offers URL shortening functionalities. It features user authentication implemented with JSON Web Tokens (JWT), allowing secure access and management of shortened URLs. The application includes API endpoints for user registration, login, URL shortening, retrieval of shortened URLs, and URL redirection. It supports tier-based user access, with each tier having distinct rate limits for URL shortening requests.

## Setup Instructions

To get started with this project, follow these steps:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/ARitik/url-shortener
   cd url-shortener
   ```

2. **Install Dependencies**

   Make sure you have Node.js installed on your system. Then run:

   ```bash
   npm install
   ```

3. **Environment Variables**

   Create a `.env` file in the root directory and add the following variables:

   ```
   MONGODB_URI=[MongoDB Connection URI]
   SECRET_KEY=[A Secret Key for JWT]
   SESSION_SECRET=[An Express Session Secret]
   PORT=[PORT NUMBER]
   ```

4. **Start the Server**

   ```bash
   npm start
   ```

   Your server should now be running on `http://localhost:[PORT]` or `http://localhost:3000`.

## API Endpoints

### User Authentication

- **Register User**
  - **Endpoint:** `/api/register`
  - **Method:** POST
  - **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "password123",
      "tier": "Tier1"
    }
    ```

- **Login User**
  - **Endpoint:** `/api/login`
  - **Method:** POST
  - **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```

### URL Management

- **Create Shortened URL**
  - **Endpoint:** `/api/user/shorten`
  - **Method:** POST
  - **Authorization:** Token required in cookie
  - **Body:**
    ```json
    {
      "longUrl": "https://www.example.com",
      "preferredShortUrl": "exmpl"
    }
    ```
    You can also choose to not specify a preferred URL and have the backend generate a random short URL for you.

    ```json
    {
      "longUrl": "https://www.example.com",
    }
    ```

- **Retrieve User's Shortened URLs**
  - **Endpoint:** `/api/user/shortened-urls`
  - **Method:** GET
  - **Authorization:** Token required in cookie

### Redirection

- **Redirect to Long URL**
  - **Endpoint:** `/:shortUrl`
  - **Method:** GET


**Built by Ritik Ambadi**