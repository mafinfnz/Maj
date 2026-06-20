# Инструкция по сборке и защите кода

## 1. Сборка исполняемого файла (EXE)
Для сборки приложения в один .exe файл используйте `electron-builder`.

### Подготовка:
```bash
cd frontend
npm install --save-dev electron-builder
```

### Сборка:
Добавьте в `package.json` секцию build:
```json
"build": {
  "appId": "com.majestic.laws",
  "directories": {
    "output": "dist"
  },
  "win": {
    "target": "portable"
  }
}
```
Затем запустите:
```bash
npm run build
npx electron-builder
```

## 2. Защита кода (Obfuscation)
Для защиты бэкенда (Python) рекомендуется использовать `PyArmor`.

### Установка:
```bash
pip install pyarmor
```

### Обфускация:
```bash
pyarmor pack -e " --onefile" backend.py
```
Это создаст защищенный .exe файл в папке `dist/`.

Для защиты фронтенда (JS) используйте `javascript-obfuscator`:
```bash
npm install -g javascript-obfuscator
javascript-obfuscator ./build/static/js --output ./build/static/js/obfuscated
```

## 3. Подключение внешнего ИИ (GPT-4/Claude)
Если вы захотите заменить локальный поиск на реальный ИИ:
1. В `backend.py` замените функцию `get_ai_response`.
2. Используйте библиотеку `openai`:
```python
import openai
openai.api_key = "ВАШ_КЛЮЧ"

def get_ai_response(query, context):
    response = openai.ChatCompletion.create(
      model="gpt-4",
      messages=[
        {"role": "system", "content": f"Ты юрист. Отвечай только по этим законам: {context}"},
        {"role": "user", "content": query}
      ]
    )
    return response.choices[0].message.content
```
