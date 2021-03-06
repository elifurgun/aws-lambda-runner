
var url = require('url');

var next_id = 0;
var done = {};
var errors = {};
var timeout = {};

exports.request = function(req, res, opts, handler) {
  if (req.method === 'POST') {
    var id = next_id;
    var output = '';
    next_id += 1;
    req.on('data', function(chunk) {
      setTimeout(function() {
        if (!done[id]) {
          timeout[id] = true;
        }
      }, opts.timeout);
      output += chunk.toString()
    });
    req.on('end', function(chunk) {
      handler(JSON.parse(output), {
        done: function(err, message) {
          if (err) {
            errors[id] = err;
            console.warn('Error:', err);
          }
          console.info('Finished:', message);
          done[id] = true;
        }
      });
    });
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(String(id));
  } else if (req.method === 'DELETE') {
    res.writeHead(202, {'Content-Type': 'text/plain'});
    var terminationMessage = 'Terminating server at http://[localhost]:' + opts.port + ' for ' + opts['module-path'] + ' / ' + opts.handler;
    res.end(terminationMessage + '\n');
    console.info(terminationMessage);
    server.close();
  } else if (req.method === 'GET') {
    var request_id = parseInt(url.parse(req.url, true).query.id);
    var status = 200;
    var output = '';
    if (timeout[request_id]) {
      status = 504;
    } else if (errors[request_id]) {
      status = 502;
      output = errors[request_id];
    } else if (done[request_id]) {
      status = 201;
    }
    res.writeHead(status, {'Content-Type': 'text/plain'});
    res.end(output + '\n');
  } else {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Not implemented: ' + req.method + '\n');
  }
};
