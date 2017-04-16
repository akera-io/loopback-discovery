var path = require('path');
var fs = require('fs');
var async = require('async');
var utils = require('./utils.js');

module.exports = Discoverer;

function Discoverer() {
  this.app = null;
  this.appPath = null;
  this.modelConfig = null;
  this.dsName = null;
  this.dataSource = null;
}

Discoverer.prototype.setApp = function (appPath) {
  try {
    this.app = require(path.join(appPath, 'server/server.js'));
    this.appPath = appPath;
  } catch (err) {
    throw new Error('No loopback application found at: ' + appPath);
  }
}

Discoverer.prototype.setDataSource = function (dsName) {
  if (!dsName)
    throw new Error('Invalid data source.');

  if (!this.app)
    throw new Error('Application not set.');

  for (var src in this.app.dataSources) {
    if (dsName.toLowerCase() === src.toLowerCase()) {
      if (typeof this.app.dataSources[src].connector.discoverModelDefinitions !== 'function')
        throw new Error('Data source connector do not support discovery.');

      this.dsName = dsName;
      this.dataSource = this.app.dataSources[src];

      return;
    }
  }

  throw new Error('Datasource not found in application.');
};

Discoverer.prototype.loadModelConfiguration = function () {
  if (!this.appPath)
    throw new Error('Application not set.');

  // require somehow manage to leave out the _meta entry
  this.modelConfig = JSON.parse(fs.readFileSync(path.resolve(this.appPath,
    'server/model-config.json')));

  return this.modelConfig;

};

Discoverer.prototype.saveModelConfiguration = function () {
  if (!this.appPath)
    throw new Error('Application not set.');

  if (!this.modelConfig)
    throw new Error('Model configuration not loaded.');

  fs.writeFileSync(path.resolve(this.appPath, 'server/model-config.json'), JSON
    .stringify(this.modelConfig, null, '\t'));
};

Discoverer.prototype.addModel = function (model) {
  if (!this.modelConfig)
    throw new Error('Model configuration not loaded.');

  if (!this.modelConfig[model.name]) {
    this.modelConfig[model.name] = {
      dataSource: this.dsName,
      'public': model.isPublic || false
    };
  } else {
    this.modelConfig[model.name].dataSource = this.dsName;
    this.modelConfig[model.name].public = model.isPublic || false;
  }
}

Discoverer.prototype.updateModels = function (newModels) {
  for (var m in newModels) {
    this.addModel(newModels[m]);
  }
}

Discoverer.prototype.casePropertiesDataType = function (model) {
  // somehow looks like when saving the model loopback expects lowercase
  // data types
  for (var p in model.properties) {
    // property type is a function
    var type = model.properties[p].type.name;
    model.properties[p].type = type.toLowerCase();
  }
};

Discoverer.prototype.saveModel = function (modelsPath, model, overwrite, cb) {
  try {
    var modelPath = path.join(modelsPath, model.name + '.json');

    if (!utils.fileExists(modelPath) || overwrite === true) {
      console.log('Save definition for model: ' + model.name);
      this.casePropertiesDataType(model);

      fs.writeFileSync(modelPath, JSON.stringify(model, null, '\t'));
      cb(null, model);
    } else {
      console.log('Skip definition for existing model: ' + model.name);
      cb(null, null);
    }
  } catch (err) {
    cb(err);
  }
};

Discoverer.prototype.discoverModels = function (options, cb) {
  var self = this;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  try {
    if (options.appPath)
      this.setApp(options.appPath);

    if (options.dataSource)
      this.setDataSource(options.dataSource);

  } catch (err) {
    return cb(err);
  }

  if (!this.dataSource)
    return cb(new Error('Data source not set.'));

  options.schema = self.dataSource.settings && self.dataSource.settings.database;

  self.dataSource.connector.discoverModelDefinitions(options, function (err, tables) {
    if (err) {
      cb(err);
    } else {
      if (options.tablesList !== undefined && options.tablesList !== null) {
        tables = tables.filter(function (table) {
          var idx = options.tablesList.indexOf(table.name);

          if (idx === -1)
            return false;

          options.tablesList.splice(idx, 1);
          return true;
        });

        if (options.tablesList.length > 0)
          return cb(new Error('Tables not found: ' + options.tablesList.join(', ')));

      }

      async.mapSeries(tables, function (table, callback) {
        self.dataSource.discoverAndBuildModels(table.name, {}, function (err, models) {
          if (err !== null) {
            callback(err);
          } else {
            var modelName = Object.keys(models)[0];

            callback(null, models[modelName].definition);
          }
        });
      }, function (err, models) {
        var modelsPath = path.join(self.appPath, 'common/models');

        if (!utils.fileExists(modelsPath)) {
          try {
            utils.mkDir(modelsPath);
          } catch (err) {
            return cb(new Error('Unable to create models folder'));
          }
        }

        // save models definition
        async.eachSeries(models, function (model, callback) {
          self.saveModel(modelsPath, model, options.overwrite, callback);
        }, function (err) {
          if (err)
            cb(err);
          else
            cb(null, models);
        });
      });
    }
  });
}