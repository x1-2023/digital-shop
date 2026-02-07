# Changelog

## [2026-02-04]
### Added
- **Direct Auto-Deposit:** Allows users to top up by transferring with syntax `NAP <UserID>` without creating a web request first.
- **Security:** Rate Limiting for Login, Signup, Order APIs.
- **Security:** Strict Zod Validation for Authentication.
- **Performance:** ISR Caching for Categories API.

### Changed
- **Optimization:** Refactored `GET /api/products` and `GET /api/orders` to use Prisma `select` for reduced payload size.
- **Refactor:** Centralized authentication logic in API routes.

### Fixed
- **Type Error:** Corrected `Payment` field selection in Orders API (simulated `status` removed).
- **Build Error:** Fixed various build errors and lint warnings from previous session.
