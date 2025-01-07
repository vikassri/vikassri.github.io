---
layout: post
title: CDP Public Cloud Introduction
date: 2020-09-08 10:12
category: [Technology, CDP]
author: Vikas Srivastava
tags: [cdpdc, public cloud]
summary: CDP Public Cloud
---

CDP Public cloud is SAAS provided by cloudera, As of now available on AWS and Azure. You can read more on [Cloudera Doc](https://docs.cloudera.com/cdp/latest/index.html)


### **Important Terms**
**Environment** : It's a logical division of regions, Where each environment is set up in one region with VPN. Cutomer needs to create environment before provisioning any resources becoz each cluster should be associated with environment. Customer can have as many as environment they need depend on region requirement

Each Environment consist of below components
* Shared DataLake
  * Automatically deployed while createing environment.
  * Provide Secured access to workload clusters.
  * It consists of security and governance of workload clusters.
  * Datalake {no customer data but security and governess of data}
    - Runs CM, Atlas, Ranger, FreeIPA, Knox(ID Broker)
    - Metadata, Policies, Audit Data etc stored externally
* Storage
  * Its required for storing the logs and other persistance data.
  * Seperate from compute to provide flaxibility
  * Either S3 or ADLS as of now.
* RDS
  * Database is required to store the metadata informations.
* Roles and Policies
  * Provide the Management Console to create resources in the environment.
* Users and ID Broker
  * User who can access the cluster and perform certain task
  * ID broker to map the user with different roles availble

### MAIN COMPONENTS

**Control Plane (couldera Provided cloud account)**
* Management Console
* Replication Manager
* WorkLoad Manager
* Data Catalog

**Compute Plane (customer provided cloud account)**
* DataHub Cluster
  - Workload deployed quickly for specific workload
* Cloudera Data Warehouse (CDW)
  - Database Catalog
  - Virtual Warehouse
* Cloudera Machine Learning (CML)
  - provide access to machine learning
* Data Engineering
* Operational Database


#### **Management Console**
- It is the main screen which have all the admin level controls available.
- Like registering environment, User Management
- Dashboard
- DataLake
- Data Warehouse, ML workspace and Datahub Cluster

#### **Replication Manager**
- It is used for copying the data from one cluster to another. It can be classic cluster to cloud cluster or other way around.
- You can create different policies and Jobs
- You can schedule the jobs to run periodically to copy data.
- Replicate data between
  - Hive
  - Hbase
  - Hdfs

#### **WorkLoad Manager**
- Its one of the best components available in CDP
- You can register cluster for getting the insight of worksload running on it
- You can analyze the jobs running on attached clusters and get the recommendation and check the issue/insights of the jobs running.

#### **Data Catalog**
- Its collection of catalogs create with differents table and databases (assets)
- you can create multiple catalogs and tagged them to different names

#### **DataHub Cluster**
- This is based on underlike Datalake associated with environment
- Inherits the restriction and rules from Datalake
- Datahub clusters are specific to certain usecase, workload. 
- Customer can use it to run the different templates like Data Engineering, Data Flow, Data Mart etc
- Templates are nothing but a bundle of services which used for implementing the use case
  - *Data Engineering* : This consist of hive, hdfs, yarn, zookeeper
  - *Data Mart* : Impala, Hue

#### **Cloudera Data Warehouse**
- As CDW is nothing but data warehouse implementaion, which consist of 
  - *Database Catalog* : Base catalog consists of metadata of datalake and if you make any changes to default catalog it refelects to datalake as well. One can create multiple catalogs and attach virtual environment to it. You cannot delete defualt database catalog.
  - *Virtual warehouse* : It is a processing layer on top of catalog, where you run your queries base on catalog metadata/data. It doens't store any data it and runs on kubernetes cluster. As of now you have two kinds of warehouse `Impala` comes with *hue* and `Hive` comes with *hue* and *Das*.
  - *EventStream Analytics* : Not enabled by default but can asked for it. It works on druid for high speed aggregations and Analytics on time series dataset.
- Queries run on cloud native containers with kubernetes.
- Comes with pre-build gafana dashboard. 
- This is based on underlike Datalake associated with environment.
- Inherits the restriction and rules from Datalake.

#### **Cloudera Machine Learning**
- This is based on underlike Datalake associated with environment.
- Inherits the restriction and rules from Datalake.
- It runs on cloud native containers with kubernetes and supports multiple languages like python, R

#### **Data Engineering**
- This is for create virtual data engineering cluster with flexible resources.
- It also runs of cloud-native with kubernetes.
- You can provide the job code and schedule it accordingly
- It uses Airflow to schedule and run the jobs.
  
#### **Operational Database**
- This is newly added as independed Operational database.
- It will be Hbase cluster along with phoenix on top of it.
- It's a fully Managed stack, self autoscalling and resizing.

I hope you have better understanding of it now.