# any-db-mssql

This fork fixes some issues I had with any-db-mssql.
These fixes might not work for everyone, so please use the original code if you are unsure: https://github.com/Hypermediaisobar-admin/node-any-db-mssql

List of differences:
* BigInts are not parsed as strings but as a Number
* Objects are converted to JSON
* Empty strings and NULLs works
* Date objects are converted correctly
* Possible to use indexed references: $1, $2, $3 (one indexed) are converted to @p0, @p1, @p2. This is to have the same parameter form as the Postgres driver.
* Transactions works
