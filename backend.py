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
    # Preserving dots in numbers (e.g., 17.1) for better legal search
    words = re.findall(r'\w+(?:\.\w+)*', text.lower())
    tokens = []
    for w in words:
        if re.match(r'^\d+(\.\d+)*$', w):
            tokens.append(w) # Keep numbers as is
        else:
            tokens.append(morph.parse(w)[0].normal_form)
    return tokens

# Load laws
try:
    with open("laws.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        laws = data.get("laws", [])
        last_updated = data.get("last_updated", "Unknown")
except Exception as e:
    print(f"Error loading laws: {e}")
    laws = []
    last_updated = "Unknown"

corpus = []
for law in laws:
    # Adding title multiple times to boost its weight
    text = f"{law['title']} {law['title']} {law['content']}"
    corpus.append(tokenize(text))

bm25 = BM25Okapi(corpus) if corpus else None

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "message": "Majestic Laws Backend is running",
        "endpoints": ["/api/laws", "/api/chat"]
    })

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
    # Perform search
    top_n = bm25.get_top_n(tokenized_query, laws, n=3)

    response_text = "--- АНАЛИЗ ЗАКОНОДАТЕЛЬСТВА PORTLAND ---\n\n"
    if top_n:
        response_text += "Найденные основания:\n"
        for doc in top_n:
            response_text += f"• {doc['title']}\n"
            sentences = re.split(r'[.!?]\s+', doc['content'])
            relevant_sentences = [s.strip() for s in sentences if set(tokenize(s)).intersection(set(tokenized_query))]
            snippet = " ".join(relevant_sentences[:2]) if relevant_sentences else doc['content'][:300]
            if len(snippet) > 300: snippet = snippet[:300] + "..."
            response_text += f"  Цитата: {snippet}\n\n"

        response_text += "--- СТРАТЕГИЯ ЗАЩИТЫ ---\n"
        # Check for specific articles in query
        if any(art in user_query for art in ["17.1", "17.1 УК"]):
            response_text += "Защита по 17.1 УК: Упирайте на отсутствие прямого умысла и нарушение стадий применения силы гос. служащим.\n"
        elif any(art in user_query for art in ["15.1", "15.1 УК"]):
            response_text += "Защита по 15.1 УК: Проверьте наличие видеофиксации нарушения и законность требования.\n"
        else:
            response_text += "Проверьте соблюдение Процессуального Кодекса, наличие видеофиксации и соответствие статьи составу преступления.\n"
    else:
        response_text = "Статьи не найдены."

    # Strip emojis but keep bullet points
    response_text = re.sub(r'[^\x00-\x7Fа-яА-ЯёЁ\s\.,!?;:•-]', '', response_text)
    return jsonify({"response": response_text})

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Not Found",
        "message": f"The path {request.path} was not found on this server.",
        "available_endpoints": ["/", "/api/laws", "/api/chat"]
    }), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
