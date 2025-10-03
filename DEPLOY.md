# 🚀 Инструкция по деплою на GitHub Pages

## Шаг 1: Создание репозитория

1. Перейдите на [GitHub.com](https://github.com)
2. Нажмите зеленую кнопку "New" (новый репозиторий)
3. Название: `family-budget-pwa` (или любое другое)
4. Сделайте репозиторий **Public**
5. НЕ ставьте галочку "Add a README file" (у нас уже есть)
6. Нажмите "Create repository"

## Шаг 2: Загрузка файлов

### Вариант A: Через веб-интерфейс GitHub

1. В созданном репозитории нажмите "uploading an existing file"
2. Перетащите ВСЕ файлы из папки `в4` (включая папки `.github` и `icons`)
3. В поле "Commit changes" напишите: "Initial PWA setup"
4. Нажмите "Commit changes"

### Вариант B: Через Git командную строку

```bash
# В папке в4 выполните:
git init
git add .
git commit -m "Initial PWA setup"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/family-budget-pwa.git
git push -u origin main
```

## Шаг 3: Настройка GitHub Pages

1. В репозитории перейдите в Settings (вверху справа)
2. Прокрутите до раздела "Pages" (слева в меню)
3. В разделе "Source" выберите "Deploy from a branch"
4. Выберите ветку "main" и папку "/ (root)"
5. Нажмите "Save"

## Шаг 4: Ожидание деплоя

- GitHub Pages автоматически создаст ваше приложение
- Это может занять 2-10 минут
- Ссылка будет: `https://ВАШ_USERNAME.github.io/family-budget-pwa/`

## Шаг 5: Настройка Firebase (ВАЖНО!)

После деплоя обязательно:

1. Создайте свой Firebase проект
2. Замените конфигурацию в `firebase-sync.js`
3. Загрузите обновленный файл в репозиторий

## ✅ Готово!

Ваше PWA приложение будет доступно по ссылке и готово к установке на мобильные устройства!

---

**Нужна помощь?** Пишите в Issues репозитория!
