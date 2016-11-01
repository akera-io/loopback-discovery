##loopback-discovery
 `loopback-discovery` is a command prompt discovery script for the 
 [LoopBack] (https://github.com/strongloop/loopback/) framework.

##Installation
````sh
npm install -g loopback-discovery
````

##Basic use

The script can discover models from data sources defined on a StrongLoop
application from command line. This is mainly for overcoming missing 
support for 'non-supported' connectors in StrongLoop's 
[Arc] (https://github.com/strongloop/strong-arc) GUI interface.

* To run model discovery for `sports` data source inside a StrongLoop application
available in current folder.

```bash
$ loopback-discovery
```
With this new models from sports data source will be discovered, the one that already 
exists are being skipped. Once discovered the user gets to select the ones that are 
going to be publicly exposed through the REST interface.

* To run model discovery for `sports` data source inside a StrongLoop application
available in `/opt/strongloop/sports`.

```bash
$ loopback-discovery -d sports /opt/strongloop/sports
```
 
* To run model discovery for `sports` data source inside a StrongLoop application
available in `/opt/strongloop/sports` while overwriting existing model definition.

```bash
$ loopback-discovery -o -d sports /opt/strongloop/sports
```

* By default the schema used in connection connection definition is used for discovery, however some
loopback connectors can support additional discovery options:
	- `all`: to use all owners/schemas for discovery use `-a` command option
	- `views`: to include views in discovery use `-v` command option

```bash
$ loopback-discovery -a -v -d sports /opt/strongloop/sports
```

For information on configuring the connector in a LoopBack application, 
please refer to [LoopBack documentation](https://docs.strongloop.com/display/public/LB/Connecting+models+to+data+sources).

##Tests:
To run the test suite set-up the test StrongLoop application in `test` folder:

```bash
$ cd test/slc-app
$ npm install
```

Update `sports` data source configuration in `test/slc-app/server/data-sources.json`
to a connection locally available. 

```json
"sports": {
    "host": "10.10.10.6",
    "port": 37900,
    "database": "sports2000",
    "name": "sports",
    "connector": "loopback-connector-akera"
  }
```

Run the test scripts.

```bash
$ npm test
```