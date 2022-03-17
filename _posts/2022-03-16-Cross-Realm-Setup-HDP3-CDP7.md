---
layout: post
title: Cross Realm setup between HDP3 and CDP7
date: 2022-03-16 10:12
category: [Technology, HDP, CDP]
author: Vikas Srivastava
tags: [cdpdc, cross realm]
summary: Cross Realm Setup
---

# Cross Realm #
Cross realm is required when we need to setup connectivity between two secure clusters specially kerberos. In case of sidecar upgrade, Migration of data is required from one cluster to another and we need to do the cross realm setup to make it happen.

Lets take two cluster with different realms like below

HDP cluster details
-------------------
* Realm name: **HWX.COM**
* KDC server: **c2110-node1.squadron.support.hortonworks.com**
* admin_server = **c2110-node1.squadron.support.hortonworks.com**
* default_domain = **support.hortonworks.com**

 
CDP Cluster details
------------------ 
* Realm name: **CLDR.COM** 
* kdc server = **ccycloud-1.cdptest.root.hwx.site**
* admin_server = **ccycloud-1.cdptest.root.hwx.site**
* default_domain = **root.hwx.site**


# Steps:

## **Update /etc/hosts**
* Make sure are all hosts from both cluster should be able to ping each other 
* you can add host from different cluster to each other, like HDP nodes into CDP /etc/hosts file and viceversa.

## **Krbtgt principal creation**
* Create required principals on both clusters: password and encryption should be same on both the cluster.

### **HDP Cluster**
```bash
kadmin.local -e aes256-cts-hmac-sha1-96,aes128-cts-hmac-sha1-96
addprinc -pw hadoop krbtgt/CLDR.COM@HWX.COM
addprinc -pw hadoop krbtgt/HWX.COM@CLDR.COM
```

### **CDP Cluster**
```bash
kadmin.local -e aes256-cts-hmac-sha1-96,aes128-cts-hmac-sha1-96
addprinc -pw hadoop krbtgt/CLDR.COM@HWX.COM
addprinc -pw hadoop krbtgt/HWX.COM@CLDR.COM
```

## **Update the auth to local rules**
Update hadoop local to auth rules to match other cluster principles and to map accrodingly
Add following rules in hadoop config-->Additional Rules to Map Kerberos Principals to Short Names

### **HDP Cluster**
```
RULE:[1:$1@$0](^.*@HWX.COM$)s/^(.*)@HWX.COM$/$1/g
RULE:[2:$1@$0](^.*@HWX.COM$)s/^(.*)@HWX.COM$/$1/g
DEFAULT
{DEFAULT_RULES}
```

### **CDP Cluster**
```
RULE:[1:$1@$0](^.*@CLDR.COM$)s/^(.*)@CLDR.COM$/$1/g
RULE:[2:$1@$0](^.*@CLDR.COM$)s/^(.*)@CLDR.COM$/$1/g
DEFAULT
```

## **Add trusted realm in CDP cluster**
![image](../../resource/cdp/cr.jpg)

restart the services.

## **Update krb-conf template in HDP cluster**

update the below line if doesnt exists at kerberos -> Advance Krb-conf -> krb-conf template

```
[libdefaults]
  renew_lifetime = 7d
  forwardable = true
  default_realm = {{realm}}
  ticket_lifetime = 24h
  dns_lookup_realm = false
  dns_lookup_kdc = false
  default_ccache_name = /tmp/krb5cc_%{uid}
  #default_tgs_enctypes = {{encryption_types}}
  #default_tkt_enctypes = {{encryption_types}}
{% if domains %}
[domain_realm]
{%- for domain in domains.split(',') %}
  {{domain|trim()}} = {{realm}}
{%- endfor %}
{% endif %}
   root.hwx.site = CLDR.COM
[logging]
  default = FILE:/var/log/krb5kdc.log
  admin_server = FILE:/var/log/kadmind.log
  kdc = FILE:/var/log/krb5kdc.log

{# Append additional realm declarations below #}
  CLDR.COM = {
    kdc = ccycloud-1.cdptest.root.hwx.site
    admin_server = ccycloud-1.cdptest.root.hwx.site
    default_domain = root.hwx.site
  }

[capaths]
 HWX.COM = {
   CLDR.COM = .
}
```

Restart the service and regenerate the keytabs.

## **validate the krb5.conf on both the clusters**

### **HDP Cluster**
```
[libdefaults]
  renew_lifetime = 7d
  forwardable = true
  default_realm = HWX.COM
  ticket_lifetime = 24h
  dns_lookup_realm = false
  dns_lookup_kdc = false
  default_ccache_name = /tmp/krb5cc_%{uid}

[domain_realm]
  hortonworks.com = HWX.COM

   root.hwx.site = CLDR.COM
[logging]
  default = FILE:/var/log/krb5kdc.log
  admin_server = FILE:/var/log/kadmind.log
  kdc = FILE:/var/log/krb5kdc.log

[realms]
  HWX.COM = {
    admin_server = c2110-node1.squadron.support.hortonworks.com
    kdc = c2110-node1.squadron.support.hortonworks.com
  }
  CLDR.COM = {
    kdc = ccycloud-1.cdptest.root.hwx.site
    admin_server = ccycloud-1.cdptest.root.hwx.site
    default_domain = root.hwx.site
  }
[capaths]
 HWX.COM = {
   CLDR.COM = .
}
```
### **CDP Cluster**

```bash
[libdefaults]
  default_realm = CLDR.COM
  dns_lookup_kdc = false
  dns_lookup_realm = false
  ticket_lifetime = 86400
  renew_lifetime = 604800
  forwardable = true
  default_tgs_enctypes = rc4-hmac aes128-cts
  default_tkt_enctypes = rc4-hmac aes128-cts
  permitted_enctypes = rc4-hmac aes128-cts
  udp_preference_limit = 1
  kdc_timeout = 3000
[realms]
CLDR.COM = {
    kdc = ccycloud-1.cdptest.root.hwx.site
    admin_server = ccycloud-1.cdptest.root.hwx.site
    default_domain = root.hwx.site
}
HWX.COM = {
    kdc = c2110-node1.squadron.support.hortonworks.com
    admin_server = c2110-node1.squadron.support.hortonworks.com
    default_domain = hortonworks.com
}
[domain_realm]
root.hwx.site = CLDR.COM
hortonworks.com = HWX.COM

[capaths]
 CLDR.COM = {
   HWX.COM = .
}
```

## **Verify to test the auth to local rules**

Verify hadoop local to auth rules
### **HDP Cluster**
```bash
[hdfs@ccycloud-1 ~]$ hadoop org.apache.hadoop.security.HadoopKerberosName hdfs/ccycloud-1.cdpdcdaas.root.hwx.site@HWX.COM
Name: hdfs/ccycloud-1.cdpdcdaas.root.hwx.site@HWX.COM to hdfs
```
### **CDP Cluster**
```bash
[hdfs@ccycloud-3 ~]$ hadoop org.apache.hadoop.security.HadoopKerberosName hdfs/ccycloud-1.cdpdc.root.hwx.site@CLDR.COM
Name: hdfs/ccycloud-1.cdpdc.root.hwx.site@CLDR.COM to hdfs
```

## **Verify the Access to other cluster**

verify if you can run test queries from cluster A to cluster B and vice versa

### **To debug just add**
```bash
export HADOOP_CLIENT_OPTS="-Dsun.security.krb5.debug=true"
export HADOOP_ROOT_LOGGER=DEBUG,console
```

### **Running hdfs commands in HDP cluster from CDP Cluster**
kinit the user and run the below commands
```bash
[hdfs@ccycloud-1 ~]$ hdfs dfs -ls hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user
Found 11 items
drwxr-xr-x   - hdfs           supergroup              0 2020-08-19 05:30 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/hdfs
drwxrwxrwx   - mapred         hadoop                  0 2020-07-31 03:37 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/history
drwxrwxr-t   - hive           hive                    0 2020-08-01 04:34 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/hive
drwxrwxr-x   - hue            hue                     0 2020-07-31 03:37 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/hue
drwxr-xr-x   - ingestion_user ingestion_user          0 2020-09-17 01:56 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/ingestion_user
drwxr-xr-x   - nifi           nifi                    0 2020-08-02 08:46 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/nifi
drwxrwxr-x   - oozie          oozie                   0 2020-09-20 21:14 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/oozie
drwxr-x--x   - spark          spark                   0 2020-07-31 03:35 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/spark
drwxr-xr-x   - hdfs           supergroup              0 2020-07-31 03:35 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/tez
drwxr-xr-x   - hdfs           supergroup              0 2020-09-22 11:44 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/vinod
drwxr-xr-x   - hdfs           supergroup              0 2020-07-31 03:36 hdfs://ccycloud-1.cdpdcdaas.root.hwx.site/user/yarn
```

### **Running hdfs commands in CDP cluster from HDP Cluster**
kinit the user and run the below commands
```bash
[hdfs@ccycloud-3 ~]$ hdfs dfs -ls hdfs://c2110-node1.squadron.support.hortonworks.com/user
Found 8 items
drwxrwxrwx   - mapred hadoop              0 2020-09-11 10:03 hdfs://c2110-node1.squadron.support.hortonworks.com/user/history
drwxrwxr-t   - hive   hive                0 2020-09-21 01:35 hdfs://c2110-node1.squadron.support.hortonworks.com/user/hive
drwxrwxr-x   - hue    hue                 0 2020-09-11 10:08 hdfs://c2110-node1.squadron.support.hortonworks.com/user/hue
drwxrwxr-x   - impala impala              0 2020-09-15 09:43 hdfs://c2110-node1.squadron.support.hortonworks.com/user/impala
drwxrwxr-x   - oozie  oozie               0 2020-09-11 10:01 hdfs://c2110-node1.squadron.support.hortonworks.com/user/oozie
drwxr-x--x   - spark  spark               0 2020-09-11 10:01 hdfs://c2110-node1.squadron.support.hortonworks.com/user/spark
drwxr-xr-x   - hdfs   supergroup          0 2020-09-11 10:01 hdfs://c2110-node1.squadron.support.hortonworks.com/user/tez
drwxr-xr-x   - hdfs   supergroup          0 2020-09-11 10:02 hdfs://c2110-node1.squadron.support.hortonworks.com/user/yarn
```

## You are all set to do the data migration.