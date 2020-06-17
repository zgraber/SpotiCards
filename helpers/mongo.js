var MongoClient = require('mongodb').MongoClient;

var assert = require('assert');

class Connection {
    static async connectToMongo() {
        if (this.db) return this.db;
        this.db = await MongoClient.connect(process.env.DB_URL, this.options);
        //console.log(this.db);
        return this.db;
    }
}

Connection.db = null
Connection.options = {
    poolSize: 10
}
module.exports = {
    Connection
}