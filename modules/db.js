var config=require('../config');
var Db=require('mongodb').Db;
var Server=require('mongodb').Server;

module.exports= function () {
    return new Db(config.db,new Server(config.host,config.port),{safe:true,poolSize:1});
};