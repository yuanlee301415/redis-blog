var crypto=require('crypto');
var mock=require('./mock');
var mdb=require('./db');
var _=require('underscore');
var User=require('./user');
var Post=require('./post');

module.exports=(function mockDataIIFE(){
    console.log('mockDataIIFE'.info);
    var self,callback,startTime,users,posts,dataBase;
    return {
        mtDate:function(start,end){
            start=start ||new Date(2000,9,1);
            end=end || new Date(2016,3,15);
            return new Date(_.random(+start,+end));
        },
        mtTags:function () {
            var tags=['Javascript','Node.js','Express','MongoDB','AngularJS','PHP','WEB','HTML5','CSS3','App','JSLint','CSSLint','JSMin','LAMP','JSDoc','jQuery','YUI','ExtJS','Mootools','Jasmine','MVC','IE','Chrome','Firefox','Webkit','Photoshop','Python','Ruby','JSONP','HTTP','ES6','CMD','AMD','PageSpeed'];
            return _.shuffle(tags).slice(0, _.random(0,5));
        },

        run: function (cb) {
            console.log('run'.info);
            callback=cb;
            self=this;
            self.openDB();
            startTime=Date.now();
            return this;
        },

        openDB: function () {
            mdb.open(function (err, db) {
                if(err)return callback(err);
                dataBase=db;
                self.newUser();
            });
        },

        newUser: function () {
            console.log('newUser'.info);
            users=[];

            (function newUserIIFE(){
                if(users.length>=10){
                    //console.log('users:',users);
                    return self.insert(users,'users',self.newPost);
                };
                var name=mock.first();
                var date=self.mtDate();
                var user={
                    id:crypto.createHash('md5').update(name+Date.now()+Math.random()).digest('hex'),
                    name:name,
                    password:crypto.createHash('md5').update('aaa').digest('hex'),
                    email:mock.email(),
                    regDate:date,
                    regTime:mock.dateFormat(date,'all',true),
                    face:'/images/faces/'+ _.random(1,10)+'.jpg',
                    postCnt: _.random(0,10)
                };
                users.push(user);
                newUserIIFE();
            })();
        },

        newPost: function () {
            var uIdx= 0;
            posts=[];
            (function eachUserIIFE(){
                var user=users[uIdx];
                if(uIdx>=users.length){
                    //根据时间排序并写入DB
                    posts.sort(function (a, b) {
                        return a.date - b.date;
                    });
                    //console.log('posts:'.info,posts);
                    self.insert(posts,'posts',self.finish);
                    return;
                };

                var postIdx= 0,postCnt=user.postCnt;
                (function newPostIIFE(){
                    if(postIdx>=postCnt){
                        uIdx++;
                        return eachUserIIFE();
                    };
                    var postDate=self.mtDate(user.regDate);
                    var title=mock.statement();
                    var post={
                        id:crypto.createHash('md5').update(user.name+title+Date.now()+Math.random()).digest('hex'),
                        title:title,
                        post: _.times(_.random(2,5), function () {
                            return mock.text(50,100)
                        }).join('\r\n\r\n'),
                        user:user,
                        date:postDate,
                        time:mock.dateFormat(postDate,'date',true),
                        comments:self.newComments(postDate),
                        tags:self.mtTags(),
                        pv: _.random(0,100)
                    };
                    posts.push(post);
                    postIdx++;
                    newPostIIFE();
                })();

            })();
        },

        newComments: function (startDate) {
            return _.times(_.random(2,5), function () {
                var commentUser= _.sample(users),commentDate=self.mtDate(startDate),commentTime=mock.dateFormat(commentDate,'date',true);
                //更新postDate，使其下一次生成的随机时间在这个时间之后
                startDate=commentDate;
                return {
                    user:commentUser,
                    content:mock.text(20,200),
                    time:commentTime
                }
            });
        },

        insert: function (list,collectionName,cb) {
            console.log('insert:'.info,collectionName);
            dataBase.collection(collectionName, function (err, coll) {
                if(err)return callback(err);

                var idx= 0,item;
                (function insertIIFE() {
                    if(idx>=list.length)return cb();
                    item=list[idx];

                    coll.insert(item, function (err) {
                        if(err){
                            mdb.close();
                            return callback(err);
                        }
                        idx++;
                        insertIIFE();
                    });
                })();
            });
        },

        finish: function () {
            callback(null,{
                time:Date.now()-startTime,
                users:users,
                posts:posts
            });
        }
    }
})();