var express = require('express');
var router = express.Router();
var Post = require('../modules/post');
var checkLogin =require('../middleware/checkLogin');

module.exports = router;

//转载
router.get('/:userId/:_id',checkLogin, function (req, res) {
  Post.reprint(req.params.userId,req.params._id,function (err,reprint) {
    if(err){
      if(err.yet){//提示已经转载过该文章
        req.flash('error','您已经转载过该文章，访问：http://'+req.headers.host+'/article/'+err.yet.name+'/'+err.yet._id);
      }else{
        req.flash('error','转载失败');
      }
      return res.redirect('back');
    }
    req.flash('success','转载成功');
    res.redirect('/article/'+reprint.user.name+'/'+reprint.post._id);
  });
});