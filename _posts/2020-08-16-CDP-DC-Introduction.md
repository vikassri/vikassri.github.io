---
layout: post
title: CDP-DC Introduction
date: 2020-08-16 09:57
category: [Technology, CDP]
author: Vikas Srivastava
tags: [cdpdc, introduction]
summary: Introduction of Cloudera CDP-DC
---

**Clouder Data Platform - Data center** is for customers looking for setting up on premise environment and are not ready yet for cloud or not looking for cloud now. It is an on-premise version of CDP-Public Cloud with limited service components available. Here is the official document from [cloudera](https://docs.cloudera.com/cloudera-manager/7.1.3/installation/topics/cdpdc-installation.html).

Its pretty much similar to CDH, Customer who already worked on CDH will have little more comfort on it than HDP customers. Its consist of below components

### Components
#### **Storage**
* HDFS and KUDO

#### **Compute**
* YARN

#### **Data Access**
* HIVE/IMPALA
* DAS/HUE

#### **Operationa DB**
* HBASE & PHOENIX

#### **Data Science**
* SPARK & ZEPPELIN

#### **Security**
* RANGER
* KERBEROS & TLS

#### **Governance**
* ATLAS

#### **Job Management**
* Oozie

#### **Streaming**
* KAFKA
* SMM (Stream Messaging Manager)
* SRM (Stream Replication Manager)
* SR (Schema Registry)

#### **Installation**
CDP-DC Installation is pretty much similar to other CDH versions. You need to install Cloudera Manager and add the CDP DC parcels on it. Detailed Installation steps is give [here](../../posts/CDP-DC-Installation)

#### **Requirement**
As many of you already aware public version will come with 6O days trial and Express one you need to buy as binaries are behind paywall.

#### **Templates**
CDP-DC comes with many pre-baked templates like below, You can add service on top of these templates or create custom templates as well.

##### **Data Engineering**
**Services included** : Spark, Oozie, Hive on Tez, Data Analytics Studio, HDFS, YARN, and YARN Queue Manager.

##### **Spark**
**Services included** : Core Configuration, Spark, Oozie, YARN, and YARN Queue Manager.

##### **Data Mart**
**Services included** : Core Configuration, Impala, and Hue.

##### **Streams Messaging (Simple)**
**Services included** : Kafka, Schema Registry, and Zookeeper.

##### **Streams Messaging (Full)**
**Services included** : Kafka, Schema Registry, Streams Messaging Manager, Streams Replication Manager, Cruise Control, and Zookeeper.