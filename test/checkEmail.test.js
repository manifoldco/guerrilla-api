var assert = require('assert');
var Guerrilla = require('../index');

describe('Testing e-mail reception', function() {
	var guerrillaApi;
	let listedEmails;

	it('should be able to list e-mails', function(done) {
		this.timeout(10000);

		guerrillaApi = new Guerrilla('127.0.0.1', 'automated-test-agent');

		guerrillaApi.setEmailAddress('test', function(err, address) {
			assert.equal(err, null);
			assert.ok(address.startsWith('test@'));

			guerrillaApi.getEmailAddress(function(err, email) {
				assert.equal(err, null);
				guerrillaApi.checkEmail(function(err, emails) {
					assert.equal(err, null);
					assert.notEqual(emails, null);
					assert.ok(emails.length >= 1);
					listedEmails = emails;
					for (let email of emails) {
						assert.notEqual(email.mail_id, null);
						assert.notEqual(email.mail_from, null);
					}
					done();
				});
			});
		});
	});

	it('should then be able to fetch those e-mails', async function() {
		this.timeout(10000);

		const fullEmails = await Promise.all(listedEmails.map(
			(email) =>
				(async (email) => await guerrillaApi.fetchEmail(email.mail_id))(email)));
		assert.ok(fullEmails.length === listedEmails.length);
		assert.ok(fullEmails.every((email) => !!email.mail_id));
	});
});
