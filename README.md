# PAYMINTS Backend API

A robust, high-performance backend system for handling secure payments, built with modern TypeScript, Fastify, and TypeORM. Designed to be extensible, testable, and production-ready.

---

## 🚀 Overview

The **PAYMINTS Backend** provides a scalable REST API with first-class support for authentication, multiple database engines, API documentation, and comprehensive logging and testing. It’s engineered to work across different environments (dev, test, prod) with ease.

---

## 🔥 Features

- ⚡ **Fastify-powered** for blazing performance and low overhead.
- 🔐 **Secure JWT authentication** with support for refresh tokens.
- 🛢️ **Multi-DB support**: SQLite, PostgreSQL, MySQL, MSSQL, Oracle, MongoDB.
- 📜 **Swagger Documentation** out of the box.
- 🧪 **Vitest test suite** for confidence in your codebase.
- 🌍 **CORS configuration** for safe cross-origin communication.
- 📦 **TS-first development** using modern tooling (TSX, TSUP).
- 🔧 **Environment-specific configurations** via `.env` files.
- 📋 **Structured logging** with Pino.

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [PNPM](https://pnpm.io/) (v8+)

### Installation

```bash
git clone https://github.com/your-username/paymints-backend.git
cd paymints-backend
pnpm install
```

## 🛠️ Usage
## 🧑‍💻 Development

```bash
pnpm dev

# Paymints Backend

## Development
```bash
pnpm dev
```
Runs the dev server with hot reload via TSX and detailed debug logs.

## Production
```bash
pnpm build
pnpm start
```
Compiles TypeScript and launches the server using the compiled JS output.

## 🧪 Testing
```bash
pnpm test
```
Runs the unit test suite using Vitest.

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 (prod), 3002 (dev) |
| HOST | Host address | 0.0.0.0 |
| NODE_ENV | Node environment | development |
| API_PREFIX | Prefix for all routes | /api |
| JWT_SECRET | Secret for JWT signing | Set per environment |
| DB_TYPE | Database driver type | better-sqlite3 |
| DB_NAME | Database name | :memory: (dev), production.db |
| CORS_ORIGIN | Allowed CORS origins | * (dev), specific domain (prod) |
| LOG_LEVEL | Logging verbosity | debug (dev), info (prod) |

### Environment Files
- .env.development
- .env.test
- .env.production

## 🗂️ Folder Structure
```
paymints-backend/
├── src/               # App source
│   ├── controllers/   # Route handlers
│   ├── services/      # Business logic
│   ├── db/            # Database config and models
│   └── index.ts       # Entry point
├── dist/              # Compiled JS files
├── .env.*             # Environment configs
├── package.json       # Project manifest
└── tsconfig.json      # TS configuration
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| pnpm dev | Run development server with hot reload |
| pnpm build | Build the project using tsup |
| pnpm start | Start production server |
| pnpm clean | Remove compiled output |
| pnpm lint | Run Biome linter |
| pnpm lint:fix | Auto-fix lint issues |
| pnpm format | Format codebase using Biome |
| pnpm test | Run tests using Vitest |

## 🔐 License
Proprietary – All rights reserved.

