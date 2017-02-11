var router =require('express').Router();
var cli=require('redis').createClient({db:1});
var async=require('async');
var Ep=require('eventproxy');

module.exports = router;

router.get('/', function (req, res, next) {
    var p=req.query.p?parseInt(req.query.p):1;
    var limit=10;

    async.waterfall([
        (cb)=> {
            async.parallel({
                total:(pcb)=>{
                    cli.zcard('postIds',(err,total)=>{
                        //console.log('total:',err,total);
                        if(err)return cb(err);
                        pcb(null,total);
                    })
                },
                ids:(pcb)=>{
                    //console.log('skip:',limit*(p-1), limit*p-1);
                    cli.zrevrange('postIds', limit*(p-1), limit*p-1, (err, ids)=> {
                        //console.log('postIds:',err,ids);
                        if (err)return cb(err);
                        pcb(null, ids);
                    });
                }
            },(err,ret)=>{
                //console.log('total ret:',err,ret);
                if(err)return cb(err);
                cb(null,ret);
            })
        },
        (ret,cb)=>{
            async.map(ret.ids,(id,ecb)=>{
                cli.hgetall('posts:'+id,(err,post)=>{
                    //console.log('posts:'+id,err,id);
                    //console.log(post.id);
                    if(err)return next(err);
                    ecb(null,post);
                });
            },(err,posts)=>{
                if(err)return next(err);
                posts.forEach((post)=>{
                    //console.log('post:',post);
                    post.tags=post.tags.length?post.tags.split(',').map((tag)=>{
                        return {
                            name:tag,
                            curr:false
                        }
                    }):[];
                    //console.log('post title:',post.title);
                });
                ret.posts=posts;
                cb(null,ret);
            });
        }
    ],(err,ret)=>{
        //console.log('result:',err,ret);
        if(err)return next(err);

        var pageCnt=Math.ceil(ret.total/limit);
        var page={
            curr:p,
            total:pageCnt,
            pages:(()=>{
                var i=1,pages=[];
                while(i<=pageCnt){
                    pages.push({num:i,isCurr:i==p});
                    i++;
                }
                return pages;
            })(),
            path:'/?',
            first:'p=1',
            prev:'p='+(p-1),
            next:'p='+(p+1),
            last:'p='+pageCnt,
            isFirstPage:p==1,
            isLastPage:(p-1)*limit+ret.posts.length>=ret.total
        };
        //console.log('page:',page);

        res.render('index',{
            title:'Home',
            posts:ret.posts,
            page:page,
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
});

