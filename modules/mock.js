/*Mock:数据模拟
* 2016-3-26 14:46:08
* */
var _=require('underscore');
var Mock=(function () {
    var self;
    return {

        init: function () {
            self=this;
            return this;
        },

        /*
        * field: 'date' 返回日期部分，'time'返回时间部分，否则返回全部
        * fix：true:日期和时间加前缀0
        * */
        dateFormat: function (timestamp,field,fix,dateSeparator,timeSeparator) {
            var DATE,DAte,Time,year,month,day,hour,minute,second;
            dateSeparator = dateSeparator || '-';
            timeSeparator = timeSeparator || ':';
            if('[object Date]'!==Object.prototype.toString.call(timestamp) && 'number'!==typeof timestamp){
                DATE=new Date();
            }else{
                DATE=new Date(timestamp);
            }
            year=DATE.getFullYear();
            month=DATE.getMonth()+1;
            day=DATE.getDate();
            hour=DATE.getHours();
            minute=DATE.getMinutes();
            second=DATE.getSeconds();
            if(fix){
                month=month<10?'0'+month:month;
                day=day<10?'0'+day:day;
                hour=hour<10?'0'+hour:hour;
                minute=minute<10?'0'+minute:minute;
                second=second<10?'0'+second:second;
            }
            DAte=[year,month,day].join(dateSeparator);
            Time=[hour,minute,second].join(timeSeparator);
            if('date'==field){
                return DAte;
            }else if('time'==field){
                return Time;
            }
            return DAte + ' ' + Time;
        },

        //随机自然数
        natural: function (min,max) {
            min = 'undefined' == typeof min ? 0 : parseInt(min,10);
            max = 'undefined' == typeof max ? 9007199254740992 : parseInt(max,10);
            return Math.round(Math.random()*(max-min)+min);
        },

        //随机整数
        integer: function (min, max) {
            min = 'undefined' == typeof min ? -9007199254740992 : parseInt(min,10);
            max = 'undefined' == typeof max ?  9007199254740992 : parseInt(max,10);
            return Math.round(Math.random()*(max-min)+min);
        },

        //返回一组指定范围之内的以Step为步进值的数值数组（不包含Stop值）
        range:function(start,end,step){
            var L=arguments.length,list=[];
            switch(L){
                case 0:
                    start=0;
                    end=10;
                    step=1;
                    break;

                case 1:
                    end=start+10;
                    step=1;
                    break;

                case 2:
                    step=1;
                    break;
            }
            for(start;start<end;start+=step){
                list.push(start);
            }
            return list;
        },

        //随机字符
        char:function(pool){
            var pools={
                lower:'abcdefghijklmnopqrstuvwxyz',
                upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                number:'0123456789',
                symbol:'!@#$%^&*()_+{}[]'
            };
            pools.alpha=pools.lower+pools.upper;
            pools.string=pools.alpha+pools.number;
            pools['undefined']=pools.string+pools.symbol;
            pool=pools[(''+pool).toLowerCase()];
            return pool.charAt(Math.random()*pool.length|0);
        },

        //随机字符串
        string: function (pool, min, max) {
            var L=arguments.length,length,str='';
            switch(L){
                case 0:
                    pool='undefined';
                    min=3;
                    max=8;
                    break;
                case 1:
                    min=3;
                    max=8;
                    break;
                case 2:
                    max=min*2;
                    break;
            }
            length=self.integer(min,max);
            while(length--){
                str+=self.char(pool);
            }
            return str;
        },

        //快捷方法（固定3-8个字符）
        lower: function (min,max) {
            min = min || 3;
            max = max || 8;
            return self.string('lower',min,max);
        },

        upper: function (min,max) {
            min = min || 3;
            max = max || 8;
            return self.string('upper',min,max);
        },

        //生成随机首字母大写单词
        word: function (min, max) {
            var L=arguments.length,length,str='';
            switch(L){
                case 0:
                    length=self.natural(3,8);
                    break;

                case 1:
                    length=min;
                    break;

                case 2:
                    length=self.natural(min,max);
                    break;
            }

            while(length--){
                str+=self.char('lower');
            }
            return str;
        },

        //生成随机首字母大写单词
        first: function () {
            var word=this.word.apply(this,arguments);
            return word[0].toUpperCase()+word.slice(1);
        },

        //句子：第一个单词的首字母大写
        statement: function (min,max) {
            var L=arguments.length,length,str='';
            switch(L){
                case 0:
                    length= _.random(10,20);
                    break;
                case 1:
                    length=min;
                    break;

                case 2:
                    length= _.random(min,max);
                    break;
            }

            for(var i=0;i<length;i++){
                str+=self.word() + ' ';
                if(str.length>length)break;
            }

            str=str[0].toUpperCase()+str.slice(1,length-1).toLocaleLowerCase();
            str=str.trim();
            var diff=length-str.length-1;
            if(diff>0){
                _.times(diff, function () {
                    str+=self.lower();
                });
            };
            return str + _.sample(['.','?','!']);
        },

        //文本长度范围
        text: function (min, max) {
            var L=arguments.length,length,diff,str='';
            switch(L){
                case 0:
                    length= _.random(20,50);
                    break;
                case 1:
                    length=min;
                    break;

                case 2:
                    length= _.random(min,max);
                    break;
            }
            for(var i=0;i<length;i++){
                str+=self.statement();
                if(str.length>max)break;
            }
            str=str.slice(0,length-2).trim().replace(/\W+$/,'');
            diff=length-1-str.length;
            if(diff){
                _.times(diff, function () {
                    str+=self.char('lower');
                });
            }
            return str+ _.sample(['.','?','!']);
        },

        name: function () {
            return _.sample(['',',','','','','','','','','','','','','','','','','','','','','',''])
        },

        email: function () {
            return self.lower(5,10)+ '@' + _.sample(['163.com','126.com','google.com','qq.com','sina.com.cn','139.cn','189.cn','21cn.com','263.net','sogou.com']);
        },

        bool: function () {
            return Math.random()<0.5;
        },

        between: function (min, max,n) {
            return n>=min && n<=max;
        },

        //占位符为：-1
        ip: function (a, b, c, d) {
            return [
                self.between(0,255,a)?a:_.random(0,255),
                self.between(0,255,b)?b:_.random(0,255),
                self.between(0,255,c)?c:_.random(0,255),
                self.between(0,255,d)?d:_.random(0,255)
            ].join('.');
        },

        ips:function(length,a,b,c,d,sort){
            var list;
            if( _.isBoolean(a)){
                sort=a;
                a=b;
                b=c;
                c=b;
                d=-1;
            }
            length=length||10;
            list = _.times(length, function () {
                return self.ip(a,b,c,d);
            });
            if(true === sort){
                return self.sortIp(list);
            }
            return list;
        },

        //IP排序
        sortIp: function (list) {
            return list.sort(function (a, b) {
                var arrA= a.split('.');
                var arrB= b.split('.');
                for(var i=0;i<4;i++){
                    a=Number(arrA[i]);
                    b=Number(arrB[i]);
                    if(a<b)return -1;
                    if(a>b)return 1;
                }
                return 0;
            });
        },

        //前缀
        prefix: function (str,length,pad) {
            var diff=length-str.length;
            if(diff>0){
                return new Array(diff+1).join(pad)+str;
            }else{
                return str;
            }
        },

        //后缀
        suffix: function (str, length, pad) {
            var diff=length-str.length;
            if(diff>0){
                return str+new Array(diff+1).join(pad);
            }else{
                return str;
            }
        }




    }
})().init();

module.exports=Mock;