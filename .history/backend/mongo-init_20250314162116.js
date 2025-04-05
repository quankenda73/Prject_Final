db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "mydatabase");

db.createUser({
  user: process.env.MONGO_INITDB_USERNAME || "congdinh",
  pwd: process.env.MONGO_INITDB_PASSWORD || "abcd1234",
  roles: [{ role: "readWrite", db: process.env.MONGO_INITDB_DATABASE || "mydatabase" }]
});
