---
layout: post
title: CDP-DC Security Implementation
date: 2020-08-16 13:18
category: [Technology, CDP]
author: Vikas Srivastava
tags: [cdpdc, security]
summary: Security Implementation of CDP-DC
---

Today, I will be implementing the security on CDP-DC Cluster, which we have set up in last blog. CDP provide automation for most of the security like kerberos, Auto TLS and Data at rest.

Our cluster looks like below, As you can see where we can find the secuirty to implement.

![all](../../resource/cdp/main.jpg)

Once you go to security tab you will see below type of security and today we will be setting up these securities in CDP-DC cluster.

![img](../../resource/cdp/all.jpg)

## **Secrity Types**
* Kerberos
* Auto-TLS
* Hdfs Data at Rest

## **Kerberos Setup**
Let's start with setting up kerberos on the cluster. We are going to set up kerberos on last node which is `c1110-node6`.

Cloudera expect us to install kerberos and client on the nodes and provide the configuration on CM so let's start the implementation. We need to run the below script on `c1110-node6`. This script will install the kerberos and set it up.

```bash
function setup_kerberos(){
    REALM="HWX.COM"
    KDC_HOST=`hostname -f`
    domain_name="hortonworks.com"

    echo "installing krb5-server, libs and  krb5-workstation"
    yum install -y krb5-server krb5-libs krb5-workstation
    
    echo "Configuring Kerberos"
    cp /etc/krb5.conf /etc/krb5.conf_bkp
    
    sed -i 's/#//g' /etc/krb5.conf
    sed -i.bak "s/EXAMPLE.COM/$REALM/g" /etc/krb5.conf
    sed -i.bak "s/kerberos.example.com/$KDC_HOST/g" /etc/krb5.conf
    sed -i.bak "s/example.com/$domain_name/g" /etc/krb5.conf
    sed -i.bak "s/default_ccache_name/#default_ccache_name/1" /etc/krb5.conf
    
    echo "creating the database for KDS"
    kdb5_util create -s -P hadoop

    echo "Starting KDC services"
    systemctl start krb5kdc
    systemctl start kadmin
    systemctl enable krb5kdc
    systemctl enable kadmin
   
    echo "Creating admin principal"
    kadmin.local -q "addprinc -pw hadoop admin/admin"
    sed -i.bak "s/EXAMPLE.COM/$REALM/g" /var/kerberos/krb5kdc/kadm5.acl
    
    echo "Restarting kadmin"
    systemctl restart kadmin
}

setup_kerberos

# Login to CM node which is node-1 in my case install the kerberos client
[root@c1110-node1 ~] yum install krb5-workstation krb5-libs -y
```

After setting the kerberos you have `admin/admin` and password as `hadoop`. You should see something like below if you query to list principals.

```bash
[root@c1110-node6 ~] kadmin.local -q listprincs
Authenticating as principal root/admin@HWX.COM with password.
K/M@HWX.COM
admin/admin@HWX.COM
kadmin/admin@HWX.COM
kadmin/c1110-node6.squadron.support.hortonworks.com@HWX.COM
kadmin/changepw@HWX.COM
kiprop/c1110-node6.squadron.support.hortonworks.com@HWX.COM
krbtgt/HWX.COM@HWX.COM
```
Now let's configure this on CM UI, We need to click on `Enable Kerberos` as showin in Image-2, Once you click on it A new widget installation page will open, just confirm and press `Continue` . After that you need to fill few details like below and Press `Continue`.

![k-2](../../resource/cdp/k-2.jpg)

After filling the above page you will reach to page - 3, On this page all you need to do is it enable the 

[ x ] cloudera manager krb5.conf

Next page you need to provide the credentials which we have created while kerberos installation.

`Username`  [admin/admin]@[HWX.COM]
`Password`  [hadoop]

Now you can click on `Continue` , Next Page is about installation of client on all the nodes, so run below commands on all the nodes.

```bash
# As i am using centos i will use below commands
yum install krb5-workstation krb5-libs -y
```

Now you can continue and let it `Enable Kerberos Command` One that is done kerberos is installed on our cluster. Now you can see below Kerberos is showing enabled on the cluster.

![k-3](../../resource/cdp/k-3.jpg)

Cloudera recommends TLS along with kerberos, So lets setup AutoTLS  

## **AUTO-TLS SETUP**

**Auto-TLS supports two options**
* *Option 1*: Use Cloudera Manager to generate an internal Certificate Authority and corresponding certificates
* *Option 2*: Use an existing Certificate Authority and corresponding certificates

I am going for internal CA, which is Option 1. As you have seen the last Images where Kerberos is enabled. There you have a button `Enable Auto-TLS` Click on the button and you will be redirected to below page.

![tls-1](../../resource/cdp/tls-1.jpg)

All you need to do is to provide the `root password` or `private key` of the user, Once you provide these just click on next and it will do the setup and redirect you to next page. Where cloudera will ask you to login to CM host and restart the CM, click on `Finish` and run the below command.

```bash
# logged into CM host and restart CM
[root@c1110-node1 ~] systemctl restart cloudera-scm-server

# run on all the nodes (verify if /etc/cloudera-scm-agent/config.ini hostname should be full FDQN)
systemctl restart cloudera-scm-agent
```

After you restart, you might see some error and issues on the node, All you need to do is to restart all the services **one by one** and if any service is not getting start just check the logs and fix it.

![tls-2](../../resource/cdp/tls-2.jpg)

As you can see, both kerberos and TLS is enabled now. We are left with HDFS rest Encryption, Lets do it now.

## **HDFS Data At Rest Encryption**

As you saw the previous image, there is an option `Set Up HDFS Data At Rest Encryption` click on it and it will take you to below page

![hre-1](../../resource/cdp/hre-1.jpg)

You can see above that we have three options available with us to use. You need to install KMS / KeyTrustee Server or can use file base (not recommended). I will go with `2nd Option` Lets install the ranger KMS first. 

```bash
Cloudera Manager -> Add Services -> Select Ranger KMS
```
But before that you need to create the dabase for these services using below commands.

```sql
# mysql
CREATE DATABASE ranger DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON ranger.* TO 'ranger'@'%' IDENTIFIED BY 'Ranger@123';
GRANT ALL ON ranger.* TO 'ranger'@'localhost' IDENTIFIED BY 'Ranger@123';

CREATE DATABASE rangerkms DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON rangerkms.* TO 'rangerkms'@'%' IDENTIFIED BY 'Rangerkms@123';
GRANT ALL ON rangerkms.* TO 'rangerkms'@'localhost' IDENTIFIED BY 'Rangerkms@123';

##If using MySQL:
SET GLOBAL innodb_file_format=Barracuda;
SET GLOBAL innodb_file_per_table=1;
SET GLOBAL innodb_large_prefix=1;
set @@global.innodb_large_prefix = 1;

# psql
create database ranger;
CREATE USER ranger WITH PASSWORD 'Ranger@123';
GRANT ALL PRIVILEGES ON DATABASE  "ranger" to ranger;

create database rangerkms;
CREATE USER rangerkms WITH PASSWORD 'Rangerkms@123';
GRANT ALL PRIVILEGES ON DATABASE "rangerkms" to rangerkms;
```

After installation of Solr, Ranger and RangerKMS our cluster will be like below.

![all-2](../../resource/cdp/all-2.jpg)

Let again go to security and click on option `Set Up HDFS Data At Rest Encryption`, You will see now it is asking for validation and once you click for validation you need to perform below steps but before doing these step, We need a user with `create key` and `encrypt/decrypt access`. I have created a user `vikas` and given access for above permission using `rangerkms`

Login to ranger url with `keyadmin` / `Ranger@123` and create a new policy under `cm_kms`.

![kms-1](../../resource/cdp/kms-1.jpg)

Now once you have above policy created you can perform the below steps.

```bash
# Create a key and directory.
[vikas@c1110-node1 ~]$ hadoop key create mykey1
mykey1 has been successfully created with options Options{cipher='AES/CTR/NoPadding', bitLength=128, description='null', attributes=null}.
org.apache.hadoop.crypto.key.kms.LoadBalancingKMSClientProvider@18d87d80 has been updated.
[vikas@c1110-node1 ~]$ hadoop fs -mkdir /tmp/zone1
[vikas@c1110-node1 ~]$

# Create a zone and link to the key.
[root@c1110-node1 ~] klist
Ticket cache: FILE:/tmp/krb5cc_0
Default principal: hdfs/c1110-node1.squadron.support.hortonworks.com@HWX.COM
Valid starting     Expires            Service principal
08/11/20 12:53:09  08/12/20 12:53:09  krbtgt/HWX.COM@HWX.COM
[root@c1110-node1 ~] hdfs crypto -createZone -keyName mykey1 -path /tmp/zone1
Added encryption zone /tmp/zone1

# Create a file, put it in your zone and ensure the file can be decrypted.
[root@c1110-node1 ~] su - vikas
Last login: Tue Aug 11 12:54:38 UTC 2020 on pts/1
[vikas@c1110-node1 ~]$ echo "Hello World" > /tmp/helloWorld.txt
[vikas@c1110-node1 ~]$ hadoop fs -put /tmp/helloWorld.txt /tmp/zone1
[vikas@c1110-node1 ~]$ hadoop fs -cat /tmp/zone1/helloWorld.txt
Hello World
[vikas@c1110-node1 ~]$ rm /tmp/helloWorld.txt
[vikas@c1110-node1 ~]$ exit
logout

# Ensure the file is stored as encrypted.
[root@c1110-node1 ~] hadoop fs -cat /.reserved/raw/tmp/zone1/helloWorld.txt
??W?i??,A?
[root@c1110-node1 ~] hadoop fs -rm -R /tmp/zone1
20/08/11 13:17:07 INFO fs.TrashPolicyDefault: Moved: 'hdfs://cdpservice/tmp/zone1' to trash at: hdfs://cdpservice/user/hdfs/.Trash/Current/tmp/zone1
[root@c1110-node1 ~]# 
```

Great now you have security enabled on the cluster. Let me know if you face any issue.

Happy Learning !!!