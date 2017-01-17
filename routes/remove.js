var express = require('express');
var router = express.Router();
var checkName =require('../middleware/checkName');
var Post = require('../modules/post');
module.exports = router;

//删除博客
router.get('/:name/:_id',checkName, function (req,res) {
  Post.remove(req.params.name,req.params._id, function (err,ret) {
    if(err){
      req.flash('error','删除失败');
      return res.redirect('back');
    }
    req.flash('success','删除成功');
    res.redirect('/user/'+req.session.user.name);
  });
});