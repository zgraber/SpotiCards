var MongoClient = require('mongodb').MongoClient;

var assert = require('assert');

class Connection {
    static async connectToMongo() {
        if (this.db) return this.db;
        this.db = new MongoClient(process.env.DB_URL, this.options);
        await this.db.connect();
        console.log('Database Connected');
        return (this.db);
    }
}

Connection.db = null
Connection.options = {
    poolSize: 10,
    useUnifiedTopology: true
}
module.exports = {
    Connection
}