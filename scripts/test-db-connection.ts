
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
}

console.log("Attempting to connect to:", connectionString.replace(/:[^:]*@/, ":****@"));

const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    max_lifetime: 60 * 30,
});

async function testConnection() {
    try {
        console.log("Sending query...");
        const result = await client`select 1 as result`;
        console.log("Connection successful:", result);
    } catch (error) {
        console.error("Connection failed:", error);
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
        }
    } finally {
        await client.end();
    }
}

testConnection();
