var co = require('co');

co(function *(){

	var len = 3;

	for (var i = len - 1; i >= 0; i--) {
		yield Promise.resolve(i).then(function (val) {
			var s  = new Promise(function  (resolve,reject) {
					setTimeout(function  () {
						resolve(val)
					},1100)
			})
			s.then(function  (val) {
					console.log(val)
			})
			return s
		})
	}


}).catch(onerror);

function onerror(err) {
  // log any uncaught errors
  // co will not throw any errors you do not handle!!!
  // HANDLE ALL YOUR ERRORS!!!
  console.error(err.stack);
}