require('./lib/app');
require('./lib/donations/patreon');
require('./lib/scripts/update-bazaar');
require('./lib/scripts/update-items');
require('./lib/scripts/update-top-profiles');

const cluster = require('cluster');

if(cluster.isMaster && process.env.API_REQUESTS == "1"){
    let requests = [];

    require('axios-debug-log')({
        request: (debug, config) => {
            if(config.baseURL == 'https://api.hypixel.net/')
                requests.push(+new Date());
        }
    });

    setInterval(() => {
        requests = requests.filter(a => a > +new Date() - 60 * 1000);

        console.log('requests:', requests.length + ' / minute');
    }, 1000);
}
