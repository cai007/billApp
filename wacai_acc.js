var http = require('http');
var fs = require('fs');
var querystring = require('querystring');

var post_data = {
    "type": "all",
    "reqBalance": true,
    "pageInfo.pageIndex": 1,
    "hidden": false
}



var time = new Date().getTime();
var options = {
    hostname: 'www.wacai.com',
    port: 80, //注意端口号 可以忽略不写 写一定写对
    path: '/setting/account_list.action?timsmp=' + time,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': '_jzqy=1.1583760030.1583760030.1.jzqsr=baidu.-; _jzqckmp=1; Hm_lvt_bc65f2f4ddfe3a1cda888f512e73f7f1=1583760097; pgv_pvi=1135042560; __gads=ID=244e9b829c95d02d:T=1583760255:S=ALNI_MYlJiEZr_uRuyTsreUnK1GsdTQNuQ; JSESSIONID=7150F0EA0BEACDF5BDF4DA16D652D84E; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22170bf745a3225b-02f8f984f6af16-4313f6a-1327104-170bf745a335e%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22%24device_id%22%3A%22170bf745a3225b-02f8f984f6af16-4313f6a-1327104-170bf745a335e%22%7D; wctk=WCeO2k48prmpJY9PYLKsjjcpU-7oLSRwedmJg; wctk.sig=yVepaQQ71R67f52c6Y8VZnG-pbU; access_token=WCeO2k48prmpJY9PYLKsjjcpU-7oLSRwedmJg; access_token.sig=pZWodHZ6JbooXRlKjaNYffp5nSE; Hm_lvt_0311e2d8c20d5428ab91f7c14ba1be08=1583760029,1583760640,1583806317; _qzjc=1; _jzqa=1.3213510019170346000.1583760030.1583770281.1583806317.4; _jzqc=1; _jzqx=1.1583764145.1583806317.2.jzqsr=wacai%2Ecom|jzqct=/user/user%2Eaction.jzqsr=user%2Ewacai%2Ecom|jzqct=/reform/mob/login; _qzja=1.1475972669.1583760030022.1583770281162.1583806316725.1583806316725.1583806324242..0.0.14.4; _qzjb=1.1583806316725.2.0.0.0; _qzjto=3.2.0; _jzqb=1.2.10.1583806317.1; Hm_lpvt_0311e2d8c20d5428ab91f7c14ba1be08=1583806324'
    }
};

var _data = [];

var content = querystring.stringify(post_data);
var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(chunk) {
        body += chunk;
    });
    res.on('end', function() {
        var accs = JSON.parse(body).accountTypeSum[0].accs;
        let str = JSON.stringify(accs, "", "\t");
        fs.writeFile('acc1.json', str, function(err) {
            if (err) { res.status(500).send('Server is error...') }
        })
    });
});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});



req.write(content);
req.end();