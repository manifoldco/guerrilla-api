var request = require('request').defaults({jar: true});
var validator = require('validator');
var S = require('string');

function Guerrilla(ip, agent, requestFn = request, promiser = Promise) {
	var self = this;

	var guerrillaRegExp = /^([\-\.]*[A-Za-z0-9]+[\-\.]*)+$/;

	function _constructor(ip, agent) {
		if ( ! validator.isIP(ip)) {
			throw new Error('Invalid ip address: ' + ip);
		}
		if (S(agent).isEmpty()) {
			throw new Error('Empty user agent is not allowed.');
		}
		self.ip = ip;
		self.agent = agent;
	}

	_constructor(ip, agent);

	function getEndpoint(apiFunction) {
		var endpoint = 'https://api.guerrillamail.com/ajax.php?' +
			'f=' + apiFunction;
		return endpoint;
	}

	self.getEmailAddress = function(cb) {
		if (self.email) {
			return cb(null, self.email);
		}
		requestFn(getEndpoint('get_email_address'), function (err, res, body) {
			if (err) {
				cb(err);
			} else if (res.statusCode != 200) {
				cb(new Error('An error occurred while requesting e-mail address ' +
					'from guerrilla endpoint'));
			} else {
				var resObj = JSON.parse(body);
				self.email = resObj.email_addr;
				cb(null, self.email);
			}
		});
	};

	self.setEmailAddress = function (username, cb) {
		if (S(agent).isEmpty()) {
			throw new Error('Empty user agent is not allowed.');
		}

		if (S(username).isEmpty() || guerrillaRegExp.test(username) === false) {
			throw new Error('Invalid username passed as parameter: ' + username);
		}

		var endpoint = getEndpoint('set_email_user');

		endpoint += '&email_user=' + username;
		// TODO hardcoded, for now
		endpoint += '&lang=en';
		endpoint += '&domain=guerrillamail.com';

		requestFn(endpoint, function(err, res, body) {
			if (err) {
				cb(err);
			} else if (res.statusCode != 200) {
				cb(new Error('An error occurred while setting e-mail address ' +
					'on guerrilla endpoint'));
			} else {
				var resObj = JSON.parse(body);
				self.email = resObj.email_addr;
				cb(null, self.email);
			}
		});
	};

	self.checkEmail = function(cb) {
		var endpoint = getEndpoint('get_email_list') + '&offset=0';

		requestFn(endpoint, function(err, res, body) {
			if (err) {
				return cb(err);
			}
			try {
				var resObj = JSON.parse(body);
				cb(null, resObj.list);
			} catch (parsingError) {
				cb(parsingError);
			}
		});
	};

	self.fetchEmail = function fetchEmail(emailId) {
		const endpoint = `${getEndpoint('fetch_email')}&email_id=${emailId}`;

		return new promiser((resolve, reject) => {
			requestFn(endpoint, (err, res, body) => {
				if (err) {
					return reject(err);
				}
				try {
					resolve(JSON.parse(body));
				} catch (parsingError) {
					reject(parsingError);
				}
			});
		});
	};
}

module.exports = Guerrilla;
