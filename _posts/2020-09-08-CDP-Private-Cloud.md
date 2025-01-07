---
layout: post
title: CDP Private Cloud Introduction
date: 2020-09-08 10:20
category: [Technology, CDP]
author: Vikas Srivastava
tags: [cdp, Private Cloud]
summary: Cloudera Private Cloud
---

CDP PvC consist of same components as CDP public cloud like CDW and CML, which are not present on CDP-DC. CDP-PvC runs on container based cloud like Openshit 4.3 and OEM openshift.

Customers who don't want to move to public cloud and using on-premise cluster(CDP-DC). You can extend the cluster from CDP-DC to CDP-PVC. Its uses CDP-DC as base cluster, similar to `Datalake` in CDP-PC. We have seen that we run Data warehouse and ML on cloud native with kubernetes on CDP-PC. We run the same in CDP-PvC becoz it also runs on Kubernetes.


#### **Benefits**

* Faster Onboarding Process
* Remove Noising Neighbours
* Multi-Tanency and Isolation

### MAIN COMPONENTS

**Control Plane (couldera Provided cloud account)**
* Management Console

**Compute Plane (customer provided cloud account)**
* Data warehouse Cluster
* Clouder Machine learning


#### **Management Console**
- It is the main screen which have all the admin level controls available.
- Like registering environment, User Management
- Dashboard
- DataLake (Ranger/Atlas)
- Data Warehouse and ML workspace

#### **Cloudera Data Warehouse**
- As CDW is nothing but data warehouse implementaion, which consist of 
  - **Database Catalog** : Base catalog consists of metadata of datalake and if you make any changes to default catalog it refelects to datalake as well. One can create multiple catalogs and attach virtual environment to it. You cannot delete defualt database catalog.
  - **Virtual warehouse** : It is a processing layer on top of catalog, where you run your queries base on catalog metadata/data. It doens't store any data it and runs on kubernetes cluster. As of now you have two kinds of warehouse `Impala` comes with *hue* and `Hive` comes with *hue* and *Das*.
  - **EventStream Analytics** : Not enabled by default but can asked for it. It works on druid for high speed aggregations and Analytics on time series dataset.
- Queries run on cloud native containers with kubernetes.
- Comes with pre-build gafana dashboard. 
- This is based on underlike Datalake associated with environment.
- Inherits the restriction and rules from Datalake.

#### **Cloudera Machine Learning**
- This is based on underlike Datalake associated with environment.
- Inherits the restriction and rules from Datalake.
- It runs on cloud native containers with kubernetes and supports multiple languages like python, R