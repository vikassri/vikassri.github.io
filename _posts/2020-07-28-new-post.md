---
layout: post
title: LLAP Memory Configuration
date: 2020-07-28 13:28
category: [Technology, Bigdata]
author: Vikas Srivastava
tags: [llap, hive, memory]
summary: This blog is for setting up memory configuration of LLAP
---

Memory Configuration is always tricky for anything, we never get the perfect configuration at once but as we start working on it. Time to time do some tuning and we reach to certain point where it feels like it good enough.

## **LLAP Architecture**
As we LLAP is Live Long and Process, These are some long living daemons which replace direct intereations with hdfs Data node. Some of its functionality are like `Caching`, `fre-fetching` and `in-memory processing`.

#### **Components:**

- **LLAP Master/AM** : As its name says it's Application master of LLAP daemons
- **LLAP Daemons**  : Main Daemon process which does most of the heavy lifting like Caching, Jit Optimization, handles IO, Query fragmentation
- **Hive Interactive Server** : Thrift Server to connect Hive LLAP using jdbc connection
- **LLAP Query Co-ordinators/Executors** : These are tez Application Master, which accepts the request from user and execute them. They also reside inside LLAP Daemons

![img](../../resource/others/arch.jpg)

Image Source: Cloudera

## **Steps**
* Choose the LLAP Cluster Size
* Enable Node labels Configuratoon
* Parallelism of Co-ordinators
* Determining Daemon Size
* LLAP Cpu and Memory Configuration


## **Cluster Size**

I presume you already have a running cluster and now you want to set up the LLAP on the cluster. Generally we take around 20% of the cluster for LLAP but its totally depends on the usecase and your requirement.

Suppose We have `20` nodes cluster and I want to set up LLAP on `50%` of the nodes, which is `10` nodes. Each Node has below resources but about 90+% allocated to NodeManager

|  Ram | Core | NodeManager |
| ---: | :--- | :---------- |
|  256 | 24   | ~240        |


## **Type of Configuration**
My recommandation is to use node label along with LLAP, which helps to execute jobs on particular nodes with node label enabled.

**Node label enabled**

In this case you need to enable the node label from the yarn web ui, Use the below path to activate the Node Label

```
*YARN* > Configs on the Ambari dashboard, then enable Node Labels under *YARN Features*.
```

Once you enable the node lable on Ui you need to login to the selected nodes where you want to run the llap daemons and run the node label command like below
```bash
# create the node label
sudo su yarn
yarn rmadmin -addToClusterNodeLabels "llapnodelabel(exclusive=true)"

# Add the node to lavel
yarn rmadmin -replaceLabelsOnNode "node-1.example.com=llapnodelabel node-2.example.com=llapnodelabel node-3.example.com=llapnodelabel"

# validate the node label check 
yarn cluster --list-node-labels
````

## **Parallism and Co-ordinators's number**

How many queries we want to run in parallel define the number of parallism and no. of query co-ordinators/AMs, So lets just say w.r.t above cluster we want to `20 queries` in parallel, so we need `20 co-ordinators/AMs`

```bash
no_of_parallel_queries == no_of_coordinators/AMs
```

## **Determining LLAP Daemon size**

As we want to create 10 nodes Cluster of LLAP and we have 10 nodes with node-label enabled. Each of them is 240GB with 24 Core.

There are two ways we can decide 
1. Run the AMs on the same node as LLAP Daemon
2. Run the AMs on different nodes than LLAP nodes

**Run the AMs on the same node**

In these case we need to decide the LLAP daemon size accordingly becoz we are going to run above `20 AMs` on these 10 nodes, So calculation will be like below

```bash
Minimum Yarn Container size = 1GB
Maximun Yarn Container Size = 240GB
Memory for per AM = 4 GB # this can be 2 gb as well

LLAP Daemon = Total - (no_of_AMs/nodes * Mem_AM )
LLAP Daemon = 240 - (20/10 * 4)   # As we have 20 AMs for 10 nodes, each will run 2 AMS

LLAP Daemon = 232GB
```

**Run the AMs on the Different node**

In these case we need to decide the LLAP daemon size accordingly becoz we are going to run above 20 AMs on these 10 nodes, So calculation will be like below

```bash
Minimum Yarn Container size = 1GB
Maximun Yarn Container Size = 240GB
Memory for per AM = 4 GB # this can be 2 gb as well

LLAP Daemon = Total - (no_of_AMs/node * Mem_AM )
LLAP Daemon = 240 - (0 * 4)  # As we have 20 AMs all runs on different nodes
LLAP Daemon = 240GB
```

## **Queue Setup**

Now As we have all the details available, we need a custom queue to be created for LLAP daemons. It will be utilized by jobs running on the LLAP nodes (node labels)

Below things, we need to take care while creating queue.

1. Its should have higher priority than other queues.
2. Resource Allocation to this Queue should not be less than calculated resources.

**Calculate the queue size**

We are going to run LLAP on 10 Nodes, Which is 50% of the Actual Cluster so We need to give values like below and check the `[x] node label` checkbox

![img](../../resource/others/queue.jpg)

Image Source: Google

If we are going with different approch where we run the AMs on different node in that case we need to adjust it like below

```bash
Queue Size = (4GB * No_of_tezAMs) + (2GB LLAP AM) + (LLAP Daemon * no_of_nodes)
Queue Size = (4 * 20) + (2) + (240 * 10)
Queue Size = 2482GB of 4800 GB => ~ 52%
```

## **LLAP Cpu and Memory Configuration**

There are three main components inside LLAP Daemon,

* Headroom  
* Executors
* Cache

**HeadRoom**

We should have amx Max 6GB or 6% of LLAP deamon size as HeadRoom lets Calculate it for w.r.t our case 

```bash 
HeadRoom = .06 * 232 > 6 GB
# lets keep it 6GB

HeadRoom = 6 GB
```

**Executors**

Generally, It's recommended to keep 1.5 to 1.75 times of core present in the node, SO let's calculate as per our case

```bash
no_of_core = 24 * 1.5 => 36

No_of_Executors = 36 # We keep same memory as AM or 4GB to executors

Memory_for_executors = 36*4 => 144 GB

```

**Cache**

Now We have calculated the `Executors` and `Headroom` . We can allocate rest of the available memory to Cache.

```bash
minimum_size_cache = 0.02*no_of_executors => 0.02*36 => 7.2GB
cache = LLAP_daemon - (Headroom + Executor memory)
cache = 232 GB - (6 GB + 144 GB)
cache = 82 GB # its much more than minimum size so we keep this cache

* If cache is not more than minimum we can try reducing the number of executor to adjust the cache
```

We have all the required values now, we can set up in Ambari.

```bash
No Of LLAP Daemon = 10
LLAP Daemon Size = 232 GB
Cache = 82 GB
HeadRoom = 6GB

No_of_parallel_queries = 20
No_of_executor = 36

Hive Interactive Query  = Checked
Node Label = Checked
Custom Queue Size = 50% 
```

I hope, I have cleared some of your doubts regarding LLAP configuration setup. Let me know if you have any doubts or feedback.

Happy Learning !!!