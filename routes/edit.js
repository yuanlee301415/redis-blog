var express = require('express');
var router = express.Router();
var checkName =require('../middleware/checkName');
var Post = require('../modules/post');
module.exports = router;

//编辑博客
router.get('/:name/:id',checkName, function (req, res) {
  Post.getOne(req.params.name,req.params.id, function (err, post) {
    if(err){
      return res.render('error',{message:'博客不存在',error:null});
    }
    res.render('edit',{
      title:'编辑',
      user:req.session.user,
      post:post,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  },true/*返回原始的Markdown格式*/);
});

//更新博客
router.post('/:name/:id', function (req, res) {
  Post.update(req.body._id,req.body.post,function (err, ret) {
    if(err){
      console.log('/edit>err:',err);
      req.flash('error','编辑失败');
      return res.redirect('back');
    }
    req.flash('success','编辑成功');
    res.redirect('/article/'+req.session.user.name+'/'+req.body._id);
  });
});