---
layout: post
title: Settting up pyspark development on vscode (Mac)
date: 2020-07-25 20:09
category: [Technology, Pyspark]
author: Vikas Srivastava
tags: [vscode, pyspark]
summary: setting up pyspark on vscode
---

Sometime its very tricky to set up pyspark on vscode, today I will be doing the same and document this for all of us. Below are the steps we need to follow.

#### **Steps:**
* Installation of apache-spark
* Installation of vscode
* Setting of pyspark on vscode

#### **Requirement:**
- Java 1.8+ 
- scala / python 3 

## **Installation of apache-spark**

Below are the steps for auto installation using brew, you can use this or you can download the spark from [here](https://spark.apache.org/downloads.html){:target='_blank'}. Once you downlaod you and untar at any place and setup spark home. 

```bash
# using brew
brew install scala
brew install apache-spark

# download from spark
wget https://www.apache.org/dyn/closer.lua/spark/spark-3.0.0/spark-3.0.0-bin-hadoop2.7.tgz
tar -C /Users/vssrivastava/Install/ xvfz spark-3.0.0-bin-hadoop2.7.tgz
```
Now you need to add spark home directory into your `.bash file` 

```bash
# If you have manually installed it 
export SPARK_HOME=/Users/vssrivastava/Install/spark-3.0.0-bin-hadoop2.7
export PATH=$SPARK_HOME/bin:$PATH

# If installed using brew
export SPARK_HOME=/usr/local/Cellar/apache-spark/3.0.0/libexec
export PATH=$SPARK_HOME/bin:$PATH
```

## **Installation of vscode**

**Visual Code Studio** is now most used IDE among developer community. I personally used it for almost everything. Its developed by Microsoft and its free for community use. You can download it from [here](https://code.visualstudio.com/){:target="_blank"}  

![vscode](../../resource/others/vscode.jpg)


## **Setting of pyspark on vscode**

Generally you need to use `findspark` to find the spark but you need to keep it before the full code. 

```python
import findspark
findspark.init()

from pyspark.sql import SparkSession
```
But there is a better way to do this, in that case you don't need to add findspark or install it. You need to set up environment variable in the vscode. Let's add the variable in vscode

`code -> preference -> setting -> {search for 'ENV: Osx'} -> edit the setting.json`  

add below lines

```json
"terminal.integrated.env.osx": {
    "SPARK_HOME": "/usr/local/Cellar/apache-spark/3.0.0/libexec"
  }
```

Once you add above lines restart the vscode and test it, Before writing code all you need to do is to download pyspark package

```bash
conda install -c conda-forge pyspark

or

pip install pyspark
```

![code](../../resource/others/code.jpg)

I hope, You all have successfully setup the vscode with spark development. Let me know if you face any issues or have any doubts.

Happy Learning !!