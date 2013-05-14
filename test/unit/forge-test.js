module("Forge Crypto");

var rsa_test = {
	keySize: 1024,
	test_message: '06a9214036b8a15b512e03d534120006'
};

var forge_aes_test = {
	keySize: 128,
	test_message: new TestData().generateBigString(1000)
};

test("SHA-1 Hash", 1, function() {
	var sha1 = forge.md.sha1.create();
	sha1.update(forge_aes_test.test_message);
	var digest = sha1.digest().getBytes();
	ok(digest);
});

test("SHA-256 Hash", 1, function() {
	rsa_test.md = forge.md.sha256.create();
	rsa_test.md.update(forge_aes_test.test_message);
	var digest = rsa_test.md.digest().getBytes();
	ok(digest);
});

test("HMAC SHA-256", 1, function() {
	var util = new app.crypto.Util(window, uuid);

	var key = util.base642Str(util.random(forge_aes_test.keySize));
	var iv = util.base642Str(util.random(forge_aes_test.keySize));

	var hmac = forge.hmac.create();
	hmac.start('sha256', key);
	hmac.update(iv);
	hmac.update(forge_aes_test.test_message);
	var result = hmac.digest().toHex();

	ok(result);
});

test("PBKDF2", 1, function() {
	var util = new app.crypto.Util(window, uuid);

	var salt = util.base642Str("vbhmLjC+Ub6MSbhS6/CkOwxB25wvwRkSLP2DzDtYb+4=");
	var expect = '5223bd44b0523090b21e9d38a749b090';

	var dk = forge.pkcs5.pbkdf2('password', salt, 1000, 16);

	equal(expect, forge.util.bytesToHex(dk));
});

asyncTest("RSA Generate Keypair", 1, function() {

	forge.rsa.generateKeyPair({
		bits: rsa_test.keySize,
		workerScript: app.config.workerPath + '/../lib/forge/prime.worker.js'
	}, function(err, keypair) {
		ok(!err && keypair);

		rsa_test.keypair = keypair;

		start();
	});

});

test("RSA Encrypt", 1, function() {
	rsa_test.ct = rsa_test.keypair.publicKey.encrypt(rsa_test.test_message);
	ok(rsa_test.ct);
});

test("RSA Decrypt", 1, function() {
	var pt = rsa_test.keypair.privateKey.decrypt(rsa_test.ct);
	equal(rsa_test.test_message, pt);
});

test("RSA Sign", 1, function() {
	rsa_test.sig = rsa_test.keypair.privateKey.sign(rsa_test.md);
	ok(rsa_test.sig);
});

test("RSA Verify", 1, function() {
	var res = rsa_test.keypair.publicKey.verify(rsa_test.md.digest().getBytes(), rsa_test.sig);
	ok(res);
});

test("AES-128-CBC Encrypt", 1, function() {
	var util = new app.crypto.Util(window, uuid);

	forge_aes_test.key = util.base642Str(util.random(forge_aes_test.keySize));
	forge_aes_test.iv = util.base642Str(util.random(forge_aes_test.keySize));
	var input = forge_aes_test.test_message;

	// encrypt
	var enCipher = forge.aes.createEncryptionCipher(forge_aes_test.key);
	enCipher.start(forge_aes_test.iv);
	enCipher.update(forge.util.createBuffer(input));
	enCipher.finish();

	forge_aes_test.ct = enCipher.output.getBytes();
	ok(forge_aes_test.ct);
});

test("AES-128-CBC Decrypt", 1, function() {
	var input = forge_aes_test.test_message;

	// decrypt
	var deCipher = forge.aes.createDecryptionCipher(forge_aes_test.key);
	deCipher.start(forge_aes_test.iv);
	deCipher.update(forge.util.createBuffer(forge_aes_test.ct));
	deCipher.finish();

	equal(input, deCipher.output, 'En/Decrypt length: ' + input.length);
});