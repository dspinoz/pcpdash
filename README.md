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
 
On RHEL systems, the following commands will get you started:

```bash
yum install pcp pcp-webapi
service pmcd start
service pmwebd start
```

Test the PCP installation by running the following
```bash
pcp
pmprobe
pminfo
```

**pcpdash requires a working web API!**

## Launch pcpdash

```bash
git clone http://github.com/dspinoz/pcpdash.git
cd pcpdash
npm install
bower install
node server.js
```
