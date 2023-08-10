---
title: Implement a Huggingface with Gradio - A Step-by-Step Guide  
date: 2023-06-30 11:33
author: Vikas Srivastava
category: [Deep Learning, HuggingFaceHub, Gradio]
tags: [LLM, HuggingFaceHub]
summary: This blogs is about implementing the hugging face model with gradio on Mac
---

Hi All, I will be implementing the [huggingface](https://huggingface.co/) model with [gradio](https://www.gradio.app/) app. I will be using downloading the huggingface model using python script and then using the same model to implement in gradio.

## Download the model
Here is the python script to download the huggingface model

```python
from huggingface_hub import hf_hub_download

# load the hugging face mode
HUGGINGFACEHUB_API_TOKEN = "<token>"

# download model files
def download_model(model_id):
    filenames = [ "pytorch_model.bin", "added_tokens.json", "config.json", "generation_config.json",
        "special_tokens_map.json", "spiece.model", "tokenizer_config.json"]

    for filename in filenames:
        downloaded_model_path = hf_hub_download(
            repo_id=model_id,
            filename=filename,
            token="HUGGINGFACEHUB_API_TOKEN"
        )
        print("Downloaded model file:", downloaded_model_path)

# main 
if __name__=='__main__':
    model_id = "lmsys/fastchat-t5-3b-v1.0"
    download_model(model_id)
```

Above model will be downloaded into the ~/.cache folder by default, HF will use the model from this cache dirctory.

## Usage
Here is the sample python code for 

```python
from langchain.llms import HuggingFacePipeline
from langchain import PromptTemplate, LLMChain
import gradio as gr

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

# ask function 
def ask_question(question):
    result = llm_chain(question)
    return result['text']

iface = gr.Interface(ask_question, inputs=gr.Textbox(lines=2, placeholder="Question Here..."), outputs="text")
iface.launch(server_port=8081)
```

execute this code as below

```shell
gradio app.py
```

you can see the gradio app running on the url: `http://127.0.0.1:8081`, you can ask any question and you will see the results like below

![image](../../resource/others/hf.png)

Thanks and Happy Learning !!