var path = require('path');
var fs = require('fs');
var utils = require('./utils.js');

module.exports = Discoverer;

function Discoverer() {
  this.app = null;
  this.appPath = null;
  this.modelConfig = null;
  this.dsName = null;
  this.dataSource = null;
}

Discoverer.prototype.setApp = function(appPath) {
  try {
    this.app = require(path.join(appPath, 'server/server.js'));
    this.appPath = appPath;
  } catch (err) {
    throw new Error('No loopback application found at: ' + appPath);
  }
}

Discoverer.prototype.setDataSource = function(dsName) {
  if (!dsName)
    throw new Error('Invalid data source.');

  if (!this.app)
    throw new Error('Application not set.');

  for ( var src in this.app.dataSources) {
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

Discoverer.prototype.loadModelConfiguration = function() {
  if (!this.appPath)
    throw new Error('Application not set.');

  // require somehow manage to leave out the _meta entry
  this.modelConfig = JSON.parse(fs.readFileSync(path.resolve(this.appPath,
      'server/model-config.json')));

  return this.modelConfig;

};

Discoverer.prototype.saveModelConfiguration = function() {
  if (!this.appPath)
    throw new Error('Application not set.');

  if (!this.modelConfig)
    throw new Error('Model configuration not loaded.');

  fs.writeFileSync(path.resolve(this.appPath, 'server/model-config.json'), JSON
      .stringify(this.modelConfig, null, '\t'));
};

Discoverer.prototype.addModel = function(model) {
  if (!this.modelConfig)
    throw new Error('Model configuration not loaded.');

  if (!this.modelConfig[model.name]) {
    this.modelConfig[model.name] = {
      dataSource : this.dsName,
      'public' : model.isPublic || false
    };
  } else {
    this.modelConfig[model.name].dataSource = this.dsName;
    this.modelConfig[model.name].public = model.isPublic || false;
  }
}

Discoverer.prototype.updateModels = function(newModels) {
  for ( var m in newModels) {
    this.addModel(newModels[m]);
  }
}

Discoverer.prototype.discoverModels = function(overwrite, cb) {
  if (!this.dataSource) {
    cb(new Error('Data source not set.'));
    return;
  }

  var self = this;
  var models = [];
  var modelsPath = path.join(this.appPath, 'common/models');
  var list = {
    idx : 0
  };

  if (!utils.fileExists(modelsPath)) {
    try {
      utils.mkDir(modelsPath);
    } catch (err) {
      cb(err);
    }
  }

  var discoverModelFromList = function(ds, list, cb) {
    var table = list.tables[list.idx];
    ds.discoverAndBuildModels(table.name, {}, function(err, models) {
      if (err !== null) {
        cb(err);
      } else {
        var modelName = Object.keys(models)[0];
        cb(null, models[modelName].definition);
      }
    });
  };

  var saveModel = function(err, model) {
    if (err !== null)
      cb(err);
    else {
      var modelPath = path.join(modelsPath, model.name + '.json');

      if (!utils.fileExists(modelPath) || overwrite === true) {
        console.log('Save definition for model: ' + model.name);
        models.push(model);

        fs.writeFileSync(modelPath, JSON.stringify(model, null, '\t'));
        if (++list.idx === list.tables.length)
          cb(null, models);
        else
          discoverModelFromList(self.dataSource, list, saveModel);

      } else {
        console.log('Skip definition for existing model: ' + model.name);

        if (++list.idx === list.tables.length) {
          cb(null, models);
        } else
          discoverModelFromList(self.dataSource, list, saveModel);
      }
    }
  };

  self.dataSource.connector.discoverModelDefinitions(function(err, tables) {
    if (err !== null)
      cb(err);
    else {
      list.tables = tables;
      discoverModelFromList(self.dataSource, list, saveModel);
    }
  });
}
