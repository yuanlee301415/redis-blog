var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var checkNotLogin = require('../middleware/checkNotLogin');
var cli=require('redis').createClient({db:1});
var Ep=require('eventproxy');
module.exports = router;

//Login
router.get('/',checkNotLogin, function (req, res) {
  res.render('login',{title:'登录',refer:req.query.refer,user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});

router.post('/',checkNotLogin, function (req, res,next) {
  var name=req.body.name,password=crypto.createHash('md5').update(req.body.password).digest('hex'),ep=new Ep();
  ep.fail(next);
  ep.on('login_error',(msg)=>{
    req.flash('error',msg);
    res.redirect('/login');
  });
  cli.hgetall('users:'+name,(err,user)=>{
    if(err)return ep.emit('login_error','查询错误');
    if(!user || name !== user.name || password !== user.password)return ep.emit('login_error','用户名或密码错误');
    req.session.user={
      id:user.id,
      name:user.name
    };
    req.flash('success','登录成功');
    if(req.body.refer){
      res.redirect(req.body.refer);
    }else{
      res.redirect('/post');
    }
  });
});

