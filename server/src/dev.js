// Local development entry point: starts a throwaway in-memory MongoDB (mongodb-memory-server),
// then boots the normal API. Use it when MongoDB is not installed on the machine:
//   npm run dev:memory
// The data disappears when the process stops. Production/normal local runs use `npm run dev`
// with the MONGODB_URI from .env (a real MongoDB installation or an Atlas URI).
import { MongoMemoryServer } from "mongodb-memory-server";

const memory = await MongoMemoryServer.create();
process.env.MONGODB_URI = memory.getUri("careerconnect");
console.log("In-memory MongoDB started (no local MongoDB installation required).");

await import("./server.js");