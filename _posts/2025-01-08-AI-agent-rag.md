---
title: Building AI Agents with Contextual Knowledge Retrieval- A Detailed Guide with Sample Code
date: 2025-01-08 19:30
author: Vikas Srivastava
category: [Deep Learning, GenAI, LLM, AI Agents]
tags: [LLM, GenAI, AI Agents, Machine Learning]
summary: Building AI Agents with Contextual Knowledge Retrieval
---

Artificial Intelligence (AI) agents have revolutionized the way we interact with information. Modern AI agents combine language models with knowledge bases, enabling them to retrieve relevant facts and context before responding to queries. This process is often referred to as **Retrieval-Augmented Generation (RAG)**, where agents can fetch relevant data dynamically and use it to enhance their responses.

In this blog post, we will walk through a hands-on example of building an AI agent using the phi library. Specifically, we’ll use:
1. A vector database (pgvector) for efficient similarity search.
2. A PDF knowledge base for storing document embeddings.
3. An OpenAI-based language model for generating responses.

Requirements

Before diving into the code, ensure you have the following prerequisites installed:
- Python 3.x
- phi library
- PostgreSQL with pgvector extension
- psycopg2 for database connection

## Step 1: Setting Up the Knowledge Base

AI agents need a repository of knowledge to answer questions effectively. Here, we use two types of knowledge bases:
1.	**PDF URL Knowledge Base** – Extracts content from online PDFs and stores embeddings.
2.	**Local PDF Knowledge Base** – Loads PDFs from a local directory.

The knowledge bases are backed by a **pgvector** database, which performs similarity searches on document embeddings.

Here’s the code to set up both knowledge bases:

### Run the postgres docker for knowled base database
```bash
docker run -d 
  -e POSTGRES_DB=ai 
  -e POSTGRES_USER=ai 
  -e POSTGRES_PASSWORD=ai 
  -e PGDATA=/var/lib/postgresql/data/pgdata 
  -v pgvolume:/var/lib/postgresql/data 
  -p 5532:5432 
  --name pgvector 
  phidata/pgvector:16
```
### Install the required python libraries

```bash
pip install phidata -U pgvector pypdf "psycopg[binary]" sqlalchemy
```
###  Python code for knowledgebase
```python
from phi.knowledge.pdf import PDFUrlKnowledgeBase, PDFKnowledgeBase
from phi.vectordb.pgvector import PgVector, SearchType

# PostgreSQL connection URL
db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

# Create a knowledge base from a remote PDF URL
knowledge_base_url = PDFUrlKnowledgeBase(
    urls=["https://phi-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=PgVector(table_name="recipes", db_url=db_url, search_type=SearchType.hybrid),
)

# Load the knowledge base from URL
knowledge_base_url.load(upsert=True)

# Create a knowledge base from local PDFs in the "data/pdfs" directory
knowledge_base = PDFKnowledgeBase(
    path="data/pdfs",
    vector_db=PgVector(table_name="datalake", db_url=db_url)
)

# Load the local knowledge base
knowledge_base.load(upsert=True)
```

**Explanation**:
1.	**PDFUrlKnowledgeBase**: Initializes a knowledge base by downloading the specified PDF and creating vector embeddings.
2.	**PgVector**: Connects to a PostgreSQL database with the pgvector extension, enabling vector similarity search.
3.	**load(upsert=True)**: Loads the documents into the vector database and updates existing entries if necessary.

## Step 2: Creating an AI Agent

Once the knowledge base is ready, we can create an AI agent that uses a language model to answer user queries. The agent will use the knowledge base for context-aware responses.

### Python code for creating an agent and getting response
```python
from phi.agent import Agent
from phi.model.openai import OpenAIChat

# Create an AI agent with the OpenAI model and the loaded knowledge base
kb_agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=knowledge_base,
    add_context=True,   # Enables RAG by including relevant knowledge in prompts
    search_knowledge=False,  # Disables default knowledge search, since we handle it via RAG
    markdown=True       # Formats responses in Markdown for better readability
)

# Example queries to the agent
kb_agent.print_response("How do I make chicken and galangal in coconut milk soup?")
kb_agent.print_response("What is deltalake?", stream=True)
```

**Explanation**:
1.	**Agent**: This class orchestrates the interaction between the language model and the knowledge base. It can perform RAG by adding context from the knowledge base before generating a response.
2.	**OpenAIChat**: Specifies the language model to be used (in this case, a GPT-based model).
3.	**add_context=True**: This flag ensures that relevant information from the knowledge base is appended to the user query before it’s sent to the language model.
4.	**print_response()**: Sends a query to the agent and prints the response. The stream=True option streams the response in real-time.

## Step 3: Running the Code
1.	Start PostgreSQL and ensure the pgvector extension is enabled.
2.	Run the script. On the first run, the PDF knowledge bases will be loaded, and embeddings will be created in the database.
3.	Once the knowledge bases are loaded, you can interact with the AI agent by asking questions.

### Sample Output
Here’s what you can expect when querying the agent:

**Query**:
How do I make chicken and galangal in coconut milk soup?

![alt text](<../../resource/others/deltalake.jpg>)


**Query**:
What is deltalake?

**Response**:
![alt text](<../../resource/others/deltalake.jpg>)

**Conclusion**

By combining a language model with a vector-backed knowledge base, we can build powerful AI agents that provide accurate, context-aware responses. This approach is highly scalable and can be adapted to various domains, such as healthcare, legal research, and technical documentation.

If you’d like to extend this example, consider:
- Using different types of knowledge bases (e.g., SQL databases, CSV files).
- Improving the search logic by fine-tuning the vector similarity parameters.
- Adding custom prompts or templates for specific types of queries.
