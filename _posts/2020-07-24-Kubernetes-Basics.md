---
layout: post
title: Kubernetes Basics
date: 2020-07-24 15:44
category: [Technology, Microservices]
author: Vikas Srivastava
tags: [Kubernetes, K8s, Kube]
summary: Basics of Kubernetes 
---

Today, I am writing about Kubernetes Architecture/Concepts and Best Practices. Kubernetes became very popular after the evolution of [microservices](https://microservices.io/){:target="_blank"} and most of the startup companies started moving away from monolithic architecture. 

Indetail you can read official document, As per [official document](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/){:targe="_blank"} ``` Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications ```

**Topics** 
* Kubernetes Architecture
* Kubernetes Concepts
* Best Practices of Kubernetes
* Installation of Kubernetes


## **Kubernetes Architecture** #

![kuber](../../resource/k8s/kube_arch.jpg)

*Img Source: Google* 

#### **Master**
  - **Api Server**: Receives api request for modification, talk to etcd cluster of metadata requests
  - **Controller-Manager**: Runs a number of distinct controller processes in the background, like replication and changes 
  - **Scheduler**: Helps to schedule the pods on the various nodes based on resource utilization.
  - **Etcd cluster**: Stores the metadata of Kubernetes cluster in key-value pair

#### **Worker**
   - **Kubelet** -> It is the main service on a node, It regularly takes in new or modified pod specifications and also reports to the master on the health of the host
   - **Kube-proxy** -> Proxy service that runs on each worker node to deal with individual host subnetting and expose services to the external world
   - **Docker** -> Dockers runs on every worker node and take care of downloading the image and start the cluster

## **Kubernetes Concepts** ##

- **Pods**
    1. One or more containers running as a single application
    2. encapsulates application containers, storage resources, a unique network ID

- **Service**
    1. It represents a logical set of pods
    2. It acts as a gateway, allowing (client) pods to send requests to the service without track of which physical pods actually make up the service

- **Volume**
    1. Applies to a whole pod and is mounted on all containers in the pod
    2. Guarantees data is preserved across container restarts
    3. Volume will be removed only when the pod gets destroyed
    4. Pods can have multiple volumes as well

- **Namespace**  
    1. Virtual cluster (a single physical cluster can run multiple virtual ones) 
    2. Resources inside a namespace must be unique and cannot access resources in a different namespace
    3. A Namespace can be allocated a resource quota to avoid consuming more than its share of the physical cluster’s overall resources
    ```sh 
        $ kubectl create namespace test
    ``` 

- **Deployment**
    1. Describes the desired state of a pod or a replica set, in a yaml file


## **Best Practices** ##

* Always use the smaller container size
* Check if code required multistage container
* Access the service from the other namespace using `<service>.<namespace>`
* Setup the request and limits for the pots/containers
* Resource Quota
```yaml
   spec:
    hard:
        - request.cpu = 500m  (all the container can have maximum of 500m in total cpu for particular Namespace)
        - request.memory = 100mib (total size of memory for particular namespace)
        - limits.cpu = 700m
        - limits.memory = 500Mib
```
* LimitRange (set the request and limit for cpu and memory per container level)


## Installation and Setup On Mac ##
  [Click Here](https://rominirani.com/tutorial-getting-started-with-kubernetes-with-docker-on-mac-7f58467203fd){:target="_blank"}

