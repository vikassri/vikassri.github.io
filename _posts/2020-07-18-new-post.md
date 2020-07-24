---
layout: post
title: Hadoop Setup on Ubuntu
date: 2012-07-12 13:57
category: [Technology, Hadoop]
author: Vikas Srivastava
tags: [Hadoop, Installation, Ubuntu]
summary: Installation of hadoop on Ubuntu
---

**Hadoop Setup with ubuntu**

Hadoop is nothing but a frameword which consist of two main component HDFS, MR. HDFS is distributed filesystem to store the data in distributed manner and on the other side we have MR it is a processing system on top of hdfs. Here we are going to see the basic installation of hadoop on ubunto os.

**Initial setup**

I use the apt utility to grab the Hadoop distribution. First, I tell apt about the Cloudera site, then create a new file in /etc/apt/sources.list.d/cloudera.list and add the following text:
```bash
# Prerequisite
#Java 1.6 should be installed on your system
deb http://archive.cloudera.com/debian intrepid-cdh3 contrib
deb-src http://archive.cloudera.com/debian intrepid-cdh3 contrib
```

If you're running Jaunty or another release, just replace intrepid with your specific release name (current support includes Hardy, Intrepid, Jaunty, Karmic, and Lenny).
Next, I grab the apt-key from Cloudera to validate the downloaded package:
```bash
curl -s http://archive.cloudera.com/debian/archive.key | sudo apt-key add - sudo apt-get update

#then install Hadoop for a pseudo-distributed configuration (all the Hadoop daemons run on a single host):
sudo apt-get install hadoop-0.20-conf-pseudo
```

We are going to set up pseudo installation which is good for development, before start we need to do passwordless ssh on the system

**Setting up for passphrase-less SSH**
```bash      
sudo su -
ssh-keygen -t dsa -P '' -f ~/.ssh/id_dsa
cat ~/.ssh/id_dsa.pub >> ~/.ssh/authorized_keys
```

**Formatting Hadoop**

Now, you're ready to start Hadoop but before that we need to format the filesystem as we are installing it for the first time, we need to `format` it on for the first time.
```bash
hadoop-0.20 namenode -format
```

Now we need to start the Hadoop daemons. Hadoop starts five daemons in this pseudo-distributed configuration: namenode, secondarynamenode, datanode, jobtracker, and tasktracker.

**Starting Hadoop**

Hadoop provides some helper tools to simplify its startup. The following short script illustrates how to start the Hadoop node:
```bash
/usr/lib/hadoop-0.20/bin/start-dfs.sh
/usr/lib/hadoop-0.20/bin/start-mapred.sh
```

To verify that the daemons are running, you can use the jps command (which is a ps utility for JVM processes). This command lists the five daemons and their process identifiers.

**Inspecting HDFS**

You can perform a couple of tests to ensure that Hadoop is up and running normally (at least the namenode). Knowing that all of your processes are available, you can use the hadoop command to inspect the local namespace (see Listing 2).

**Checking access to the HDFS**
```bash    
hadoop-0.20 fs -ls /
Found 2 items
drwxr-xr-x   - root supergroup          0 2010-04-29 16:38 /user
drwxr-xr-x   - root supergroup          0 2010-04-29 16:28 /var
```

From this, you can see that the namenode is up and able to service the local namespace. Notice that you're using a command called hadoop-0.20 to inspect the file system. This utility is how you interact with the Hadoop cluster.

**Exploring file system manipulation in Hadoop**
```bash       
hadoop-0.20 fs -mkdir test
hadoop-0.20 fs -ls test
hadoop-0.20 fs -rmr test
Deleted hdfs://localhost/user/root/test
```

**Creating folder and Moving files into HDFS**
```bash
hadoop-0.20 fs -mkdir input
hadoop-0.20 fs -put /usr/src/linux-source-2.6.27/Doc*/file1.txt  input
hadoop-0.20 fs -put /usr/src/linux-source-2.6.27/Doc*/file2.txt  input
```

Next, you can check for the presence of the files using the ls command (see Listing 5).

**Checking files in HDFS**
```bash    
hadoop-0.20 fs -ls input
Found 2 items
-rw-r--r--  1 root supergroup 78031 2010-04-29 17:35 /user/root/input/file1.txt
-rw-r--r--  1 root supergroup 33567 2010-04-29 17:36 /user/root/input/file2.txt
```

Below command requests the execution of a JAR, This example focuses on wordcount. The jobtracker daemon requests that the datanode perform the MapReduce job.It shows the progress of the map and reduce functions, and then provides some useful statistics regarding the I/O for both file system and records processing.

**Performing a MapReduce job for word frequency (wordcount)**
```bash
hadoop-0.20 jar /usr/lib/hadoop-0.20/hadoop-0.20.2+228-examples.jar wordcount input output
10/04/29 17:36:49 INFO input.FileInputFormat: Total input paths to process : 2
10/04/29 17:36:49 INFO mapred.JobClient: Running job: job_201004291628_0009
10/04/29 17:36:50 INFO mapred.JobClient:  map 0% reduce 0%
10/04/29 17:37:00 INFO mapred.JobClient:  map 100% reduce 0%
10/04/29 17:37:06 INFO mapred.JobClient:  map 100% reduce 100%
10/04/29 17:37:08 INFO mapred.JobClient: Job complete: job_201004291628_0009
10/04/29 17:37:08 INFO mapred.JobClient: Counters: 17
10/04/29 17:37:08 INFO mapred.JobClient:   Job Counters
.
.
10/04/29 17:37:08 INFO mapred.JobClient:     Combine input records=17457
10/04/29 17:37:08 INFO mapred.JobClient:     Map output records=17457
10/04/29 17:37:08 INFO mapred.JobClient:     Reduce input records=3381
```

With the processing complete, inspect the result. Recall that the point of the job is to calculate the number of times words occurred in the input files. This output is emitted as a file of tuples, representing the word and the number of times it appeared in the input. You can use the cat command (after finding the particular output file) through the hadoop-0.20 utility to emit this data (see Listing 7).

**Reviewing the output from the MapReduce wordcount operation**
```bash       
hadoop-0.20 fs -ls /user/root/output

Found 2 items
drwxr-xr-x   - root supergroup          0 2010-04-29 17:36 /user/root/output/_logs
-rw-r--r--   1 root supergroup      30949 2010-04-29 17:37 /user/root/output/part-r-00000

hadoop-0.20 fs -cat output/part-r-00000 | head -5
Atomic 2
Cache 2
Control 1
Examples 1
Has 7
```

You can also extract the file from HDFS using the hadoop-0.20 utility (see Listing 8).

**Extracting the output from HDFS**
```bash
hadoop-0.20 fs -get output/part-r-00000 output.txt
cat output.txt | head -4
Atomic 2
Cache 2
Control 1
Examples 1

#remove the output sub directory to recreate it for this test
hadoop-0.20 fs -rmr output
Deleted hdfs://localhost/user/root/output
```

Next, request the MapReduce job for grep. In this case, the grep is performed in parallel (the map), and then the grep results are combined (reduce). 

**Performing a MapReduce Job for word search count (grep)**
```bash
hadoop-0.20 jar /usr/lib/hadoop/hadoop-0.20.2+228-examples.jar grep input output 'kernel'
10/04/30 09:22:29 INFO mapred.FileInputFormat: Total input paths to process : 2
10/04/30 09:22:30 INFO mapred.JobClient: Running job: job_201004291628_0010
10/04/30 09:22:31 INFO mapred.JobClient:  map 0% reduce 0%
10/04/30 09:22:42 INFO mapred.JobClient:  map 66% reduce 0%
10/04/30 09:22:45 INFO mapred.JobClient:  map 100% reduce 0%
10/04/30 09:22:54 INFO mapred.JobClient:  map 100% reduce 100%
10/04/30 09:22:56 INFO mapred.JobClient: Job complete: job_201004291628_0010
10/04/30 09:22:56 INFO mapred.JobClient: Counters: 18
10/04/30 09:22:56 INFO mapred.JobClient:   Job Counters
10/04/30 09:22:56 INFO mapred.JobClient:     Launched reduce tasks=1
10/04/30 09:22:56 INFO mapred.JobClient:     Launched map tasks=3
10/04/30 09:22:56 INFO mapred.JobClient:     Data-local map tasks=3
10/04/30 09:22:56 INFO mapred.JobClient:   FileSystemCounters
10/04/30 09:22:56 INFO mapred.JobClient:     FILE_BYTES_READ=57
10/04/30 09:22:56 INFO mapred.JobClient:     HDFS_BYTES_READ=113144
10/04/30 09:22:56 INFO mapred.JobClient:     FILE_BYTES_WRITTEN=222
10/04/30 09:22:56 INFO mapred.JobClient:     HDFS_BYTES_WRITTEN=109
...
10/04/30 09:23:14 INFO mapred.JobClient:     Map output bytes=15
10/04/30 09:23:14 INFO mapred.JobClient:     Map input bytes=23
10/04/30 09:23:14 INFO mapred.JobClient:     Combine input records=0
10/04/30 09:23:14 INFO mapred.JobClient:     Map output records=1
10/04/30 09:23:14 INFO mapred.JobClient:     Reduce input records=1
```

With the job complete, inspect the output directory (to identify the results file), and then perform a file system cat operation to view its contents (see Listing 10).

**Inspecting the output of the MapReduce job**
```bash       
# hadoop-0.20 fs -ls output
Found 2 items
drwxr-xr-x  - root supergroup    0 2010-04-30 09:22 /user/root/output/_logs
-rw-r--r--  1 root supergroup   10 2010-04-30 09:23 /user/root/output/part-00000
# hadoop-0.20 fs -cat output/part-00000
17 kernel
```

**Web-based interfaces**

NameNode   WebInterface:    http://localhost:50070
JobTracker WebInterface:    http://localhost:50030

Note that in both of these cases, you reference localhost, because all daemons are running on the same host.

