import fitz
import chromadb
from chromadb.utils import embedding_functions
from groq import Groq
from django.conf import settings

client = Groq(api_key=settings.GROQ_API_KEY)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
embedding_fn  = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

SYSTEM_PROMPT = """
Tu es StudyBuddy, un tuteur IA expert et pédagogue.
Ton rôle est d'aider les étudiants à vraiment COMPRENDRE, pas juste à lire.
Règles :
- Toujours expliquer le POURQUOI, pas juste le QUOI
- Utiliser des exemples concrets quand c'est possible
- Structurer les réponses clairement
- Adapter le niveau à un étudiant universitaire
- Être encourageant mais rigoureux
- Baser tes réponses uniquement sur le contexte fourni
"""

def extract_chunks(file, chunk_size=500):
    pdf       = fitz.open(stream=file.read(), filetype="pdf")
    full_text = "".join(page.get_text() for page in pdf)
    chunks, start, overlap = [], 0, 50
    while start < len(full_text):
        chunks.append(full_text[start:start + chunk_size].strip())
        start += chunk_size - overlap
    return [c for c in chunks if len(c) > 50]

def store_chunks(session_id, chunks):
    col = chroma_client.get_or_create_collection(
        name=f"session_{session_id}",
        embedding_function=embedding_fn
    )
    try:
        existing = col.get()
        if existing["ids"]:
            col.delete(ids=existing["ids"])
    except Exception:
        pass
    col.add(
        documents=chunks,
        ids=[f"{session_id}_{i}" for i in range(len(chunks))],
        metadatas=[{"session_id": session_id} for _ in chunks]
    )
    return len(chunks)

def retrieve_chunks(session_id, query, n=5):
    try:
        col     = chroma_client.get_collection(
            name=f"session_{session_id}",
            embedding_function=embedding_fn
        )
        results = col.query(query_texts=[query], n_results=n)
        return "\n\n".join(results["documents"][0])
    except Exception:
        return ""

def generate_with_rag(session_id, query, output_type="answer",variation=1):
    client = Groq(api_key=settings.GROQ_API_KEY) 
    context = retrieve_chunks(session_id, query)
    if not context:
        return "Aucun document trouvé. Veuillez d'abord uploader un PDF."

    prompts = {

        "answer": f"""Contexte du document :
{context}

Question de l'étudiant : {query}

Réponds de façon pédagogique et détaillée :
1. Donne une réponse directe et claire
2. Explique le concept en profondeur avec le POURQUOI
3. Donne un exemple concret si possible
4. Résume en une phrase clé à retenir""",

        "summary": f"""Contexte du document :
{context}

Génère un résumé pédagogique structuré EXACTEMENT dans ce format :

## Vue d'ensemble
[2-3 phrases qui expliquent de quoi parle le document et son objectif principal]

## Concepts clés
[Liste des 4-6 concepts les plus importants avec une explication de chacun]

## Points essentiels à retenir
[3-5 points critiques que l'étudiant doit absolument comprendre et retenir]

## Ce que ça implique
[Implications pratiques ou applications de ce contenu]""",

        "diagram": f"""Contexte du document :
{context}

Génère DEUX choses dans cet ordre exact :

1. Un diagramme Mermaid valide qui représente visuellement la structure des concepts.
Utilise graph TD pour les hiérarchies ou flowchart LR pour les processus.
Commence par ```mermaid et termine par ```.
Assure-toi que les labels sont clairs et en français.

2. Après le diagramme, une section "## Explication du diagramme" qui explique :
- Ce que représente chaque nœud principal
- Ce que signifient les connexions entre eux
- Comment lire et interpréter ce diagramme

Exemple de format attendu :
```mermaid
graph TD
    A[Concept Principal] --> B[Sous-concept 1]
    A --> C[Sous-concept 2]
    B --> D[Détail]
```
## Explication du diagramme
- **Concept Principal** représente...
- La flèche vers **Sous-concept 1** signifie...""",

        "workflow": f"""Contexte du document :
{context}

Génère DEUX choses dans cet ordre exact :

1. Un diagramme Mermaid de workflow séquentiel valide.
Utilise sequenceDiagram ou flowchart TD selon ce qui est le plus adapté.
Commence par ```mermaid et termine par ```.
Chaque étape doit avoir un label court et clair.

2. Après le diagramme, une section "## Détail des étapes" qui pour CHAQUE étape explique :
- Ce qui se passe concrètement
- Pourquoi cette étape est importante
- Ce qui se passerait si on la sautait

Exemple de format attendu :
```mermaid
flowchart TD
    A[Étape 1] --> B[Étape 2]
    B --> C[Étape 3]
```
## Détail des étapes
**Étape 1 :** Explication de ce qui se passe...
**Pourquoi ?** Parce que...
**Si on la saute :** ...""",
    }

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system",  "content": SYSTEM_PROMPT},
            {"role": "user",    "content": prompts.get(output_type, prompts["answer"])}
        ],
        temperature=0.4,
        max_tokens=3000
    )
    return response.choices[0].message.content

def delete_session_chunks(session_id):
    try:
        chroma_client.delete_collection(f"session_{session_id}")
    except Exception:
        pass