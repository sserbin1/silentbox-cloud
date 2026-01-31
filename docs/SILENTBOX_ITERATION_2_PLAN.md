# Silentbox Cloud — Итерация 2: Безопасность и Критические Фиксы

**Проект:** Silentbox Cloud
**Дата создания:** 2026-01-31
**Статус:** PLANNED
**Цель:** Подготовка к production deployment

---

## Обзор изменений Итерации 1.5 (сегодня)

### Выполнено:
- [x] Убрана поддержка поддоменов — только кастомные домены
- [x] Demo tenant переименован в MeetPoint (meetpoint.pro)
- [x] Создана миграция 006_update_demo_tenant_meetpoint.sql
- [x] Обновлён DEFAULT_BRANDING в booking app
- [x] Booking app задеплоен на сервер (порт 3003)

### DNS для настройки:
```
meetpoint.pro      → 49.12.104.181  (A record)
book.silent-box.com → 49.12.104.181  (A record) - уже ждёт
```

---

## Критические проблемы (найдено 20 issues)

| Категория | Critical | High | Medium | Low |
|-----------|----------|------|--------|-----|
| Authentication | 1 | 1 | 0 | 0 |
| Data Integrity | 1 | 0 | 0 | 0 |
| Missing Features | 0 | 4 | 4 | 0 |
| UI/UX | 0 | 0 | 2 | 6 |
| Secrets/Security | 1 | 0 | 0 | 0 |
| **TOTAL** | **3** | **5** | **6** | **6** |

---

## Sprint 1: Безопасность (БЛОКИРУЕТ PRODUCTION)

### 1.1 Admin Authentication [CRITICAL]
**Файл:** `apps/admin/src/app/login/page.tsx`
**Проблема:** Login — заглушка, редирект без проверки credentials
**Решение:**
- Интегрировать с API `/api/auth/login`
- Сохранять JWT в httpOnly cookie или secure storage
- Добавить middleware для проверки авторизации на всех dashboard routes
- Убрать hardcoded demo tenant из query-provider.tsx

**Acceptance Criteria:**
- [ ] Login проверяет credentials через API
- [ ] Неавторизованные пользователи редиректятся на /login
- [ ] JWT хранится безопасно
- [ ] Tenant ID берётся из JWT, не hardcoded

### 1.2 Super Admin Protection [CRITICAL]
**Файл:** `apps/api/src/routes/superadmin.ts`
**Проблема:** Все endpoints публичные (TODO: add auth)
**Решение:**
- Добавить auth guard для super_admin role
- Проверять JWT на каждом endpoint
- Логировать доступ в audit_logs

**Acceptance Criteria:**
- [ ] /api/super/* требует авторизации
- [ ] Только role=super_admin имеет доступ
- [ ] 401/403 для неавторизованных запросов

### 1.3 Webhook Security [CRITICAL]
**Файл:** `apps/api/src/routes/webhooks/index.ts`
**Проблема:** Нет rate limiting, неполная верификация подписей
**Решение:**
- Добавить rate limiting (10 req/min per IP)
- Улучшить signature verification
- Добавить idempotency key handling
- Логировать все webhook attempts

**Acceptance Criteria:**
- [ ] Rate limiting активен
- [ ] Signature verification для P24 и Monobank
- [ ] Duplicate webhooks игнорируются
- [ ] Все attempts логируются

### 1.4 Remove Hardcoded Secrets [CRITICAL]
**Файл:** `.env.local`
**Проблема:** Vercel OIDC token в репозитории
**Решение:**
- Удалить .env.local из git
- Добавить в .gitignore
- Ротировать скомпрометированные токены

**Acceptance Criteria:**
- [ ] .env.local в .gitignore
- [ ] Нет secrets в git history (git filter-branch)
- [ ] Новые токены сгенерированы

---

## Sprint 2: Критические фичи

### 2.1 Mobile Password Reset [HIGH]
**Файл:** `apps/mobile/app/(auth)/forgot-password.tsx`
**Проблема:** TODO — нет API вызова
**Решение:**
- Создать endpoint POST /api/auth/forgot-password
- Интегрировать с Supabase Auth resetPasswordForEmail
- Добавить email template

**Acceptance Criteria:**
- [ ] Форма отправляет запрос на API
- [ ] Email с ссылкой отправляется
- [ ] Ссылка работает и позволяет сменить пароль

### 2.2 Real Availability Check [HIGH]
**Файл:** `apps/mobile/app/booth/[id].tsx:369`
**Проблема:** `isAvailable = true` hardcoded
**Решение:**
- Использовать загруженную availability
- Показывать занятые слоты как недоступные
- Обновлять в реальном времени через Socket.IO

**Acceptance Criteria:**
- [ ] Занятые слоты показаны серым
- [ ] Нельзя выбрать занятый слот
- [ ] Real-time обновление при изменении

### 2.3 Admin Settings Persistence [HIGH]
**Файл:** `apps/admin/src/app/(dashboard)/settings/page.tsx`
**Проблема:** Формы не сохраняют данные
**Решение:**
- Добавить API endpoints для settings CRUD
- Подключить формы к React Query mutations
- Показывать toast при успехе/ошибке

**Acceptance Criteria:**
- [ ] Settings загружаются при открытии страницы
- [ ] Изменения сохраняются в БД
- [ ] Toast уведомления о результате

### 2.4 Push Notification Alerts [HIGH]
**Файл:** `apps/api/src/services/cron.ts:429`
**Проблема:** TODO — Send alert to admin
**Решение:**
- Реализовать отправку push при low battery
- Реализовать отправку при tamper alert
- Добавить email fallback для критических алертов

**Acceptance Criteria:**
- [ ] Push при battery < 20%
- [ ] Push при tamper detected
- [ ] Email для критических событий

### 2.5 Push Token Cleanup [HIGH]
**Файл:** `apps/api/src/services/push.ts:98`
**Проблема:** TODO — Mark invalid tokens
**Решение:**
- При ошибке отправки помечать token как invalid
- Cron job для удаления старых invalid tokens
- Не пытаться отправлять на invalid tokens

**Acceptance Criteria:**
- [ ] Invalid tokens помечаются в БД
- [ ] Cron удаляет старые invalid tokens
- [ ] Push не отправляется на invalid tokens

---

## Sprint 3: Полировка и Observability

### 3.1 Analytics Dashboard [MEDIUM]
**Файл:** `apps/admin/src/app/(super)/super/analytics/page.tsx`
**Проблема:** Все метрики = 0, placeholder charts
**Решение:**
- Подключить к реальным данным из API
- Реализовать графики с Recharts
- Добавить фильтры по датам

### 3.2 Device Status Alerts [MEDIUM]
**Файл:** `apps/api/src/services/cron.ts`
**Проблема:** Статусы логируются, но не отправляются
**Решение:**
- Интегрировать с notification service
- Добавить настройки threshold в tenant settings

### 3.3 Error Tracking [MEDIUM]
**Проблема:** console.error вместо Sentry
**Решение:**
- Добавить Sentry SDK во все apps
- Настроить error boundaries
- Интегрировать с alerts

### 3.4 Map API Keys [LOW]
**Файлы:** `apps/mobile/app.json`, `apps/web/index.html`
**Проблема:** Placeholder API keys
**Решение:**
- Получить Google Maps API key
- Настроить restrictions
- Добавить в env variables

---

## Порядок выполнения

```
Week 1: Sprint 1 (Security)
├── Day 1-2: Admin Authentication (1.1)
├── Day 3: Super Admin Protection (1.2)
├── Day 4: Webhook Security (1.3)
└── Day 5: Remove Secrets + Testing (1.4)

Week 2: Sprint 2 (Critical Features)
├── Day 1: Password Reset (2.1)
├── Day 2: Availability Check (2.2)
├── Day 3: Admin Settings (2.3)
└── Day 4-5: Push Notifications (2.4, 2.5)

Week 3: Sprint 3 (Polish)
├── Day 1-2: Analytics Dashboard (3.1)
├── Day 3: Device Alerts (3.2)
├── Day 4: Error Tracking (3.3)
└── Day 5: Map Keys + Testing (3.4)
```

---

## Внешние зависимости (параллельно)

| Задача | Статус | Блокирует |
|--------|--------|-----------|
| DNS: meetpoint.pro | ⏳ Ждёт настройки | Tenant booking |
| DNS: book.silent-box.com | ⏳ Ждёт настройки | SSL certificate |
| Firebase Project | ⏳ Нужно создать | Push notifications |
| Google Maps API | ⏳ Нужно получить | Mobile maps |
| Apple Developer | ⏳ Активация 2 дня | iOS build |
| Przelewy24 | ⏳ Заявка | PL payments |

---

## Команды для продолжения

### Применить миграцию meetpoint:
```bash
# На сервере или через Supabase Dashboard
psql $DATABASE_URL -f supabase/migrations/006_update_demo_tenant_meetpoint.sql
```

### Деплой обновлений:
```bash
ssh root@49.12.104.181
cd /var/www/silentbox-cloud
git pull origin main
pnpm install && pnpm build
pm2 reload all
```

### SSL для meetpoint.pro (после DNS):
```bash
certbot --nginx -d meetpoint.pro
```

---

## Nginx конфигурация для meetpoint.pro

После настройки DNS, добавить в `/etc/nginx/sites-available/silentbox-cloud`:

```nginx
# MeetPoint Tenant (Custom Domain)
server {
    listen 80;
    server_name meetpoint.pro;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-Domain meetpoint.pro;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

*Создано: 2026-01-31*
*Следующий review: После Sprint 1*
