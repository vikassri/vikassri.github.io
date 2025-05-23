---
title: Demystifying LLMs - Key Terms, Architecture, and How It All Works
date: 2025-04-10 20:30
author: Vikas Srivastava
category: [Deep Learning, GenAI, LLM, RAG]
tags: [LLM, GenAI, RAG, Machine Learning]
summary: Terms and Concepts in LLM
---

# 🧠 Demystifying LLMs: Key Terms, Architecture, and How It All Works

Large Language Models (LLMs) like GPT-4, Claude, and LLaMA have revolutionized how we build smart applications—from AI assistants to knowledge search engines and even autonomous agents. But with all the buzzwords flying around, it’s easy to get lost.

In this post, I’ll break down the **core technical terms**, explain their role in **LLM-powered applications**, and give you a visual tour of the typical **LLM architecture** used in real-world projects.

---

## 🔑 Core Concepts

Let’s start with the basics you’ll see across almost every LLM discussion.

- **LLM (Large Language Model):** A neural network trained on massive text corpora to understand and generate human-like language.
- **Token:** A chunk of text, often a word or subword, that the model processes.
- **Prompt:** The input text you give the model.
- **Completion:** The model’s generated response.
- **Context Window:** How much input (in tokens) the model can “see” at one time.
- **Inference:** The act of generating output from the model using new input.

---

## 🛠️ Model Architecture & Training Terms

To understand how LLMs work, it helps to know the architecture they’re built on.

- **Transformer:** The underlying architecture used by almost all modern LLMs.
- **Attention / Self-Attention:** Mechanisms that help the model focus on the most relevant parts of the input when generating output.
- **Pretraining:** The initial phase of training on large-scale general data (e.g., books, web pages).
- **Fine-tuning:** Customizing the model further for a specific task or domain.
- **LoRA (Low-Rank Adaptation):** A lightweight way to fine-tune models without updating all parameters.
- **Quantization:** Compressing the model by using lower-precision numbers to save space and speed up inference.

---

## 🧠 Memory & Context Handling

LLMs don't inherently have memory—they just work within their context window. But apps can give them "memory" externally.

- **Memory:** External data stores that allow LLMs to remember information across turns or sessions.
- **Short-term Memory:** The conversation history within the current session.
- **Long-term Memory:** Information persisted across multiple sessions for personalization or task continuity.

---

## 🔍 Retrieval-Augmented Generation (RAG) & Embeddings

To make LLMs more factual and scalable, we often pair them with retrieval systems.

- **RAG (Retrieval-Augmented Generation):** A method that retrieves external documents and injects them into the prompt to improve accuracy.
- **Embedding:** A vector (list of numbers) that represents the semantic meaning of text.
- **Vector Database:** A database (like Pinecone, Weaviate, or FAISS) that stores embeddings and enables semantic search.
- **Semantic Search:** Finding content based on meaning rather than keyword matching.

---

## 🧪 Prompt Engineering Techniques

Prompting is both an art and a science. Here are a few key strategies:

- **Prompt Engineering:** Designing prompts to guide the model toward desired behavior.
- **Zero-shot Learning:** Asking the model to perform a task without examples.
- **Few-shot Learning:** Giving a few examples to help the model learn a pattern.
- **Chain of Thought (CoT):** Asking the model to reason step-by-step.
- **System Prompt:** A behind-the-scenes message used to define personality or rules in API-based models.

---

## ⚙️ Deployment & Optimization Terms

When deploying LLMs at scale, these performance concepts matter:

- **Latency:** Time it takes to get a response.
- **Throughput:** How many requests the system can handle per second.
- **Batching:** Grouping requests together to improve processing efficiency.
- **Streaming:** Delivering model output token by token, as it's generated.
- **Caching:** Reusing previously generated outputs for speed.

---

## 🧩 Other Common Terms

- **Hallucination:** When a model generates false or fictional information.
- **Grounding:** Tying model outputs to verified facts or sources.
- **API (Application Programming Interface):** The interface for accessing LLMs (like OpenAI’s API).
- **Agents:** LLM-powered systems with tools and memory that can take actions and make decisions.
- **Tool Use:** Letting an LLM call external tools (e.g., calculator, database, web search) to improve capabilities.

---
## 🏗️ Typical LLM Application Architecture

Here’s a visual snapshot of a modern LLM-powered app, combining memory, embeddings, and external tools using a Retrieval-Augmented Generation (RAG) approach:

![LLM Architecture](../resource/others/llm.png)


### Flow Overview:

1. **User input →** converted into an **embedding**.
2. **Embedding →** used to query a **vector database** for relevant content.
3. Retrieved documents + original input → sent to the **LLM**.
4. LLM generates a grounded, context-rich **response**.
5. Optional: **Memory** stores conversation history or user data.

---

## 🚀 Wrapping Up

Whether you're building an AI assistant, knowledge search tool, or autonomous agent, understanding these concepts is key to working effectively with LLMs.
