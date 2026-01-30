# Silentbox Cloud — Полный анализ проекта

**Дата анализа:** 2026-01-31
**Версия:** MVP
**Статус:** ~90% завершено

---

## 1. Структура проекта

### Apps (в `/apps`)

| App | Назначение | Технологии | Порт |
|-----|------------|------------|------|
| **api** | Backend API + WebSocket | Fastify, Socket.IO, Supabase | 3001 |
| **admin** | Админ панель оператора | Next.js 14, shadcn/ui, Zustand | 3002 |
| **booking** | Веб для клиентов (PWA) | Next.js 14, Tailwind, PWA | 3003 |
| **mobile** | Мобильное приложение | Expo 52, React Native, Expo Router | - |
| **web** | (Legacy/unused) | Static HTML | - |

### Packages (в `/packages`)

| Package | Назначение |
|---------|------------|
| **shared** | Общие типы, Zod схемы, константы |
| **ui** | Shared UI компоненты (минимально используется) |

---

## 2. Tech Stack

### API (@silentbox/api)
- **Runtime:** Node.js 20+, pnpm 8+
- **Framework:** Fastify 4.25.0
- **Plugins:** @fastify/cors, helmet, jwt, rate-limit, websocket
- **Database:** Supabase (PostgreSQL) + @supabase/supabase-js 2.39.0
- **Real-time:** Socket.IO 4.7.0
- **Auth:** JWT + bcrypt 5.1.1
- **Validation:** Zod 3.22.0
- **Build:** tsup, tsx

### Admin (@silentbox/admin)
- **Framework:** Next.js 14.1.0
- **Components:** Radix UI, shadcn/ui
- **State:** Zustand 4.5.7
- **Data:** TanStack React Query 5.17.0, React Table 8.11.0
- **Charts:** Recharts 2.10.0
- **Toasts:** Sonner

### Booking (@silentbox/booking)
- **Framework:** Next.js 14.1.0
- **Styling:** Tailwind CSS 3.4.1
- **State:** Zustand 4.5.0
- **Data:** TanStack React Query 5.17.0
- **PWA:** Service Worker + manifest.json

### Mobile (@silentbox/mobile)
- **Framework:** Expo 52.0.0, React Native 0.76.9
- **Routing:** Expo Router 4.0.0
- **State:** Zustand 4.5.0
- **Maps:** React Native Maps 1.18.0
- **Real-time:** Socket.IO Client 4.7.0
- **Notifications:** Expo Notifications 0.29.0

---

## 3. Database Schema (Supabase)

### Core Tables
1. **tenants** — Multi-tenant конфигурация
2. **users** — Пользователи (с tenant_id)
3. **locations** — Локации с кабинками
4. **booths** — Кабинки
5. **bookings** — Бронирования (с EXCLUSION constraint для double-booking)
6. **transactions** — Платежи
7. **devices** — TTLock smart locks
8. **access_logs** — Логи доступа
9. **credit_packages** — Пакеты кредитов
10. **notifications** — Push уведомления
11. **reviews** — Отзывы
12. **favorites** — Избранное

### System Tables
- **platform_settings** — Глобальные настройки
- **subscription_plans** — Тарифы (Free, Starter, Pro, Enterprise)
- **tenant_invitations** — Приглашения в команду
- **audit_logs** — Аудит

### Migrations
1. `001_initial_schema.sql` — Core tables
2. `002_rls_policies.sql` — Row-level security
3. `003_seed_data.sql` — Demo data
4. `004_multitenancy_enhancements.sql` — API keys, super admin
5. `005_tenant_billing.sql` — Billing

---

## 4. API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Логин
- `POST /api/auth/refresh` — Refresh token
- `POST /api/auth/logout` — Выход

### Users
- `GET /api/users/profile` — Профиль
- `PUT /api/users/profile` — Обновить профиль
- `GET /api/users/credits` — Баланс кредитов

### Locations & Booths
- `GET /api/locations` — Список локаций
- `GET /api/booths` — Список кабинок
- `GET /api/booths/nearby` — Поиск по гео (PostGIS)

### Bookings
- `POST /api/bookings` — Создать бронирование
- `GET /api/bookings` — Мои бронирования
- `PUT /api/bookings/:id/extend` — Продлить
- `POST /api/bookings/:id/cancel` — Отменить
- `POST /api/bookings/:id/check-in` — Check-in
- `POST /api/bookings/:id/check-out` — Check-out

### Payments
- `GET /api/payments/packages` — Пакеты кредитов
- `POST /api/payments/purchase` — Купить кредиты
- `POST /api/payments/verify` — Проверить платёж

### Access Control (IoT)
- `POST /api/access/unlock/:bookingId` — Открыть замок

### Webhooks
- `POST /webhooks/payments/p24` — Przelewy24
- `POST /webhooks/payments/mono` — Monobank
- `POST /webhooks/ttlock/*` — TTLock

---

## 5. Прогресс по Batches

| Batch | Название | Прогресс | Статус |
|-------|----------|----------|--------|
| 0 | Pre-Development Setup | 1/9 | ⏳ External deps |
| 1 | Foundation | 9/9 | ✅ |
| 2 | Auth & Users | 9/10 | ✅ |
| 3 | Booths & Locations | 9/10 | ✅ |
| 4 | Booking System | 10/10 | ✅ |
| 5 | Payments | 10/10 | ✅ |
| 6 | IoT Integration | 9/10 | ✅ |
| 7 | Real-time & Notifications | 8/10 | 🟡 |
| 8 | Operator Dashboard | 10/10 | ✅ |
| 9 | Super Admin | 9/10 | ✅ |
| 10 | Calendar, Localization, Polish | 5/10 | 🟡 |

**Overall: ~89/99 tasks (~90%)**

---

## 6. Критические проблемы

### 🔴 CRITICAL (блокирует production)

| Проблема | Файл | Описание |
|----------|------|----------|
| Admin Login — заглушка | `admin/src/app/login/page.tsx:23` | Редирект на dashboard без авторизации |
| Super Admin публичный | `api/src/routes/superadmin.ts:65` | Нет auth guard |
| Demo tenant hardcoded | `admin/src/components/providers/query-provider.tsx:7` | Должен быть динамический |

### 🟡 HIGH

| Проблема | Файл | Описание |
|----------|------|----------|
| Availability = true (stub) | `mobile/app/booth/[id].tsx:369` | Нет реальной проверки |
| Forgot password не работает | `mobile/app/(auth)/forgot-password.tsx:34` | Нет API вызова |
| Payment webhook alerts | `api/src/routes/webhooks/index.ts:198` | TODO не реализован |

### 🟠 MEDIUM

| Проблема | Файл | Описание |
|----------|------|----------|
| Push token invalidation | `api/src/services/push.ts:98` | Невалидные токены не удаляются |
| Device status alerts | `api/src/services/cron.ts:429` | TODO не реализован |

---

## 7. Deployment Status

### Production Server: 49.12.104.181 (Hetzner)

| Сервис | URL | Порт | PM2 | SSL |
|--------|-----|------|-----|-----|
| API | api.cloud.silent-box.com | 3001 | ✅ | ✅ |
| Admin | cloud.silent-box.com | 3002 | ✅ | ✅ |
| Booking | book.silent-box.com | 3003 | ✅ | ⏳ DNS |

### PM2 Processes
```
silentbox-cloud-api      | 3001 | online
silentbox-cloud-admin    | 3002 | online
silentbox-cloud-booking  | 3003 | online
silentbox-crm            | другой проект | online
```

---

## 8. Внешние зависимости (ожидание)

| Сервис | Статус | Действие |
|--------|--------|----------|
| Apple Developer | ⏳ Paid, waiting 2 days | Ждать активации |
| Google Play Developer | ⏳ | Нужно оплатить ($25) |
| Przelewy24 | ⏳ | Подать заявку |
| Monobank Acquiring | ⏳ | Подать заявку |
| TTLock Gateway | ⏳ | Заказать устройство |
| Firebase Project | ⏳ | Создать для push |
| Google Cloud | ⏳ | Maps API key |

---

## 9. Следующие шаги

### Приоритет 1: Безопасность
1. [ ] Реализовать авторизацию админки (JWT + Supabase Auth)
2. [ ] Защитить Super Admin endpoints (auth guard)
3. [ ] Убрать hardcoded demo tenant

### Приоритет 2: Внешние сервисы
1. [ ] Создать Firebase Project → Push notifications
2. [ ] Google Play Developer Account → Android публикация
3. [ ] Przelewy24 заявка → PL платежи
4. [ ] TTLock Gateway → IoT интеграция

### Приоритет 3: Функционал
1. [ ] Google Calendar интеграция в booking flow
2. [ ] E2E тесты критического пути
3. [ ] API документация (OpenAPI)
4. [ ] Android APK через EAS Build

### Приоритет 4: DNS
1. [ ] Добавить A record: `book.silent-box.com → 49.12.104.181`
2. [ ] Запустить certbot для SSL

---

## 10. Команды для продолжения

### Локальная разработка
```bash
cd C:\Users\serbi\projects\silentbox-cloud
pnpm install
pnpm dev
```

### Деплой на сервер
```bash
ssh root@49.12.104.181
cd /var/www/silentbox-cloud
git pull origin main
pnpm install && pnpm build
pm2 reload all
```

### SSL для book.silent-box.com (после DNS)
```bash
ssh root@49.12.104.181
certbot --nginx -d book.silent-box.com
```

---

*Последнее обновление: 2026-01-31*
