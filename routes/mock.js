var router =require('express').Router();
var cli=require('redis').createClient({db:1});
var async=require('async');
var _=require('underscore');
var postTags=require('../config').postTags;

module.exports = router;

router.get('/posts', function (req, res, next) {

});

