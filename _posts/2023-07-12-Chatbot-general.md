---
title: Chatbot by using Huggingface Model with Gradio
date: 2023-07-13 23:33
author: Vikas Srivastava
category: [Deep Learning, HuggingFaceHub, Gradio, chatbot]
tags: [LLM, HuggingFaceHub]
summary: Creating a chatbot using HF model
---

Hello Readers, Today i will be write blog to create a sample chatbot in few lines of code, I have previously wrote a blog about implementing the Huggingface model with gradio, it contains the method of downloading the model from huggingfacehub and use it.

In this blog i will be using the same model to implement the chatbot in gradio.

## setup
Download the model using the python script given in the previous blog, check out the [blog](https://www.vikassri.com/posts/HuggingFace-Gradio/)

Once you download the same model, you can check the mode and its file under .cache folder in your home directory, It about 6.2 GB in total.

```shell
vikassrivastava@vikasmac ~$ ll  ~/.cache/huggingface/                                                                                                                                         
total 8
drwxr-xr-x  19 vikassrivastava  staff   608B Aug 10 20:01 hub
drwxr-xr-x   4 vikassrivastava  staff   128B Jul  2 16:14 modules
-rw-r--r--   1 vikassrivastava  staff    37B Jul 11 17:14 token
vikassrivastava@vikasmac ~$ du -sh  ~/.cache/huggingface/hub/models--lmsys--fastchat-t5-3b-v1.0                                                                                               
6.2G    /Users/vikassrivastava/.cache/huggingface/hub/models--lmsys--fastchat-t5-3b-v1.0                    
```
## Code
Here is the sample python code to use it 

```python
import gradio as gr
from langchain.llms import HuggingFacePipeline
from langchain import PromptTemplate, LLMChain

def ask_question(question, history):
    model_id = "lmsys/fastchat-t5-3b-v1.0"
    llm = HuggingFacePipeline.from_model_id(model_id=model_id, task="text2text-generation",
        model_kwargs={"temperature": 0, "max_length": 1000})

    # define template 
    template = """
    You are a friendly chatbot assistant that responds conversationally to users' questions.
    Keep the answers short, unless specifically asked by the user to elaborate on something.

    Question: {question}

    Answer:"""

    # create prompt
    prompt = PromptTemplate(template=template, input_variables=["question"])

    # llm chain
    llm_chain = LLMChain(prompt=prompt,llm=llm)

    result = llm_chain(question)
    return result['text'].replace("<pad>","")


if __name__=='__main__':
    demo = gr.ChatInterface(ask_question)
    demo.launch()
```

## Demo

Launch the gradio app by using below command
```shell
gradio app.py
```
Now you can chat with your model like below

![image](../../resource/others/chat.jpeg)

Happy Leaning !!!