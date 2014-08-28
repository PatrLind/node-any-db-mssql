/**
 * This is a helper for running tests. It will use configuration values passed
 * through environment variables.
 *
 * If `DB_INST` is provided, `DB_PORT` will be ignored.
 * Tedious will use defaults for some of those, if they're not provided.
 *
 * For more information about configuration variables, check
 * {@link http://pekim.github.io/tedious/api-connection.html#function_newConnection}
 */
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