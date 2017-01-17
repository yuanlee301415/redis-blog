var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var checkNotLogin = require('../middleware/checkNotLogin');

var User = require('../modules/user');

module.exports = router;

//Login
router.get('/',checkNotLogin, function (req, res) {
  res.render('login',{title:'登录',back:req.query.back,user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});

router.post('/',checkNotLogin, function (req, res) {
  var name=req.body.name,password=crypto.createHash('md5').update(req.body.password).digest('hex');

  User.get(name, function (err, user) {
    if(!user){
      req.flash('error','用户不存在！');
      return res.redirect('/login');
    }
    console.log('Login>user:',user,req.body.password,password);
    if(user.password!==password){
      req.flash('error','用户名或密码错误！');
      return res.redirect('/login');
    }
    req.session.user=user;
    req.flash('success','登录成功！');

    if(req.body.back){//从其它需要登录的页面跳转而来的，返回需要登录之前的页面
      res.redirect(req.body.back);
    }else{
      res.redirect('/');
    }
  });
});

