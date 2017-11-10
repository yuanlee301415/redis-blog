var config=require('../config');

module.exports=(...ns)=>{
    ns.unshift(config.name);
    return  ns.join(':');
};