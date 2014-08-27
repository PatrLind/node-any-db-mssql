module.exports = {
	userName: process.env.DB_USER || false,
	password: process.env.DB_PASS || false,
	server: process.env.DB_HOST || false,
	options: {
		port: process.env.DB_PORT || false,
		instanceName: process.env.DB_INST || false,
		database: process.env.DB_NAME || false
	}
};