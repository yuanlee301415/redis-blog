var Db=require('./db');
var Pool=require('generic-pool').Pool;
var pool=new Pool({
    name:'mongodbPool',
    create: function (cb) {
        var mdb=Db();
        mdb.open(function(err,db){
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
var async=require('async');
var markdown=require('markdown').markdown;
var _=require('underscore');
var mock=require('./mock');
var User=require('./user');

function Post(post){
    var d=new Date();
    this.title=post.title;
    this.post=post.post;
    this.user=post.user;
    this.date=post.date || d;
    this.time=post.time || mock.dateFormat(d,'all',true);
    this.comments=post.comments || [];
    this.tags=post.tags || [];
    this.pv=post.pv || 0;
    this.reprint={
        from:null,
        to:[]
    };
}

module.exports=Post;

Post.prototype.save= function (saveCb) {
    var post=this;
    async.waterfall([
        function(cb){
            pool.acquire(function (err, db) {
                if(err)return cb(err);
                cb(null,db);
            });
        },
        function (db,cb) {
            db.collection('posts', function (err, collection) {
                if(err){
                    pool.release(db);
                    return cb(err);
                }
                collection.insert(post,{safe:true}, function (err, result) {
                    pool.release(db);
                    if(err)return cb(err);
                    cb(null,result);
                });
            });
        }
    ], function (err, ret) {
        if(err){
            console.log('Post > err:'.error,err);
            return saveCb(err);
        }
        console.log('保存成功');
        saveCb(null,ret);
    });

}

Post.search= function (keyword,page,limit,cb) {
    if(!keyword || !keyword.trim().length)return cb({msg:'搜索关键词为空'});
    keyword=keyword.trim();
    if('\\'==keyword || "'"==keyword || /\W/.test(keyword))return cb({msg:'搜索关键词非法'});
    var query={
        title:RegExp(keyword,'i')
    };
    pool.acquire(function (err, db) {
        if(err)return cb(err);
        db.collection('posts', function (err, collection) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            collection.count(query, function (err, total) {
                if(err){
                    pool.release(db);
                    return cb(err);
                }
                collection.find(query,{
                    skip:(page-1)*limit,
                    limit:limit
                }).sort({date:-1}).toArray(function (err, docs) {
                    pool.release(db);
                    if(err)return cb(err);
                    docs.forEach(function (doc) {
                        doc.post=markdown.toHTML(doc.post);
                    });
                    //console.log('Search>posts:',docs);
                    cb(null,docs,total);
                });
            });
        });
    });
}

Post.getAll= function (name,page,limit,cb) {

    pool.acquire(function (err, db) {
        if(err)return cb(err);

        db.collection('posts', function (err, collection) {
            if(err){
                pool.release(db);
                return cb(err);
            }

            var query={};
            if(name){
                query['user.name']=name;
            }

            collection.count(query, function (err, total) {
                if(err){
                    pool.release(db);
                    return cb(err);
                }
                collection.find(query,{
                    skip:(page-1)*limit,
                    limit:limit
                }).sort({date:-1}).toArray(function (err, docs) {
                    pool.release(db);
                    if(err)return cb(err);
                    docs.forEach(function (doc) {
                        doc.post=markdown.toHTML(doc.post);
                    });
                    cb(null,docs,total);
                });
            });
        });
    });
}

Post.getOne= function (name,_id,cb,origin) {
    pool.acquire(function (err, db) {
        if(err)return cb(err);
        db.collection('posts', function (err, collection) {
           if(err){
               pool.release(db);
               return cb(err);
           }
            collection.findOne({
                'user.name':name,
                _id:new ObjectID(_id)
            }, function (err, doc) {
                if(err){
                    pool.release(db);
                    return cb(err);
                };

                if(!doc){
                    pool.release(db);
                    return cb({msg:'博客不存在'});
                };
                //console.log('Post.getOne>post:',doc);
                collection.update({_id:new ObjectID(_id)},{$inc:{pv:1}}, function (err) {
                    if(err){
                        pool.release(db);
                        return cb(err);
                    }
                    if(!origin){//显示成HTML格式
                        doc.post=markdown.toHTML(doc.post);
                    }
                    doc.comments.forEach(function (comment) {
                        comment.content=markdown.toHTML(comment.content);
                    });
                    cb(null,doc);
                });
            });
        });
    });
}


Post.update= function (_id,post,cb) {
    pool.acquire(function (err, db) {
        if(err)return cb(err);
        db.collection('posts', function (err, coll) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            coll.update({_id:new ObjectID(_id)},{$set:{post:post}}, function (err, ret) {
                pool.release(db);
                if(err)return cb(err);
                cb(null,ret);
            });
        });
    });
}

Post.remove=function(name,_id,cb){
    pool.acquire(function (err, db) {
        if(err)return cb(err);
        db.collection('posts', function (err, coll) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            coll.findOne({_id:new ObjectID(_id)}, function (err, doc) {
                if(err){
                    pool.release(db);
                    return cb(err);
                }
                //if(!ret.result.n)return cb({msg:'博客不存在'});//查询结果为0不会报错；更新不存在的文档不会报错

                coll.remove({_id:new ObjectID(_id)}, function (err) {
                    if(err){
                        pool.release(db);
                        return cb(err);
                    }
                    var fromId;
                    if(doc.reprint.from){//转载的文章
                        fromId=doc.reprint.from._id;
                        //更新原Blog的reprint.to数据
                        coll.update({_id:new ObjectID(fromId)},{$pull:{'reprint.to':{name:name}}}, function (err) {
                            pool.release(db);
                            if(err)return cb(err);
                            cb(null);
                        });
                    }else{//自己的原始文章
                        pool.release(db);
                        cb(null);
                    }

                });

            });

        });
    });
}


Post.getArchive= function (cb) {
    pool.acquire(function (err, db) {
        if(err)return cb(err);
        db.collection('posts', function (err, coll) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            coll.find().sort({date:-1}).toArray(function (err,docs) {
                pool.release(db);
                if(err)return cb(err);

                if(!docs.length)return cb(null,null);//无数据

                var list={};

                docs.forEach(function (doc) {
                    var d=doc.date,month=d.getMonth()+ 1,date;
                    month=month<10?'0'+month:month;
                    date=[d.getFullYear(),month].join('-');
                    if(!list[date])list[date]=[];
                    list[date].push({
                        _id:doc._id,
                        title:doc.title,
                        date:mock.dateFormat(d,'all',true),
                        user:doc.user
                    });
                });
                //console.log('getArchive:',list);
                cb(null,list);
            });
        });
    });
}

//获取所有标签
Post.getTags= function (cb) {
    pool.acquire(function (err, db) {
        if(err)return cb(err);
        db.collection('posts', function (err, coll) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            coll.distinct('tags', function (err, docs) {
                pool.release(db);
                if(err)return cb(err);
                cb(null,docs);
            });
        });
    });
}

//获取指定标签下的博客
Post.getTag= function (tag,page,limit,cb) {
    pool.acquire(function (err, db) {
        if(err)return cb(err);
        db.collection('posts', function (err, collection) {
            if(err){
                pool.release(db);
                return cb(err);
            }
            var query={tags:tag};
            collection.count(query, function (err, total) {
                if(err){
                    pool.release(db);
                    return cb(err);
                }
                collection.find(query,{
                    skip:(page-1)*limit,
                    limit:limit
                }).sort({date:-1}).toArray(function (err, docs) {
                    pool.release(db);
                    if(err){
                        return cb(err);
                    };
                    docs.forEach(function (doc) {
                        doc.post=markdown.toHTML(doc.post);
                    });
                    cb(null,docs,total);
                });
            });
        });
    });
}

Post.reprint= function (name, _id, cb) {
    User.get(name, function (err, user) {
        if(err)return cb(err);
        pool.acquire(function (err, db) {
            if(err)return cb(err);
            db.collection('posts', function (err, coll) {
                if(err){
                    pool.release(db);
                    return cb(err);
                };

                coll.findOne({_id:new ObjectID(_id)}, function (err, doc) {
                    if(err){
                        pool.release(db);
                        return cb(err);
                    }
                    //判断是否已经转载过（已转载过的文章，页面上不会显示“转载”链接，但要防止用户通过URL转载）
                    var yet=doc.reprint.to.find(function (item) {
                        return user.name===item.name;
                    });
                    if(yet){
                        pool.release(db);
                        return cb({yet:yet});
                    }
                    //整理Blog数据（1.删除_id/2.更新Id/3.更新时间）
                    var from={
                        name:doc.user.name,
                        userId:doc.user.id,
                        _id:doc._id
                    }

                    delete doc._id;
                    delete doc.id;
                    delete doc.comments;
                    delete doc.pv;
                    delete doc.date;
                    delete doc.time;

                    doc.user=user;
                    doc.title='[转载]'+doc.title;

                    var post=new Post(doc);
                    post.reprint.from=from;

                    //写入
                    coll.insert(post, function (err) {
                        if(err){
                            pool.release(db);
                            return cb(err);
                        }
                        //更新原Post的reprint.to数组
                        coll.update({_id:new ObjectID(from._id)},{$push:{'reprint.to':{name:user.name,userId:user.id,_id:new ObjectID(post._id)}}}, function (err,ret) {
                            pool.release(db);
                            if(err){
                                return cb(err);
                            }
                            cb(null,{user:user,post:post});
                        });

                    });

                });
            });
        });

    });
}