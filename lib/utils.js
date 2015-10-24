module.exports = Utils;

var prompt = require('inquirer').prompt;
var fs = require('fs');
var path = require('path');

function Utils() {
}

Utils.selectDataSource = function(app, cb) {
  var cidx = 0;
  var choices = [];
  var dataSources = {};

  for ( var d in app.dataSources) {
    if (!dataSources[d.toLowerCase()])
      dataSources[d.toLowerCase()] = app.dataSources[d];
  }

  for ( var ds in dataSources) {
    choices.push({
      key : ds,
      name : ds,
      value : cidx++
    });
  }

  choices.push({
    key : 'none',
    name : 'Cancel',
    value : cidx++
  });

  prompt([ {
    type : 'list',
    message : 'Data sources',
    name : 'ds',
    filter : Number,
    choices : choices
  } ], function(editing) {

    var dsList = Object.keys(dataSources);

    if (editing.ds < dsList.length) {
      cb(dsList[editing.ds]);
    } else
      cb(null);
  });
}

Utils.selectPublicModels = function(models, cb) {
  var choices = [];

  for ( var m in models) {
    choices.push({
      key : models[m].name,
      name : models[m].name,
      checked : models[m].isPublic || false,
      value : m
    });
  }

  prompt([ {
    type : 'checkbox',
    message : 'Select public models',
    name : 'models',
    choices : choices
  } ], function(editing) {
    var i = 0;

    for (i in models) {
      models[i].isPublic = false;
    }

    for (i in editing.models) {
      models[editing.models[i]].isPublic = true;
    }
    cb(models);
  });
}

Utils.fileExists = function(filePath) {
  try {
    fs.accessSync(filePath, fs.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

Utils.mkDir = function(dirPath) {
  var paths = dirPath.split(path.sep);
  var dir = '';

  for ( var i in paths) {
    dir += paths[i] + path.sep;
    if (!Utils.fileExists(dir))
      fs.mkdirSync(dir);
  }
}
