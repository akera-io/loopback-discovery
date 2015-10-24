var path = require('path');
var utils = require('./lib/utils.js');
var Discoverer = require('./lib/discoverer.js');

var appPath = null;
var dsName = null;
var overwrite = false;

for (var i = 2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
  case '-o':
    overwrite = true;
    break;
  case '-d':
    dsName = process.argv[++i];
    break;
  case '-h':
  case '--help':
    printUsage();
    break;
  default:
    if (appPath === null)
      appPath = path.resolve(process.argv[i]);
    else
      printUsage();
  }
}

appPath = appPath || process.cwd();

var discoverer = new Discoverer();

process.on('uncaughtException', function(err) {
  checkError(err);
});

discoverer.setApp(appPath);

setDatasource(discoverer, dsName, function(err, set) {
  checkError(err);

  if (!set)
    console.log('Discovery canceled.');

  discoverer.loadModelConfiguration();

  discoverer.discoverModels(overwrite, function(err, models) {
    checkError(err);

    if (models && models.length > 0) {

      // check the ones already set as public (update)
      for ( var m in models) {
        models[m].isPublic = discoverer.modelConfig[models[m].name].public;
      }

      utils.selectPublicModels(models, function(models) {
        discoverer.updateModels(models);
        discoverer.saveModelConfiguration();
        console.log('Discovery completed.');
        process.exit(0);
      });
    } else {
      console.log('No models discovered.');
      process.exit(0);
    }
  });
});

function setDatasource(discoverer, dsName, callback) {
  if (dsName !== null) {
    try {
      discoverer.setDataSource(dsName);
      callback(null, true);
    } catch (err) {
      callback(err);
    }
  } else {
    utils.selectDataSource(discoverer.app, function(dsName) {
      if (!dsName)
        callback(null, false);
      else
        setDatasource(discoverer, dsName, callback);
    });
  }

}

function checkError(err) {
  if (err) {
    console.log(err.message);
    process.exit(1);
  }
}

function printUsage() {
  console.log('LoopBack model discovery script.');
  console.log('');
  console.log('> loopback-discovery [-o] [-d datasource] loopbackAppPath');
  console.log('');
  console.log('  use "-o" option to overwrite existing definitions');
  console.log('  use "-d" option to select the datasource');
  process.exit(0);
}
