pcpdash
=======

Web Dashboard for [Performance Co-Pilot (PCP)](http://pcp.io/)

Using some of the latest technologies, provide a web dashboard for the purposes of viewing a range of metrics managed by PCP and other tools. 

By integrating a range of tools, give system administrators and developers an extremly easy way to monitor a range of hosts, services and applications.

Makes use of the following open source tools and technologies:

* [pcp](http://www.pcp.io/)
* [node](http://nodejs.org)
* [d3](http://d3js.org)
* [bootstrap](http://getbootstrap.com)
* [jquery](http://jquery.com)
* [cube](http://square.github.io/cube/)
* [statsd](https://github.com/etsy/statsd/) __TODO__

## Contributing

Contributions are most welcome! Feel free to address any of the __TODO__'s.

## Documentation

__TODO__

* Services
* Configuration
* Web API
* Dashboard

## Getting Started with PCP
 
On RHEL6 systems, the following commands will get you started with pcp:

```bash
yum install pcp pcp-webapi pcp-manager pcp-gui
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

## Getting started with pcpdash

```bash
git clone http://github.com/dspinoz/pcpdash.git
cd pcpdash
```

## Preparing back-end

### Using npm

```bash
npm install
```

### Using yum

__TODO__ Create spec file, and build pcpdash rpm for easy installation with yum

```bash
git clone https://github.com/dspinoz/nodejs
cd nodejs
git checkout build
createrepo RPMS
cat > local.repo <<EOF
[local]
name=local-nodejs
baseurl=file://`pwd`/RPMS
enabled=1
gpgcheck=0
EOF
yum --config local.repo install nodejs-cube nodejs-queue-async mongodb-org nodejs-express nodejs-request nodejs-jade nodejs-statsd nodejs-statsd-cube-backend
```

When using yum to manage node packages, ensure the following

```bash
export NODE_PATH=/usr/local/lib/node_modules:/usr/lib/node_modules
```

## Preparing front-end

__TODO__ Don't require the use of bower when using yum

```bash
npm -g install bower
bower install
```

## Running pcpdash

```bash
./server.js
```

[http://localhost:8080](http://localhost:8080)
