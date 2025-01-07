---
title: SCD2 Implementation in pyspark
date: 2022-06-17 12:33
author: Vikas Srivastava
category: [pyspark]
tags: [scd2 type]
summary: This blogs is about the implimentation of SCD2 in pyspark
---

Here is the sample code for implementing the scd2 in pyspark

**SCD (Slowly Changing Dimension)** is a type of data modeling that is used to manage changes in dimension data over time. In an SCD2 implementation, data changes are tracked using two separate columns in the dimension table, one for the current value of the data and one for the previous value.

Here is an example of a PySpark pipeline that performs ETL and implements a type 2 slowly changing dimension (SCD) using the merge operation. This pipeline reads data from a source table, transforms the data, and then writes the transformed data back to a target table, while keeping a history of changes to the target table using a version column.

First, let's import the necessary libraries and create a SparkSession:

```python
from pyspark.sql import SparkSession

spark = SparkSession \
    .builder \
    .appName("ETL Pipeline") \
    .getOrCreate()
```

Next, we can define the source and target tables, and read the data from the source table into a DataFrame:

```python
# Define the source and target tables
source_table = "source_database.source_table"
target_table = "target_database.target_table"

# Read the data from the source table
df = spark.read.format("jdbc").options(
    url=f"jdbc:postgresql://localhost:5432/{source_database}",
    driver="org.postgresql.Driver",
    dbtable=source_table,
    user="user",
    password="password"
).load()
```

Now, we can perform the necessary transformations on the data using PySpark's DataFrame API. For example:

```python
# Select only the relevant columns
df = df.select(["id", "name", "description"])

# Rename the columns
df = df.withColumnRenamed("id", "product_id")
df = df.withColumnRenamed("name", "product_name")
df = df.withColumnRenamed("description", "product_description")

# Add a version column to track changes to the data
df = df.withColumn("version", lit(1))
```

Finally, we can implement the SCD type 2 by using the merge operation to update the target table with the transformed data, while keeping a history of changes by incrementing the version column.

```python
# Create a temporary view of the dataframe
df.createOrReplaceTempView("temp_table")

# Use the merge operation to update the target table
spark.sql(f"""
    MERGE INTO {target_table} t
    USING temp_table s
    ON t.product_id = s.product_id
    WHEN MATCHED AND t.product_name <> s.product_name OR t.product_description <> s.product_description THEN
      UPDATE SET t.product_name = s.product_name,
                 t.product_description = s.product_description,
                 t.version = t.version + 1
    WHEN NOT MATCHED THEN
      INSERT (product_id, product_name, product_description, version)
      VALUES (s.product_id, s.product_name, s.product_description, 1)
""")
```

This pipeline will perform the necessary ETL and update the target table with the transformed data, while keeping a history of changes to the data using the version column. You can modify this pipeline to fit your specific needs and add additional transformations as needed.