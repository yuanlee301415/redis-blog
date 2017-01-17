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
var ObjectID=require('mongodb').ObjectID;
var mock=require('./mock');

function Comment(_id,user,content){
    var d=new Date();
    this._id=_id;
    this.user=user;
    this.content=content;
    this.time=mock.dateFormat(d,'all',true);
}

module.exports=Comment;

Comment.prototype.save= function (cb) {
    var comment=this;
    pool.acquire(function (err, db) {
        if(err)return cb(err);

        db.collection('posts', function (err, coll) {
            if(err){
                pool.release(db);
                console.error('Comment error 1:',err);
                return cb(err);
            }

            coll.update({_id:new ObjectID(comment._id)},{$push:{comments:{user:comment.user,content:comment.content,time:comment.time}}}, function (err, ret) {
                pool.release(db);
                if(err){
                    console.error('Comment error 2:',err);
                    return cb(err);
                }
                cb(null,ret);
            });
        });
    });
}