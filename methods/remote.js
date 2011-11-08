var http = require('http');
var fs = require('fs');

//构造请求head 取回文件
exports.serve = function(req, res, vector){
	var pipe = vector.pipe;  //输出的管道

	var targetIP = vector.ip;
	var uri = req.url.replace(/http\:\/\/[^\/]+/,'');
	//构造请求head
	//console.log(req.connection.remoteAddress + "--> : " + req.method + " " + req.url);
	//var proxy = http.createClient(80, targetIP);
	//var proxy_request = proxy.request(req.method, req.url, req.headers);

	var options = {
		host: targetIP,
		method: req.method,
		headers: req.headers,
		path: uri //p.pathname + p.search + p.hash
	};
	var proxy_request = http.request(options, function(proxy_response){
		//向管道输出一条response更新
		pipe.write('response', {
			status: proxy_response.statusCode,
			headers: proxy_response.headers
		});

		proxy_response.on('data', function(chunk) {
			res.write(chunk, 'binary');
		});
		proxy_response.addListener('end', function() {
			res.end();
		});
		res.writeHead(proxy_response.statusCode, proxy_response.headers);
	});
	console.log2('<remote proxy-request>', proxy_request);

	req.addListener('data', function(chunk) {
		proxy_request.write(chunk, 'binary');
	});
	req.addListener('end', function() {
		proxy_request.end();
	});

//{{错误处理
	//远端服务器错误
	proxy_request.on('error', function(e){
		res.end();
		pipe.write('error', e );
	});

	//客户端手动abort
	req.on('close', function(e){
		proxy_request.abort();
		pipe.write('error', e );
	});
//}}End

};
