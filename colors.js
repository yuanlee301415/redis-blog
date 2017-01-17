var colors=require('colors');
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'red',
    info: 'green',
    data: 'blue',
    help: 'cyan',
    warn: 'yellow',
    debug: 'magenta',
    error: 'red'
});

console.log('error:'.error,{id:10});
console.log('info:'.info,{id:10});
console.log('warn:'.warn,{id:10});
console.log('data:'.data,{id:10});
console.log('debug:'.debug,{id:10});