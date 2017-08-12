// config/database.js
module.exports = {
    'url' : 'mongodb://127.0.0.1/database_users', 
     "db": {
        "storage": "mongodb",
        "host": "127.0.0.1",
        "port": 27017,
        "db": "database_users",
        "collection": "sessions"
    }
};
