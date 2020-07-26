---
layout: post
title: Hadoop File Recover (after -skipTrash)
date: 2020-07-26 22:16
category: [Technology, Hadoop]
author: Vikas Srivastava
tags: [hadoop, skipTrash, hdfs, delete]
summary: How to recover file after permanent delete from hdfs
---

Hi All, Today I am going to explain how can we recover the file deleted from the cluster by mistake.
We have a three node HDP cluster, running all the services. We will go step by step to see how we can get file back.

**Creating a file in the cluster**
![image](../../resource/hdfs/1.jpg) 

**Keep this on HDFS in my home directory**

```bash
[hdfs@sandbox-hdp ~]$ hadoop fs -put important.txt /user/hdfs 
[hdfs@sandbox-hdp ~]$ hadoop fs -ls /user/hdfs/ 
Found 1 items
-rw-r--r--   1 hdfs hdfs         49 2018-03-06 14:37 /user/hdfs/important.txt
```

Now we have file in hdfs and now i will delete it with -skipTrash option

![img](../../resource/hdfs/2.jpg)

as you can see that i have deleted the file and there is no file available in the home folder.
**Now you need to stop the hdfs services in your cluster** 

![img](../../resource/hdfs/3.jpg)

**Go to the current directory of your namenode.**

```bash
[hdfs@sandbox-hdp ~]$ cd /hadoop/hdfs/namenode/current/
[hdfs@sandbox-hdp current]$ pwd
/hadoop/hdfs/namenode/current
[hdfs@sandbox-hdp current]$ ll
total 7036
-rw-r--r-- 1 hdfs hadoop    3280 Mar  5 15:17 edits_0000000000000018851-0000000000000018874
-rw-r--r-- 1 hdfs hadoop 1048576 Mar  5 15:52 edits_0000000000000018875-0000000000000019517
-rw-r--r-- 1 hdfs hadoop    3706 Mar  5 15:56 edits_0000000000000019518-0000000000000019544
-rw-r--r-- 1 hdfs hadoop  899265 Mar  6 12:55 edits_0000000000000019545-0000000000000025898
-rw-r--r-- 1 hdfs hadoop 1048576 Mar  6 14:41 edits_inprogress_0000000000000025899
-rw-r--r-- 1 hdfs hadoop   88701 Mar  5 15:56 fsimage_0000000000000019544
-rw-r--r-- 1 hdfs hadoop      62 Mar  5 15:56 fsimage_0000000000000019544.md5
-rw-r--r-- 1 hdfs hadoop   88525 Mar  6 12:55 fsimage_0000000000000025898
-rw-r--r-- 1 hdfs hadoop      62 Mar  6 12:55 fsimage_0000000000000025898.md5
-rw-r--r-- 1 hdfs hadoop       6 Mar  6 12:55 seen_txid
-rw-r--r-- 1 hdfs hadoop     201 Mar  5 15:12 VERSION
```
Here you can see that file name  edits_inprogress_0000000000000025899 is present, its nothing but contains the current operation done on hadoop cluster, so lets check the contents of the file and see the operation being done on the cluster.

**Convert the file into xml to read its content**

```bash
hdfs oev -i edits_inprogress_0000000000000025899 -o edits_inprogress_0000000000000025899.xml
```

Once file is converted into xml file you need find the record inside the file like below

```bash
[hdfs@sandbox-hdp current]$ hdfs oev -i edits_inprogress_0000000000000025899 -o edits_inprogress_0000000000000025899.xml
[hdfs@sandbox-hdp current]$ ls *xml
edits_inprogress_0000000000000025899.xml
[hdfs@sandbox-hdp current]$ 
```

Let's find record inside the file, here you can see delete operation has been performed on the file with respective ids.

![img](../../resource/hdfs/4.jpg)

Once you find the record just delete the above record from the file itself and save it again.

**Now the next step is to convert it back into binary**

```bash
[hdfs@sandbox-hdp current]$ hdfs oev -i edits_inprogress_0000000000000025899.xml -oedits_inprogress_0000000000000025899 -p binary
[hdfs@sandbox-hdp current]$ ll edits_inprogress_0000000000000025899 
-rw-r--r-- 1 hdfs hadoop 1048576 Mar  6 14:56 edits_inprogress_0000000000000025899
```

Let's find record inside the file, here you can see delete operation has been performed on the file with respective ids.

Once its converted back into binary format, it can be reloaded into hadoop namenode. While converting, you might get error but don't worry it will not impact on anything.

**Start the hadoop in recover mode**

```bash
[hdfs@sandbox-hdp current]$ hadoop namenode -recover 
DEPRECATED: Use of this script to execute hdfs command is deprecated. 
Instead use the hdfs command for it. 
18/03/06 15:00:47 INFO namenode.NameNode: STARTUP_MSG: 
/************************************************************ 
STARTUP_MSG: Starting NameNode 
STARTUP_MSG: user = hdfs 
STARTUP_MSG: host = sandbox-hdp.hortonworks.com/172.17.0.2 
STARTUP_MSG: args = [-recover] 
STARTUP_MSG: version = 2.7.3.2.6.4.0-91
....
Syncs: 0 Number of syncs: 3 SyncTimes(ms): 8 
18/03/06 15:00:53 INFO namenode.FileJournalManager: Finalizing edits file /hadoop/hdfs/namenode/current/edits_inprogress_00000000000000278
09 -> /hadoop/hdfs/namenode/current/edits_0000000000000027809-0000000000000027810 
18/03/06 15:00:53 INFO namenode.FSNamesystem: Stopping services started for standby state 
18/03/06 15:00:53 INFO namenode.NameNode: SHUTDOWN_MSG: 
/************************************************************ 
SHUTDOWN_MSG: Shutting down NameNode at sandbox-hdp.hortonworks.com/172.17.0.2 
************************************************************/ 
[hdfs@sandbox-hdp current]$ 
```

While running above command you need to provide input as Y for starting in recover mode and C(continue) if required.

**Start the Hdfs Services in Ambari**

![img](../../resource/hdfs/5.jpg)

Once services are started lets go and check the file and its content in hadoop home directory of user hdfs

![img](../../resource/hdfs/6.jpg)

Voila !! You can see the file is back 🙂

PS: Just remember to take the backup of edits_inprogress file and other metadata before doing this.
Hope that will save you some day 🙂
