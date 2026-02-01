# Silentbox Admin Panel - Phase 1 Critical Fixes

**Session ID:** plan-2026-01-31-phase1-fixes
**Created:** 2026-01-31
**Approach:** Parallel Workstreams

---

## Problem Statement

Silentbox Admin Panel has 4 critical issues affecting stability and UX:

1. **No form validation** - forms submit without checking, users don't see errors
2. **Silent error handling** - 17 files use console.error instead of toast notifications
3. **Mock occupancy data** - Dashboard shows Math.random() instead of real data
4. **Missing lock endpoint** - TTLock service supports lock, but API route not created

---

## Scope & Boundaries

### IN SCOPE
- Install zod + @hookform/resolvers
- Create Zod schemas for all CRUD forms (Locations, Booths, Users, Pricing, Settings, Tenants, Devices)
- Integrate sonner toast in all 17 files with console.error
- Connect real occupancy data in Dashboard
- Create lock endpoint on API server
- Inline error display under form fields with ARIA accessibility
- Loading states for async data

### OUT OF SCOPE
- WebSockets / Real-time updates
- New pages (Billing, Audit Logs, Reports)
- E2E tests
- Backend validation (frontend only)

---

## Success Criteria

1. `pnpm --filter @silentbox/admin type-check` passes without errors
2. `pnpm --filter @silentbox/admin build` completes successfully
3. All forms show inline errors with ARIA attributes for invalid data
4. All CRUD operations show toast on success/error
5. Dashboard occupancy shows data from API (not random)
6. Devices page: Lock button works and updates status

---

## Tasks

<!-- EXECUTION_TASKS_START -->

| # | Task | Files | Deps | Batch |
|---|------|-------|------|-------|
| 1 | Install zod + @hookform/resolvers | apps/admin/package.json | - | 1 |
| 2 | Create shared Zod schemas index + types export | apps/admin/src/lib/validations/index.ts | 1 | 1 |
| 3 | Add location schema | apps/admin/src/lib/validations/location.ts | 2 | 1 |
| 4 | Add booth schema | apps/admin/src/lib/validations/booth.ts | 2 | 1 |
| 5 | Add user/credits schema | apps/admin/src/lib/validations/user.ts | 2 | 1 |
| 6 | Add tenant schema | apps/admin/src/lib/validations/tenant.ts | 2 | 1 |
| 7 | Add pricing schemas (discount, peak, package) | apps/admin/src/lib/validations/pricing.ts | 2 | 1 |
| 8 | Add settings schema | apps/admin/src/lib/validations/settings.ts | 2 | 1 |
| 9 | Create FormField error component with ARIA | apps/admin/src/components/ui/form-error.tsx | - | 1 |
| 10 | Integrate validation in Locations page | apps/admin/src/app/(dashboard)/locations/page.tsx | 3,9 | 2 |
| 11 | Integrate validation in Booths page | apps/admin/src/app/(dashboard)/booths/page.tsx | 4,9 | 2 |
| 12 | Integrate validation in Users page | apps/admin/src/app/(dashboard)/users/page.tsx | 5,9 | 2 |
| 13 | Integrate validation in Tenants new page | apps/admin/src/app/(super)/super/tenants/new/page.tsx | 6,9 | 2 |
| 14 | Integrate validation in Pricing page | apps/admin/src/app/(dashboard)/pricing/page.tsx | 7,9 | 2 |
| 15 | Integrate validation in Settings page | apps/admin/src/app/(dashboard)/settings/page.tsx | 8,9 | 2 |
| 16 | Add toast to Locations page (replace console.error) | apps/admin/src/app/(dashboard)/locations/page.tsx | - | 3 |
| 17 | Add toast to Booths page | apps/admin/src/app/(dashboard)/booths/page.tsx | - | 3 |
| 18 | Add toast to Users page | apps/admin/src/app/(dashboard)/users/page.tsx | - | 3 |
| 19 | Add toast to Bookings page | apps/admin/src/app/(dashboard)/bookings/page.tsx | - | 3 |
| 20 | Add toast to Tenants list page | apps/admin/src/app/(super)/super/tenants/page.tsx | - | 3 |
| 21 | Add toast to Tenants detail page | apps/admin/src/app/(super)/super/tenants/[id]/page.tsx | - | 3 |
| 22 | Add toast to Tenants new page | apps/admin/src/app/(super)/super/tenants/new/page.tsx | - | 3 |
| 23 | Add toast to Login page | apps/admin/src/app/login/page.tsx | - | 3 |
| 24 | Add useOccupancy to use-analytics hook | apps/admin/src/hooks/use-analytics.ts | - | 4 |
| 25 | Integrate real occupancy in Dashboard | apps/admin/src/app/(dashboard)/dashboard/page.tsx | 24 | 4 |
| 26 | Add lock endpoint to API server | apps/api/src/routes/admin.ts | - | 4 |
| 27 | Add lock device schema | apps/admin/src/lib/validations/device.ts | 2 | 4 |
| 28 | Update Devices page with lock button handling | apps/admin/src/app/(dashboard)/devices/page.tsx | 26 | 4 |
| 29 | Add loading skeleton for occupancy | apps/admin/src/app/(dashboard)/dashboard/page.tsx | 24 | 4 |
| 30 | Run type-check and fix errors | - | 1-29 | 5 |
| 31 | Run build and verify | - | 30 | 5 |

<!-- EXECUTION_TASKS_END -->

---

## Batch Summary

| Batch | Tasks | Focus | Agent Count |
|-------|-------|-------|-------------|
| 1 | 1-9 | Infrastructure (schemas + ARIA component) | 7 |
| 2 | 10-15 | Form validation integration | 6 |
| 3 | 16-23 | Toast notifications | 8 |
| 4 | 24-29 | Occupancy + Lock endpoint + loading | 6 |
| 5 | 30-31 | Verification | 2 |

---

## Dependencies

```
Batch 1 (Infrastructure)
├── Task 1: Install packages
├── Task 2: Schemas index (depends on 1)
├── Tasks 3-8: Entity schemas (depend on 2, parallel)
└── Task 9: FormError component (independent)

Batch 2 (Form Integration)
├── Tasks 10-15: Each depends on corresponding schema + Task 9
└── All can run in parallel within batch

Batch 3 (Toast Integration)
├── Tasks 16-23: Independent, can run in parallel
└── No dependencies on Batch 1-2

Batch 4 (Backend + Occupancy)
├── Tasks 24-25, 29: Occupancy (24 → 25, 29)
├── Tasks 26-28: Lock endpoint (26 → 28)
├── Task 27: Device schema (depends on Task 2)
└── Can run in parallel with Batch 2-3

Batch 5 (Verification)
└── Depends on ALL previous tasks
```

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Zod schema doesn't match API response | Medium | Medium | Match with types in api.ts |
| Toast spam on multiple errors | Low | Low | Debounce or single toast |
| Lock endpoint fails (TTLock issue) | Low | Medium | Fallback to error message |
| Merge conflicts between batches | Medium | Low | Isolated files per task |
| Type errors after integration | High | Low | Batch 5 for fixing |
| Accessibility compliance | Medium | Medium | ARIA attributes in FormError |

---

## Verification Checklist

```
[ ] pnpm --filter @silentbox/admin type-check passes
[ ] pnpm --filter @silentbox/admin build passes
[ ] Locations form shows validation errors
[ ] Booths form shows validation errors
[ ] Users credit form shows validation errors
[ ] Tenants new form shows validation errors
[ ] Pricing forms show validation errors
[ ] Settings form shows validation errors
[ ] All CRUD operations show toast on success
[ ] All CRUD operations show toast on error
[ ] Dashboard occupancy shows real % (not random)
[ ] Dashboard occupancy has loading skeleton
[ ] Devices page Lock button works
[ ] No console.error calls in catch blocks
[ ] Error messages have ARIA attributes
```

---

## Next Steps

When ready, execute with:

```
/claudikins-kernel:execute .claude/kernel-outlines/outline-plan-2026-01-31-phase1-fixes.md
```
