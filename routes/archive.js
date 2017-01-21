var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');

module.exports = router;

//分类归档
router.get('/', function (req, res) {

  return;
  Post.getArchive(function(err,list){
    if(err){
      console.log('archive:'.error,err);
      return res.redirect('/');
    }
    res.render('archive',{
      title:'分类归档',
      user:req.session.user,
      list:list,
      success:req.flash('success'),
      error:req.flash('error')
    });
  });
});
