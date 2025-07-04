# Express.js Hello World with TypeScript

A simple Express.js server built with TypeScript that provides basic API endpoints.

## Features

- ✅ TypeScript support
- ✅ Express.js web framework
- ✅ Auto-reload with nodemon
- ✅ JSON API endpoints
- ✅ Health check endpoint

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```
This will start the server with auto-reload on file changes.

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Hello World message |
| GET | `/api/hello` | API endpoint with request details |
| GET | `/health` | Health check endpoint |

## Example Responses

### GET /
```json
{
  "message": "Hello World from Express.js with TypeScript!"
}
```

### GET /api/hello
```json
{
  "message": "Hello from API endpoint!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "GET",
  "url": "/api/hello"
}
```

### GET /health
```json
{
  "status": "OK",
  "uptime": 123.456,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Project Structure

```
├── src/
│   └── index.ts          # Main server file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── nodemon.json          # Development configuration
└── README.md            # This file
```

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (not implemented yet)

## Environment Variables

- `PORT` - Server port (default: 3000)

## Next Steps

- Add more API endpoints
- Integrate with a database
- Add authentication
- Set up testing framework
- Add request validation
- Implement error handling middleware # safeMama-backend
