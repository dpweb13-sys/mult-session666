import { Module } from "../lib/plugins.js";

Module({
  command: "test",
  package: "debug"
})(async (message) => {
  await message.send("✅ Plugin system working!");
});
