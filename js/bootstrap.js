// Import our main asyhronously.
// This will be useful latter if we want to do some wasm, because:
// A dependency graph that contains any wasm must all be imported
// asynchronously. This `bootstrap.js` file does the single async import, so
// that no one else needs to worry about it again.
import("./main.js")
  .catch(e => console.error("Error importing `main.js`:", e));
