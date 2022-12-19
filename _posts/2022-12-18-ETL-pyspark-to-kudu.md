---
title: File and RDBMS to kudu using pyspark
date: 2022-07-18 12:33
author: Vikas Srivastava
category: [pyspark]
tags: [ETL type]
summary: This blogs is about the implimentation of ETL from files and RDBMS in pyspark
---

Here is a blog on extracting data from files and RDBMS (Relational Database Management System) and inserting it into Kudu using PySpark, along with sample code.

## **Introduction**
Kudu is a columnar storage manager developed for the Apache Hadoop ecosystem. It is designed to support low-latency random access as well as efficient analytical access patterns. One of the key features of Kudu is its support for fast insert, update, and delete operations, which makes it a good fit for use cases such as stream processing and real-time analytics.

In this blog, we will see how to extract data from different sources such as files and RDBMS, and insert it into Kudu using PySpark. We will be using the PySpark Kudu library, which provides a way to interface with Kudu from PySpark.

## **Extracting data from files**
PySpark provides several ways to read data from files, including text files, CSV files, and JSON files. Here is an example of how to read a CSV file and insert the data into Kudu:

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

# Create a SparkSession
spark = SparkSession.builder.appName("InsertIntoKudu").getOrCreate()

# Read the CSV file
df = spark.read.csv("path/to/file.csv", header=True)

# Insert the data into Kudu
df.write.format("kudu").mode("append").option("kudu.master", "kudu-master-host:7051").save()
```

In the above example, we create a SparkSession and read the CSV file using the `read.csv` method. Then, we use the `write` method to insert the data into Kudu using the `kudu` format. The `mode` option specifies whether to append the data to the existing data in Kudu or overwrite it. The `option` method is used to set the Kudu master host and port.

## **Extracting data from RDBMS**
To extract data from an RDBMS, we can use the jdbc method of the SparkSession to read the data as a DataFrame. Here is an example of how to read data from a MySQL database and insert it into Kudu:

```python
from pyspark.sql import SparkSession

# Create a SparkSession
spark = SparkSession.builder.appName("InsertIntoKudu").getOrCreate()

# Read the data from MySQL using the JDBC connector
df = spark.read.format("jdbc").option("url", "jdbc:mysql://mysql-host:3306/dbname").option("driver", "com.mysql.cj.jdbc.Driver").option("dbtable", "tablename").option("user", "username").option("password", "password").load()

# Insert the data into Kudu
df.write.format("kudu").mode("append").option("kudu.master", "kudu-master-host:7051").save()

```

In the above example, we use the `read.format` method to read the data from MySQL using the JDBC connector. The option method is used to pass the rdbms details along with driver and database name.
