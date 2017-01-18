var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var tags=require('../config.js').tags;
var Ep=require('eventproxy');
var cli=require('redis').createClient({db:1});
var uuid=require('uuid/v4');
var async=require('async');

module.exports = router;

//发表
router.get('/',checkLogin, function (req, res) {
  res.render('post',{title:'发表',tags:tags,user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});

router.post('/',checkLogin, function (req, res,next) {
    var ep=new Ep(),user=req.session.user,title=req.body.title.trim(),content=req.body.content.trim();
    ep.fail(next);
    ep.on('post_err',(msg)=>{
        req.flash('error','Save post error:'+msg);
        return res.redirect('/post');
    });
    ep.after('postIds','userPosts','posts','tags','archivesIndex','archives','postCount',()=>{
        req.flash('success','文章发表成功！');
        res.redirect('/post');
    });

    if(!title.length || !content.length)return ep.emit('post_err','标题或正文内容未填写');
    if(!postTags.length)return ep.emit('post_err','至少选择一个标签');

    //save
    var id=uuid(),date=Date.now();
    async.parallel({
        postIds:(cb)=>{
            cli.zadd(['postIds:'+id,+date,id],(err)=>{
                if(err)return cb(err);
                cb(null);
            });
        },
        userPosts:(cb)=>{
            cli.zadd(['userPosts:'+user.name,time,id],(err)=>{
                if(err)return cb(err);
                cb(null);
            });
        },
        posts:(cb)=>{
            cli.hmset('posts:'+id,['id',id,'userId',user.id,'userName',user.name,'title',title,'content',content,'time',moment()])
        }
    },(err,ret)=>{
        if(err)return console.log(err),ep.emit('post_err','保存POST错误');

    });



/*    var postTags=[];
    tags.forEach((tag)=>{
        if(req.body['tag-'+tag]){
            postTags.push(tag);
        }
    });*/
    /*cli.incr('posts:count',(err,ret)=>{
        console.log(err,ret);
    });*/
/*    cli.get('posts:count',(err,ret)=>{
        console.log(err,ret);
    });*/

/*  post=new Post({
    title:req.body.title,
    tags:req.body.tag,
    post:req.body.post,
    user:req.session.user
  });
  post.save(function (err) {
    if(err){
      req.flash('error','发表失败');
      return res.redirect('/post');
    };
    req.flash('success','发表成功');
    console.log('/post > post:',post);
    res.redirect('back');
  });*/
});
