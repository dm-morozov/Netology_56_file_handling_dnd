# Работа с HTML-формами, Popover и редактором списка на чистом JS

[![Build status](https://ci.appveyor.com/api/projects/status/awc042krfial5vnh?svg=true)](https://ci.appveyor.com/project/dm-morozov/netology-55-working-with-html-forms)
![CI](https://github.com/dm-morozov/Netology_55_working_with_html_forms/actions/workflows/web.yaml/badge.svg)
![Netology](https://img.shields.io/badge/TypeScript-JavaScript-blue)

Демонстрация работы с HTML-формами, валидацией, кешированием данных через LocalStorage, реализацией виджета Popover и базовым CRUD-редактором списка без использования jQuery или Bootstrap.  
../ahj-homeworks-AHJ-50/dnd/README.md
Проект собран с использованием Webpack и полностью готов к публикации на GitHub Pages.  

---

## ⚡ Функционал

### 1. Валидация формы
- Кастомные сообщения для каждого поля (`login`, `email`, `credit-card`).  
- Проверка `required`, `typeMismatch` и `patternMismatch`.  
- Автоматическое сохранение данных через LocalStorage, восстановление после перезагрузки и очистка при сбросе формы.

### 2. Popover на чистом JS
- Появляется при клике на кнопку, скрывается при повторном клике.  
- Заголовок и текст, маленькая стрелка указывает на кнопку.  
- Центрируется по горизонтали относительно элемента.  
- Реализован полностью на чистом JS (без jQuery/Bootstrap).  
- Автотесты на jsdom/Puppeteer проверяют появление и скрытие Popover, защитные условия (`if (this.popover)` и `if (!this.popover)`).

### 3. Редактор списка (CRUD) ⭐
- Добавление, редактирование и удаление элементов списка.  
- Всплывающее окно для добавления/редактирования с валидацией полей: текст для названия и положительное число для стоимости.  
- DOM перестраивается исходя из содержимого в памяти (JS-объектов).  
- Автотесты разделяют логику и взаимодействие с DOM, проверяя корректность операций.

---

## 🚀 Запуск проекта

1. Клонируйте репозиторий:

```bash
git clone https://github.com/<твое_имя_пользователя>/<название_репозитория>.git
cd <название_репозитория>
````

2. Установите зависимости:

```bash
yarn install
```

3. Сборка проекта:

```bash
yarn build
```

4. Локальный запуск для разработки:

```bash
yarn dev
```

5. Запуск тестов (jsdom/unit-тесты на CI):

```bash
yarn test
```

> E2E-тесты на Puppeteer запускаются локально отдельно:

```bash
yarn test:e2e
```

---

## 🌐 Ссылка на GitHub Pages

[Попробовать демо](https://dm-morozov.github.io/Netology_55_working_with_html_forms/)

---

## 📧 Контакты

Если возникнут вопросы, пишите:

* ![LinkedIn](./svg/linkedin-icon.svg) [LinkedIn](https://www.linkedin.com/in/dm-morozov/)
* ![Telegram](./svg/telegram.svg) [Telegram](https://t.me/dem2014)
* ![GitHub](./svg/github-icon.svg) [GitHub](https://github.com/dm-morozov/)

---

## 📝 Примечания

* Все стили написаны вручную, без Bootstrap.
* Popover реализован полностью на чистом JS.
* CRUD-редактор работает только с данными в памяти.
* Проект использует TypeScript и Webpack.
* Тесты на CI запускаются только jsdom/unit-тесты; Puppeteer/E2E-тесты рекомендуются запускать локально.