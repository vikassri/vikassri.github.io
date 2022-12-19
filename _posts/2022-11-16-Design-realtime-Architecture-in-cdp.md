
---
title: Designing A realtime architecture using CDP 
date: 2021-12-18 12:33
author: Vikas Srivastava
category: [Realtime Design]
tags: [ETL]
summary: This blogs is about the Desigining Realtime Archiecture using CDP
---

Designing a real-time architecture to bring data from different sources and ingest it into Hadoop can be a complex task, especially when using a variety of tools and components. However, with the right architecture in place, you can ingest and process data in real-time, enabling you to make more informed and timely business decisions.

In this blog, we will explore how to design a real-time architecture to bring data from different sources and ingest it into Hadoop using Cloudera Data Platform (CDP) components like NiFi, Kafka Streams, Spark, and Flink.

## **Set up a Cloudera cluster** 
The first step in setting up a real-time architecture is to set up a Cloudera cluster. Cloudera is a popular distribution of Hadoop that includes a range of tools for storing, processing, and analyzing large amounts of data. When setting up a Cloudera cluster, you will need to choose the hardware and software components that will be used, as well as configure the cluster to meet your specific needs.

## **Install the necessary components**
Once you have set up your Cloudera cluster, you will need to install the necessary components for collecting, storing, and processing data in real-time. This will typically include tools such as NiFi, Kafka, Spark, and Flink.

- NiFi is a dataflow management tool that can be used to collect data from various sources and route it to the appropriate destination.
- Kafka is a distributed message queue that can be used to store the collected data.
- Spark is a powerful framework for processing and analyzing large amounts of data in real-time.
- Flink is a real-time stream processing engine that can be used to perform complex transformations on data streams.

## **Set up NiFi dataflows** 
After installing the necessary components, you will need to set up NiFi dataflows on the edge nodes of your Cloudera cluster. These dataflows can be configured to listen for data on specific ports or to pull data from specific locations, depending on your needs. Once the NiFi dataflows are in place, they can be used to collect data from the various sources and send it to Kafka for storage.

## **Use Kafka to create a message queue** 
As the NiFi dataflows collect data from the various sources, they can send it to Kafka topics as it is received. Kafka acts as a message queue, storing the data until it is ready to be processed. By using Kafka, you can ensure that the data is stored in a reliable and scalable manner, even if the volume of data being collected is high.

## **Use Kafka Streams or Flink to process data in real-time** 
Once the data is stored in Kafka, you can use Kafka Streams or Flink to process it in real-time. Kafka Streams is a library for building real-time data processing applications on top of Kafka, while Flink is a real-time stream processing engine that can be used to perform complex transformations on data streams.

## **Use Spark to perform real-time analytics** 
After the data has been processed, you can use Spark to perform real-time analytics on it. Spark is a powerful framework for performing real-time analytics on large amounts of data, and it can be used to run complex queries, build machine learning models, and more.

Use Cloudera Manager to monitor and manage the cluster: Finally, you can use Cloudera Manager to monitor and manage



