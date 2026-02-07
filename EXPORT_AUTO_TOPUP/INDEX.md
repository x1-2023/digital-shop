# 📑 AUTO-TOPUP SYSTEM - FILE INDEX

Complete file structure and navigation guide.

## 📂 Directory Structure

```
EXPORT_AUTO_TOPUP/
├── 📄 README.md                      # Main documentation
├── 📄 QUICK_START.md                 # 5-minute setup guide
├── 📄 INSTALL.md                     # Detailed installation guide
├── 📄 INDEX.md                       # This file
│
├── 📁 database/
│   ├── schema.prisma                 # Prisma schema (add to your project)
│   └── migrations.sql                # SQL migration script
│
├── 📁 lib/
│   ├── auto-topup.ts                 # Core auto-topup logic
│   ├── generic-bank-api.ts           # Generic bank API client
│   ├── deposit-bonus.ts              # Bonus calculation
│   └── types.ts                      # TypeScript type definitions
│
├── 📁 api/
│   └── cron-auto-topup-route.ts      # Next.js API route
│
├── 📁 scripts/
│   ├── auto-topup-simple.sh          # Cron bash script
│   └── setup-cron.sh                 # Auto setup crontab
│
├── 📁 config/
│   ├── bank-config-example.json      # Example bank config
│   └── tpbank-config.json            # TPBank specific config
│
└── 📁 docs/
    ├── FLOW.md                       # Complete system flow
    ├── DATABASE.md                   # Database schema docs
    └── API.md                        # API documentation
```

---

## 🎯 Quick Navigation

### Getting Started
1. **[QUICK_START.md](QUICK_START.md)** - Start here! 5-minute setup
2. **[INSTALL.md](INSTALL.md)** - Detailed installation steps
3. **[README.md](README.md)** - Full system overview

### Core Documentation
- **[docs/FLOW.md](docs/FLOW.md)** - How the system works (flow diagram)
- **[docs/DATABASE.md](docs/DATABASE.md)** - Database tables & queries
- **[docs/API.md](docs/API.md)** - API endpoints & functions

### Configuration
- **[config/bank-config-example.json](config/bank-config-example.json)** - Generic bank config template
- **[config/tpbank-config.json](config/tpbank-config.json)** - TPBank specific example

### Source Code
- **[lib/auto-topup.ts](lib/auto-topup.ts)** - Main processing logic
- **[lib/generic-bank-api.ts](lib/generic-bank-api.ts)** - Bank API integration
- **[lib/deposit-bonus.ts](lib/deposit-bonus.ts)** - Bonus calculation
- **[lib/types.ts](lib/types.ts)** - Type definitions
- **[api/cron-auto-topup-route.ts](api/cron-auto-topup-route.ts)** - API endpoint

### Database
- **[database/schema.prisma](database/schema.prisma)** - Prisma schema
- **[database/migrations.sql](database/migrations.sql)** - SQL migration

### Scripts
- **[scripts/auto-topup-simple.sh](scripts/auto-topup-simple.sh)** - Cron script
- **[scripts/setup-cron.sh](scripts/setup-cron.sh)** - Setup helper

---

## 📖 Reading Order

### For First-Time Users
1. **README.md** - Understand what the system does
2. **QUICK_START.md** - Get it running quickly
3. **docs/FLOW.md** - Understand how it works
4. **config/bank-config-example.json** - Configure your bank

### For Developers
1. **docs/API.md** - API reference
2. **docs/DATABASE.md** - Database schema
3. **lib/auto-topup.ts** - Core logic
4. **lib/generic-bank-api.ts** - Bank integration
5. **lib/types.ts** - Type definitions

### For DevOps/Deployment
1. **INSTALL.md** - Installation steps
2. **scripts/setup-cron.sh** - Cron setup
3. **database/migrations.sql** - Database setup
4. **docs/DATABASE.md** - Database structure

---

## 🔑 Key Files Explained

### README.md
- **What it is:** Main documentation entry point
- **Read if:** You want overview of features, architecture
- **Contains:** Package contents, features, quick start, configuration

### QUICK_START.md
- **What it is:** Fast setup guide (5 minutes)
- **Read if:** You want to get running immediately
- **Contains:** 5 simple steps, verification tests, common issues

### INSTALL.md
- **What it is:** Detailed installation guide
- **Read if:** You need step-by-step instructions
- **Contains:** Prerequisites, installation steps, configuration, troubleshooting

### docs/FLOW.md
- **What it is:** Complete system flow diagram
- **Read if:** You want to understand how it works internally
- **Contains:** Step-by-step flow from cron → database, error handling

### docs/DATABASE.md
- **What it is:** Database schema documentation
- **Read if:** You need to understand data structure
- **Contains:** Tables, fields, indexes, relationships, sample queries

### docs/API.md
- **What it is:** API and function reference
- **Read if:** You're integrating or customizing the system
- **Contains:** Endpoints, functions, parameters, return values, examples

### lib/auto-topup.ts
- **What it is:** Core business logic
- **Read if:** You want to understand or modify processing logic
- **Contains:** Transaction processing, matching, bonus calculation, database updates

### lib/generic-bank-api.ts
- **What it is:** Generic bank API client
- **Read if:** You're adding a new bank or debugging API issues
- **Contains:** HTTP client, response parsing, field mapping, filters

### lib/deposit-bonus.ts
- **What it is:** Deposit bonus calculation
- **Read if:** You want to customize bonus tiers
- **Contains:** Tier loading, bonus calculation, default tiers

### lib/types.ts
- **What it is:** TypeScript type definitions
- **Read if:** You're working with TypeScript
- **Contains:** Interfaces for all data structures

### api/cron-auto-topup-route.ts
- **What it is:** Next.js API route
- **Read if:** You're setting up the API endpoint
- **Contains:** HTTP handler, error handling, response format

### database/schema.prisma
- **What it is:** Prisma ORM schema
- **Read if:** You're using Prisma
- **Contains:** Models, relations, indexes

### database/migrations.sql
- **What it is:** SQL migration script
- **Read if:** You're applying database changes manually
- **Contains:** CREATE TABLE statements, indexes, sample data

### scripts/auto-topup-simple.sh
- **What it is:** Cron bash script
- **Read if:** You're setting up cron job
- **Contains:** HTTP call to API, logging, error handling

### scripts/setup-cron.sh
- **What it is:** Automated cron setup
- **Read if:** You want easy crontab setup
- **Contains:** Crontab entry creation, validation

### config/bank-config-example.json
- **What it is:** Generic bank config template
- **Read if:** You're adding a new bank
- **Contains:** All config fields with examples

### config/tpbank-config.json
- **What it is:** TPBank specific example
- **Read if:** You're using TPBank
- **Contains:** TPBank-specific field mapping

---

## 📝 File Dependencies

```
cron (every 2 min)
  ↓
scripts/auto-topup-simple.sh
  ↓
api/cron-auto-topup-route.ts
  ↓
lib/auto-topup.ts
  ├─→ lib/generic-bank-api.ts
  │     └─→ config/bank-config-*.json (from database)
  ├─→ lib/deposit-bonus.ts
  └─→ lib/types.ts
  ↓
database (SQLite)
```

---

## 🎓 Learning Path

### Beginner
1. Start with **README.md**
2. Follow **QUICK_START.md**
3. Read **docs/FLOW.md** to understand basics
4. Configure using **config/bank-config-example.json**

### Intermediate
1. Deep dive into **docs/API.md**
2. Study **lib/auto-topup.ts** code
3. Understand **docs/DATABASE.md** schema
4. Customize **lib/deposit-bonus.ts**

### Advanced
1. Modify **lib/generic-bank-api.ts** for custom banks
2. Extend **database/schema.prisma** for new features
3. Add custom logic to **lib/auto-topup.ts**
4. Create admin UI using API functions

---

## 🔍 Find What You Need

| I want to... | Read this file |
|--------------|----------------|
| Get started quickly | QUICK_START.md |
| Understand the system | README.md, docs/FLOW.md |
| Install properly | INSTALL.md |
| Configure a bank | config/bank-config-example.json |
| Understand database | docs/DATABASE.md |
| Use the API | docs/API.md |
| Modify logic | lib/auto-topup.ts |
| Add new bank | lib/generic-bank-api.ts |
| Customize bonuses | lib/deposit-bonus.ts |
| Setup cron | scripts/setup-cron.sh |
| Troubleshoot | INSTALL.md (Troubleshooting section) |

---

## 📊 File Statistics

- **Total Files:** 17
- **Documentation:** 7 files (README, guides, docs)
- **Source Code:** 5 files (TypeScript)
- **Configuration:** 2 files (JSON)
- **Database:** 2 files (Prisma, SQL)
- **Scripts:** 2 files (Bash)

---

## 🌟 Recommended Reading Order

**For Quick Setup:**
1. QUICK_START.md
2. config/bank-config-example.json
3. scripts/setup-cron.sh

**For Understanding:**
1. README.md
2. docs/FLOW.md
3. docs/DATABASE.md
4. docs/API.md

**For Development:**
1. lib/types.ts
2. lib/auto-topup.ts
3. lib/generic-bank-api.ts
4. api/cron-auto-topup-route.ts

---

**Last Updated:** 2025-01-06

Navigate confidently! 🧭
