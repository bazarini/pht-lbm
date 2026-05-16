# PhotoBook — MVP веб-сервис для создания фотоальбомов

Веб-приложение для создания и просмотра персональных фотоальбомов в стиле книги с анимацией перелистывания страниц.

## Стек

- **React + Vite** — фреймворк и сборщик
- **React Router v6** — клиентский роутинг
- **Zustand** — стейт-менеджмент
- **CSS Modules** — стилизация компонентов
- **localStorage** — хранение данных (без бэкенда)

## Возможности MVP

- Регистрация и авторизация (mock, без бэкенда)
- Dashboard со списком альбомов пользователя
- Редактор альбома: загрузка фото, подписи, управление страницами
- Просмотр в режиме книги с анимацией перелистывания (CSS 3D flip)
- Автосохранение в localStorage

## Структура проекта

```
src/
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── EditorPage.jsx
│   └── ViewerPage.jsx
├── components/
│   ├── AlbumCard.jsx
│   ├── PageEditor.jsx
│   ├── BookViewer.jsx
│   ├── PhotoUploader.jsx
│   └── AuthGuard.jsx
├── store/
│   ├── authStore.js
│   └── albumStore.js
└── utils/
    └── storage.js
```

## Дизайн

Стиль физического фотоальбома-книжки:
- Фон страниц: `#f5f0e8` (кремовый)
- Тёмный переплёт
- Шрифт подписей: Playfair Display, italic
- Тени и 3D-эффекты для глубины

## Порядок разработки

1. Scaffolding: Vite + React, зависимости, роутинг
2. Auth: `authStore`, LoginPage, RegisterPage, AuthGuard
3. Dashboard: `albumStore`, DashboardPage, AlbumCard
4. Редактор: EditorPage, PageEditor, PhotoUploader
5. Viewer: ViewerPage, BookViewer с page-flip анимацией
6. Полировка: шрифты, переходы, empty states

## Запуск

```bash
npm install
npm run dev
```

## Ограничения MVP

- Только desktop (мобильная адаптация не в скоупе)
- Без бэкенда, облачного хранения и экспорта в PDF
- Без шаблонов, шаринга и публичных ссылок
