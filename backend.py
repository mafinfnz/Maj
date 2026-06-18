import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from rank_bm25 import BM25Okapi
import pymorphy3

app = Flask(__name__)
CORS(app)

morph = pymorphy3.MorphAnalyzer()

def tokenize(text):
    # Filter only words and numbers
    words = re.findall(r'\w+', text.lower())
    # Lemmatize Russian words
    return [morph.parse(w)[0].normal_form for w in words]

# Load laws
try:
    with open("laws.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        laws = data["laws"]
        last_updated = data["last_updated"]
except Exception as e:
    print(f"Error loading laws: {e}")
    laws = []
    last_updated = "Unknown"

# Prepare corpus for BM25
corpus = []
for law in laws:
    text = f"{law['title']} {law['content']}"
    corpus.append(tokenize(text))

if corpus:
    bm25 = BM25Okapi(corpus)
else:
    bm25 = None

@app.route("/api/laws", methods=["GET"])
def get_laws():
    return jsonify({
        "last_updated": last_updated,
        "laws": laws
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    user_query = request.json.get("query", "")
    if not user_query:
        return jsonify({"response": "Пожалуйста, введите ваш вопрос."})

    if not bm25:
        return jsonify({"response": "База данных законов пуста."})

    tokenized_query = tokenize(user_query)
    top_n = bm25.get_top_n(tokenized_query, laws, n=3)

    response_text = "--- АНАЛИЗ ЗАКОНОДАТЕЛЬСТВА PORTLAND ---\n\n"

    if top_n:
        response_text += "Найденные основания:\n"
        for i, doc in enumerate(top_n):
            response_text += f"• {doc['title']}\n"
            sentences = re.split(r'[.!?]\s+', doc['content'])
            relevant_sentences = []
            query_terms = set(tokenized_query)

            for s in sentences:
                s_tokenized = set(tokenize(s))
                if query_terms.intersection(s_tokenized):
                    relevant_sentences.append(s.strip())

            if relevant_sentences:
                snippet = " ".join(relevant_sentences[:2])
                if len(snippet) > 300: snippet = snippet[:300] + "..."
                response_text += f"  Цитата: {snippet}\n\n"

        response_text += "--- СТРАТЕГИЯ ЗАЩИТЫ ---\n"

        # Specific Logic for 17.1
        if "17.1" in user_query or "семнадцать один" in user_query.lower():
            response_text += "Для защиты по 17.1 УК (Посягательство на жизнь сотрудника) рекомендуется:\n"
            response_text += "1. Оспорить умысел: Было ли действие направлено именно на лишение жизни?\n"
            response_text += "2. Процессуальные ошибки: Проверьте стадию применения силы согласно ПК.\n"
            response_text += "3. Смягчающие: Была ли провокация со стороны гос. сотрудника?\n"
        elif "15.1" in user_query or "превышение" in user_query.lower():
            response_text += "Для защиты по 15.1 УК (Превышение полномочий):\n"
            response_text += "1. Проверьте, входил ли акт в должностные инструкции сотрудника.\n"
            response_text += "2. Был ли нанесен существенный вред правам граждан?\n"
        else:
            response_text += "Основываясь на найденных статьях, адвокату следует проверить:\n"
            response_text += "- Соблюдение процессуального кодекса при задержании.\n"
            response_text += "- Наличие доказательной базы (видеофиксация).\n"
            response_text += "- Правильность инкриминируемой статьи согласно составу преступления.\n"
    else:
        response_text = "К сожалению, я не нашел подходящих статей в базе законов Portland для формирования ответа."

    # Final emoji removal
    response_text = re.sub(r'[^\x00-\x7Fа-яА-ЯёЁ\s\.,!?;:-]', '', response_text)

    return jsonify({"response": response_text})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
