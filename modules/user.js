var Db=require('./db');
var Pool=require('generic-pool').Pool;
var pool=new Pool({
    name:'mongodbPool',
    create: function (cb) {
        var mdb=Db();
        mdb.open(function (err, db) {
            cb(err,db);
        });
    },
    destory: function (mdb) {
        mdb.close();
    },
    max:100,
    min:5,
    idleTimeoutMills:30000,
    log:false
});
var mock=require('./mock');
var crypto=require('crypto');
var async=require('async');

function User(user){
    var d=new Date();
    this.name=user.name;
    this.password=user.password;
    this.email=user.email;
    this.face=user.face || '/images/faces/'+Math.ceil(Math.random()*10)+'.jpg';
    this.regDate=user.regDate || d;
    this.regTime=user.regTime || mock.dateFormat(d,'all',true);
    this.postCnt=user.postCnt || 0;
}

module.exports=User;

User.prototype.toJSON= function () {
    return {
        name:this.name,
        email:this.email,
        regTime:this.regTime
    }
};

User.prototype.save= function (saveCb) {
    var user=this;

    async.waterfall([
            function (cb) {
                pool.acquire(function (err, db) {
                    if(err)return cb(err);
                    cb(null,db);
                });
            },
            function (db,cb) {
                db.collection('users', function (err, collection) {
                    if(err){
                        pool.release(db);
                        return cb(err);
                    }
                    user.password=crypto.createHash('md5').update(user.password).digest('hex');
                    collection.insert(user,{safe:true}, function (err) {
                        pool.release(db);
                        if(err)return cb(err);
                        cb(null);
                    });
                });
            }
        ],
        function (err,ret) {
            if(err)saveCb(err);
            else saveCb(null);
        }
    );
};

User.get= function (name,cb) {
    pool.acquire(function (err, db) {
        if(err)return cb(err);

        db.collection('users', function (err, collection) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            collection.findOne({name:name}, function (err, doc) {
                pool.release(db);
                if(doc){
                    console.log('User.get:',doc);
                    cb(err,doc);
                }else{
                    cb(err,null);
                }
            });
        });
    });
};

User.getAll = function (cb) {
    pool.acquire(function (err, db) {
        if(err)return cb(err);

        db.collection('posts', function (err, collection) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            collection.find({}, function (err, doc) {
                pool.release(db);
                if(doc){
                    console.log('User.getAll:',doc);
                    cb(err,doc);
                }else{
                    cb(err,null);
                }
            });
        });
    });
};
