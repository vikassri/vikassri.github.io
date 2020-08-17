---
layout: post
title: CDP-DC Installation
date: 2020-08-16 12:57
category: [Technology, CDP]
author: Vikas Srivastava
tags: [cdpdc, installation]
summary: Installation of CDPDC
---

Installation of CDP-DC is similar to installation of CDH, I will be providing the steps to do the easy installation of CDP-DC.

#### **Steps**

* Node Preperation
* CM Installation

#### **Pre-requisite**

- links for CM and CDP parcels
- JDK and Node Pre-requisites

## **Node Preparation**

I am going to do installation on 6 nodes, below are the different catagories of nodes, I am going to use.

| Type            | Count |
| --------------- | :---- |
| Management Node | 1     |
| Master Node     | 2     |
| Slave Nodes     | 3     |
| Gateway Node    | 1     |

**Management Node** 
- Consists of Mangement services like host/event/
- Cloudera Manager will be installed on it
- Admins will have access to this node for management

**Master Nodes**
- Master services will be installed on this node
- Hdfs/Yarn/Hbase Master
- It will be memory and code rich node

**Slave Nodes**
- Slave services like DataNode, NodeManagers zookeepers etc
- they should be high on storage side
- Average memory/CPU cores

**Gateway Node**
- It will be acting as edge node or client node
- All the clients will be installed on this node
- Users will be accessing the cluster from this node.

## **CM / CDP Installation** 

Now we have 6 nodes available, We need to get the trial version of CM so we need to download from [Here](https://www.cloudera.com/downloads/cdp-data-center-trial.html).

```bash
# running with root on node-1
$ wget https://archive.cloudera.com/cm7/7.1.3/cloudera-manager-installer.bin
$ chmod u+x cloudera-manager-installer.bin
$ ./cloudera-manager-installer.bin
```
You will see the blue screen with command to press `next` and `next`
![ins-1](../../resource/cdp/ins-1.jpg) 

It will install the CM and JDK on the node 1, Once its done you can open the [node-1:7180/cmf](__blank) and login with `admin/admin`. After login select the second option with `Try Cloudera Data Platform for 60 days`.

![ins-2](../../resource/cdp/ins-2.jpg)

Next Page will need the hostname list, You can provide the host list like `c2110-node[1-6].hortonworks.com`. Now just select the version we want to install on the cluster.

![ins-3](../../resource/cdp/ins-3.jpg)

Select the Cloudera provided JDK and Select `Next` after that you need provide the `Password` or `Private key` of `root` user. Once you provide details it will start installing agents and CDP parcels.

![ins-4](../../resource/cdp/ins-4.jpg)

After Installation and activation of parcels, Next sceen will ask you validate the hosts and network

- [x] Inspect Network Performance
- [x] Inspect Hosts
- [x] I understand the risks of not running the inspections or the detected issues, let me continue with cluster setup.
 
Click `Next`. Here you can see the multiple choices, Cloudera came up with multiple templates w.r.t use cases, now you can directly install the service according to required use case or you can install with customization.

![img](../../resource/cdp/ins-5.jpg)

Now after selecting next if you want to install ranger / hive / rangerkms / oozie / hue / das any of these. You need to set the database first. I have used mysql to install on node-3, You can see the details [here](https://docs.cloudera.com/cloudera-manager/7.1.1/installation/topics/cm_ig_mysql.html)

```bash
$ wget http://repo.mysql.com/mysql-community-release-el7-5.noarch.rpm
$ rpm -ivh mysql-community-release-el7-5.noarch.rpm
$ yum update
$ yum install mysql-server
$ systemctl start mysqld
$ systemctl enable mysqld

# donwload the jar and place under /usr/share/java on CM node-1
$ wget https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.46.tar.gz
$ tar zxvf mysql-connector-java-5.1.46.tar.gz
$ mkdir -p /usr/share/java/
$ cd mysql-connector-java-5.1.46
$ cp mysql-connector-java-5.1.46-bin.jar /usr/share/java/mysql-connector-java.jar
$ chmod +x mysql-connector-java.jar
```

Now you need to create user and databases like below, you can choose your desired name and password. You can also check the list [here](https://docs.cloudera.com/cloudera-manager/7.1.1/installation/topics/cdpdc-creating-databases-for-cdp.html)

```bash
CREATE DATABASE ranger DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON ranger.* TO 'ranger'@'%' IDENTIFIED BY 'hadoop';
GRANT ALL ON ranger.* TO 'ranger'@'localhost' IDENTIFIED BY 'hadoop';

CREATE DATABASE rangerkms DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON rangerkms.* TO 'rangerkms'@'%' IDENTIFIED BY 'hadoop';
GRANT ALL ON rangerkms.* TO 'rangerkms'@'localhost' IDENTIFIED BY 'hadoop';

CREATE DATABASE hue DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON hue.* TO 'hue'@'%' IDENTIFIED BY 'hadoop';
GRANT ALL ON hue.* TO 'hue'@'localhost' IDENTIFIED BY 'hadoop';

CREATE DATABASE metastore DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON metastore.* TO 'hive'@'%' IDENTIFIED BY 'hadoop';
GRANT ALL ON metastore.* TO 'hive'@'localhost' IDENTIFIED BY 'hadoop';

CREATE DATABASE rman DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON rman.* TO 'rman'@'%' IDENTIFIED BY 'hadoop';
GRANT ALL ON rman.* TO 'rman'@'localhost' IDENTIFIED BY 'hadoop';
```

Once this done you can provide the Server details, like which services will be installed on which node. After the service selection on the node click on `Continue`. You will be on database page where you need to provide the database details like below.

![img](../../resource/cdp/ins-6.jpg)

After This, You will land onto configuration page where we need to provide the directories for services, I have used below it will be created automatically.

| Property                    | Path            |
| --------------------------- | :-------------- |
| dfs.datanode.data.dir       | /data/datanode  |
| dfs.namenode.name.dir       | /data/namenode  |
| dfs.namenode.checkpoint.dir | /data/snamenode |
| yarn.nodemanager.local-dirs | /node/local     |

Click Next, It will start installing and running commands in background once its completed click on `Finish`. Now you will be redirected to Home page of cloudera

![ins-7](../../resource/cdp/ins-7.jpg)

## **After Installation**

There are few steps you need to perform after installation of services.

* Install yarn Jars/Dependencies and HS directories on Hdfs
* Root Directory for Hbase
* Iniitalize the solr 
* Create hive userdir and Warehouse directories
* Enable HA for HDFS and YARN
* Migration of CM database from embadded to another

**Install yarn Jars/Dependencies**

You need to click in yarn services
```sh
Cluster -> Yarn -> Actions -> Install YARN MapReduce Framework Jars
Cluster -> Yarn -> Actions -> Install YARN Service Dependencies
Cluster -> Yarn -> Actions -> Create Job History Dir
Cluster -> Yarn -> Actions -> Create NodeManager Remote Application Log Directory
```

**Root Directory for Hbase**

Create the root directory on hdfs for Hbase
```sh
Cluster -> Hbase -> Actions -> Create Root Directory
```

**Initalize the solr**

Before starting the solr you need to initialise it else it will not start
```sh
Cluster -> CDP-INFRA-SOLR -> Actions -> Initialize Solr
```

**Create hive userdir and Warehouse directories**

Creating the hive user directory and warehouse directory for managed and external tables
```sh
Cluster -> Hive -> Actions -> Create Hive User Directory
Cluster -> Hive -> Actions -> Create Hive Warehouse Directory
Cluster -> Hive -> Actions -> Create Hive Warehouse External Directory
```
**Enable HA for HDFS**

```sh
Cluster -> Hdfs -> Actions -> Enable High Availability
```
you need to provide the name service and select the second host along with journal nodes

```python
nameservice       : cdpdcservice
Standby Namenode  : c2110-node-1
Journalnode       : c2110-node-[3-5] [same as datanode]
Journal_node_path : /data/journalnode
```
For each of the `Hive service(s)` Hive, stop the Hive service, back up the Hive Metastore Database to a persistent store, run the service command `Update Hive Metastore NameNodes`, then restart the Hive services.

```sh
Cluster -> Hive -> Actions -> Stop
Cluster -> Hive -> Actions -> Update Hive Metastore NameNodes
Cluster -> Hive -> Actions -> Start
```

**Enable HA for YARN**
```sh
Cluster -> Yarn -> Actions -> Enable High Availability
```
Here you need to select the node where you want to install the standby ResourceManager, As I selected the c2110-node2.
