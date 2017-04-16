var should = require('should');
var path = require('path');
var Discoverer = require('../lib/discoverer.js');

describe('LoopBack discovery', function () {

  it('setApp - should throw if invalid', function () {
    (function () {
      var d = new Discoverer();
      d.setApp(__dirname);
    }).should.throw();
  });

  it('setApp - should not throw if valid', function (done) {
    this.timeout(30000);

    try {
      var d = new Discoverer();
      d.setApp(path.join(__dirname, 'slc-app'));
      done();
    } catch (err) {
      done(err);
    }
  });


  it('setDataSource - should throw if app not set', function () {
    (function () {
      var d = new Discoverer();
      d.setDataSource('db');
    }).should.throw();
  });

  it('setDataSource - should throw if invalid', function () {
    (function () {
      var d = new Discoverer();
      d.setApp(path.join(__dirname, 'slc-app'));
      d.setDataSource('invalid');
    }).should.throw();
  });

  it('setDataSource - should throw if discovery not supported', function () {
    (function () {
      var d = new Discoverer();
      d.setApp(path.join(__dirname, 'slc-app'));
      d.setDataSource('db');
    }).should.throw();
  });

  it('setDataSource - should not throw if valid', function () {
    (function () {
      var d = new Discoverer();
      d.setApp(path.join(__dirname, 'slc-app'));
      d.setDataSource('sports');
    }).should.not.throw();
  });

  it('loadModelConfiguration - should throw if app not set', function () {
    (function () {
      var d = new Discoverer();
      d.loadModelConfiguration();
    }).should.throw();
  });

  it('loadModelConfiguration - should not throw if valid', function () {
    (function () {
      var d = new Discoverer();
      d.setApp(path.join(__dirname, 'slc-app'));
      d.loadModelConfiguration();
    }).should.not.throw();
  });

  it('saveModelConfiguration - should throw if app not set', function () {
    (function () {
      var d = new Discoverer();
      d.saveModelConfiguration();
    }).should.throw();
  });

  it('saveModelConfiguration - should throw if not loaded', function () {
    (function () {
      var d = new Discoverer();
      d.setApp(path.join(__dirname, 'slc-app'));
      d.saveModelConfiguration();
    }).should.throw();
  });

  it('saveModelConfiguration - should not throw if loaded', function () {
    (function () {
      var d = new Discoverer();
      d.setApp(path.join(__dirname, 'slc-app'));
      d.loadModelConfiguration();
      d.saveModelConfiguration();
    }).should.not.throw();
  });

  it('discoverModels - should throw if datasource not set', function (done) {

    var d = new Discoverer();
    d.setApp(path.join(__dirname, 'slc-app'));
    d.discoverModels(false, function (err, models) {
      should(err).be.instanceOf(Object);
      done();
    });
  });

  it('discoverModels - should discover new tables from datasource', function (done) {
    this.timeout(30000);

    var d = new Discoverer();
    d.setApp(path.join(__dirname, 'slc-app'));
    d.setDataSource('sports');

    try {
      d.discoverModels(true, function (err, models) {

        should(err).be.null();
        should(models).be.instanceOf(Array);
        d.loadModelConfiguration();
        d.updateModels(models);
        d.saveModelConfiguration();
        done();
      });
    } catch (err) {
      done(err);
    }
  });

  it('discoverModels - should fail if not all tables found in datasource', function (done) {
    this.timeout(30000);

    var d = new Discoverer();
    d.setApp(path.join(__dirname, 'slc-app'));
    d.setDataSource('sports');

    try {
      d.discoverModels({
        tablesList: ['toto', 'Order']
      }, function (err, models) {
          should(err).not.be.null();
          done();
      });
    } catch (err) {
      done(err);
    }
  });

  it('discoverModels - should only use tables specified', function (done) {
    this.timeout(30000);

    var d = new Discoverer();
    d.setApp(path.join(__dirname, 'slc-app'));
    d.setDataSource('sports');

    try {
      d.discoverModels({
        tablesList: ['Customer', 'Order']
      }, function (err, models) {
          should(err).be.null();
          should(models).be.instanceOf(Array);
          should(models.length).be.equal(2);
          done();
      });
    } catch (err) {
      done(err);
    }
  });

  it('discoverModels - should discover new tables from datasource', function (done) {
    this.timeout(30000);

    var d = new Discoverer();
    d.setApp(path.join(__dirname, 'slc-app'));
    d.setDataSource('sports');

    try {
      d.discoverModels(false, function (err, models) {

        should(err).be.null();
        should(models).be.instanceOf(Array);
        should(models.length).be.equal(0);

        done();
      });
    } catch (err) {
      done(err);
    }
  });

  it('discoverModels - should discover new tables from mysql datasource', function (done) {
    this.timeout(30000);

    var d = new Discoverer();
    d.setApp(path.join(__dirname, 'slc-app'));
    d.setDataSource('mysql');

    try {
      d.discoverModels({
        views: true,
        overwrite: true
      }, function (err, models) {

        should(models).be.instanceOf(Array);
        d.loadModelConfiguration();
        d.updateModels(models);
        d.saveModelConfiguration();
        done();
      });
    } catch (err) {
      done(err);
    }
  });
});