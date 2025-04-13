---
layout: "post"
title: "Active Directory ACL Abuse with Kali Linux"
date: "2024-05-08"
description: 
authors: ["m8sec"]
categories: ["Windows"]
tags: ["active directory"]
image: 
    path: "/assets/img/categories/windows.png"
pin: false
---

Active Directory Access Control Lists (ACL), and their associated Access Control Entries (ACE), define the entities and permissions of a specific AD object. If misconfigured, abusing these permissions can be an easy way of escalating privileges within an organization.
![](/assets/img/posts/acl-abuse-with-kali/1.png){: .shadow width="500px"}


## Overview
Many of the articles and guides demonstrating Active Directory ACL abuse showcase exploitation from a Windows host. For good reason, PowerShell makes modification of vulnerable objects simple - especially when already connected to the domain.

However, what happens when a vulnerable object is identified and operators are confined to a Linux operating system? Thanks to [BloodHound.py](https://github.com/dirkjanm/BloodHound.py), this situation is becoming more common during penetration tests where only network level access is granted or otherwise attained.

This article provides a brief walk through on enumerating and exploiting "GenericAll" permissions against a vulnerable user object to successfully escalate privileges within Active Directory.


## Enumeration
As briefly mentioned, [BloodHound.py](https://github.com/dirkjanm/BloodHound.py) is an ingestor for [BloodHound](https://github.com/BloodHoundAD/BloodHound) created by [dirkjanm](https://github.com/dirkjanm). It makes use of the [Impacket](https://github.com/fortra/impacket) library to interact with and enumerate Active Directory environments.

Given Active Directorys authentication requirements to retrieve object data, testers must already have a set of credentials.

The following demonstrates enumeration of the `demo.local` domain from a Kali Linux host. This is being executed as the low-privileged, domain user `demo\user01`:

```bash
bloodhound-python -u user01 -p Password1! -d demo.local -c Acl -dc dc01.demo.local -ns 192.168.1.114
```

![](/assets/img/posts/acl-abuse-with-kali/2.png){: .shadow}

## Identifying GenericAll
After running [BloodHound.py](https://github.com/dirkjanm/BloodHound.py), which installs as `bloodhound-python`, the resulting `.json` reports can be loaded into BloodHounds Neo4j database to map the results.

*This is where things get interesting...*

When examining our compromised user `demo\user01`, the "Outbound Object Control" section exposed "GenericalAll" permissions over the `demo\service01` account.

GenericAll implies we have full rights over the `demo\service01` user object, which also happens to be a member of the privileged `demo\Domain Admins` group 😈.

![](/assets/img/posts/acl-abuse-with-kali/3.png){: .shadow}


## Exploitation
To exploit this position, we can leverage our `demo\user01` account to reset the password of `demo\service01` and escalate privileges to Domain Admin!

While several Linux utilities exist to reset the current users password, I struggled to find a tool that could reset passwords on behalf of another account.

This is when I came across [PShlyundin](https://github.com/PShlyundin)s [ldap_shell](https://github.com/PShlyundin/ldap_shell), a fork of [Fortra](https://github.com/fortra/impacket/blob/master/impacket/examples/ldap_shell.py)s project but designed to execute as a stand-alone program - outside of [ntlmrelayx](https://github.com/fortra/impacket/blob/master/examples/ntlmrelayx.py).

As demonstrated below, I leveraged the ldap_shell to initiate a shell on the domain controller over the LDAP protocol as `demo\user01`. Then abused our allotted permissions to reset the password of `demo\service01` via the `change_password` command:

![](/assets/img/posts/acl-abuse-with-kali/4.png){: .shadow}

These changes were confirmed with [CrackMapExec](https://github.com/byt3bl33d3r/CrackMapExec) to validate administrator privileges on the `demo.local` domain!

![](/assets/img/posts/acl-abuse-with-kali/5.png){: .shadow}


## After-Action Review
I wrote this post after encountering ALC abuse in a real-world scenario, and held onto it for a bit (likely too long). Whether it be time passed or the freedom of proper research, I have since found additional methods of forcing password resets on alternate accounts from a Linux host.

For example, [thehacker.recipes](https://www.thehacker.recipes) provides an entire section on [DACL abuse](https://www.thehacker.recipes/ad/movement/dacl) and demonstrates exploitation using the [Samba](https://www.samba.org/) suites built-in `net` utility via `net rpc password`.

That said, the ability to open an LDAP shell outside of [ntlmrelayx](https://github.com/fortra/impacket/blob/master/examples/ntlmrelayx.py) is still a good technique to have in your arsenal and provides more functionality than password resets to explore!
