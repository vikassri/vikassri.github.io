---
layout: post
title: How to use multiple Git Account on mac
date: 2020-07-18 12:44
category: [Technology, git]
author: Vikas Srivastava
tags: [technology, git]
summary: How to use multiple git account from system
---

Today, we are going to see how we can use multiple git account from same computer. Generally we have only one account in github, where we keep all our stuff which we do but sometime we need have two accounts to access from same system. It is required when you have your own personal and official account on github and you want to use both of them from same system.

## Basic commands

*To clone the git repo to your local repo*
```bash
git clone https://github.com/vikassri/Python
```

*Add files to clone repository*
``` bash
cd Python
echo "This is a new file" > Newfile
git add newfile
```

*Making Commit to repo in local repo*
```bash 
git commit -m "add new file" 
```

*push to master branch*
```bash 
git push origin master 
```

## Git Setup

* Download the git from [here](https://sourceforge.net/projects/git-osx-installer/files/) or you can do it using brew 
```bash
brew install git
```
* Install the git on the mac using installer
* After installation check the verison of git 
```bash
MacBook-Pro:~ vssrivastava$ git --version
git version 2.24.3 (Apple Git-128)
```

## SSH-key

* First of all you need to create ssh-key for all the users you are going to use
   
```bash
cd ~/.ssh
ssh-keygen -b 2048 -t rsa -C "$personal_email" -f "${name}-personal" -q -N ""
ssh-keygen -b 2048 -t rsa -C "$another_email" -f "${name}-another" -q -N ""
ssh-keygen -b 2048 -t rsa -C "$work_email" -f "${name}-work" -q -N ""

ssh-add -D  
ssh-add -K ~/.ssh/${name}-personal
ssh-add -K ~/.ssh/${name}-another
ssh-add -K ~/.ssh/${name}-work
#list the users keyadded
ssh-add -l
```

* As you have seen above, I have created ssh-keys for 3 account two are personal and one is work related.
* Now you need to login to each of github account and add the ssh keys into `Github -> Setting -> SSH and GPG keys`

## ConfigFile

* One you add them to github all you need to do is create a config file inside `.ssh`

```bash
echo """
 #personal account
 Host github.com
	HostName github.com
        User git
        IdentityFile ~/.ssh/${name}-personal

 #another account
 Host github.com-${name}-another
        HostName github.com
        User git
        IdentityFile ~/.ssh/${name}-another


 #work account
 Host github.com-${name}-work
        HostName github.com
        User git
        IdentityFile ~/.ssh/${name}-work""" >> ~/.ssh/config
```

## Git Configuration

* We need to create the `.gitconfig` file for all the users 
   
```bash
#Here you need to change few things like 
#work_path: where you do all your work related stuff
#another_path: another personal user path
echo """
[user]
    name = $name
    email = $personal_email

[includeIf "gitdir:$work_path"]
    path = $work_path/.gitconfig

[includeIf "gitdir:$another_path"]
    path = $another_path/.gitconfig """ >> ~/.gitconfig

echo """
[user]
    name = $name
    email = $work_email """ >> $work_path/.gitconfig

echo """
[user]
    name = $name
    email = $another_personal """ >> $another_path/.gitconfig
```

# Validation

* Check if you are able to access all the accounts

```bash
# Validation

MacBook-Pro:~$ ssh -T github.com
Hi vikassri! You have successfully authenticated, but GitHub does not provide shell access.

# try all the githubs, you will get above response
ssh -T github.com
ssh -T github.com-${name}-another
ssh -T github.com-${name}-work
```

## Final Step

* Now you have everything setup, all you need to do it to change repo url whenever you are cloning and rest will automatically taken care

```bash
# for first account
git clone git@github.com:$name/testrepo.git

# for second account
git clone git@github.com-${name}-another:$name/testrepo.git

# for work account
git clone git@github.com-${name}-work:$name/testrepo.git
```
* Rest everything will be same and you can try doing add and update it will take the correct username and email, just remember for second and work account, it will use the correct name when you will be in respective path which you have provided in `## Git Configuration`