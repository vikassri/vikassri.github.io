---
title: SCD2 Implementation in pyspark
date: 2022-12-17 12:33
author: Vikas Srivastava
category: [pyspark]
tags: [scd2 type]
summary: This blogs is about the implimentation of SCD2 in pyspark
---

Here is the sample code for implementing the scd2 in pyspark

**SCD (Slowly Changing Dimension)** is a type of data modeling that is used to manage changes in dimension data over time. In an SCD2 implementation, data changes are tracked using two separate columns in the dimension table, one for the current value of the data and one for the previous value.

Here is an example of how you might implement SCD2 in PySpark, a popular Python library for working with large datasets:

- Begin by reading the data from the source system into a PySpark DataFrame. -->
- Next, join the data from the source system with the current data in the dimension table using the primary key of the dimension table as the join key.
- Use the PySpark functions when and otherwise to compare the data in the source system to the current data in the dimension table, and create a new column with a flag indicating whether the data has changed.
- Use the when function again to create a new DataFrame with the updated data for the dimension table. This DataFrame should include the primary key, the current value, and the previous value of the data.
- Use the merge function to merge the updated data with the existing dimension table, using the primary key as the join key.

Here is an example of how this might look in PySpark:

```python
# Read data from source system into a DataFrame
df_source = spark.read.format("csv").option("header", "true").load("/path/to/source/data.csv")

# Join the source data with the current data in the dimension table
df_join = df_source.join(df_dimension, on=["primary_key"], how="inner")

# Create a new column with a flag indicating whether the data has changed
df_join = df_join.withColumn("data_changed", when(df_join.source_column != df_join.dimension_column, 1).otherwise(0))

# Create a new DataFrame with the updated data for the dimension table
df_update = df_join.select(
    "primary_key",
    when(df_join.data_changed == 1, df_join.source_column).otherwise(df_join.dimension_column).alias("current_value"),
    df_join.dimension_column.alias("previous_value")
)

# Merge the updated data with the existing dimension table
df_dimension = df_dimension.merge(df_update, on=["primary_key"], how="left")

```