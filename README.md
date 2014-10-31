pcpdash
=======

Web Dashboard for [Performance Co-Pilot (PCP)](http://www.performancecopilot.org/)

Using some of the most common web technologies, provide a web dashboard
for the purposes of viewing a range of metrics managed by PCP.

Makes use of the following technologies:

* [node](http://nodejs.org)
* [bootstrap](http://getbootstrap.com)
* [d3](http://d3js.org)
* [jquery](http://jquery.com)

## Getting Started
 
**pcpdash requires a working web API!**
 
On RHEL systems, the following commands will get you started:

```bash
yum install pcp pcp-webapi pcp-manager
chkconfig pmcd on
chkconfig pmwebd on
service pmcd start
service pmwebd start
```

Test the PCP installation by running the following:
```bash
pcp
pmprobe
pminfo
```

Also consider installing the following packages for debugging utilities:
```bash
yum install pcp-gui
```

## Launch pcpdash

```bash
git clone http://github.com/dspinoz/pcpdash.git
cd pcpdash
npm install
bower install
node server.js
```

When using yum to manage node packages, ensure the following

```bash
export NODE_PATH=/usr/local/lib/node_modules:/usr/lib/node_modules
```

