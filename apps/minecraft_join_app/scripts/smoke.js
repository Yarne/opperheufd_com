const { spawn } = require("child_process");
const http = require("http");

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function request(path) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: "127.0.0.1", port: 5000, path, method: "GET", timeout: 3000 }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    });
    req.on("error", (e) => resolve({ error: String(e) }));
    req.end();
  });
}

(async () => {
  console.log("Starting smoke test: launching server...");
  const proc = spawn(process.execPath, ["dist/app.js"], { cwd: __dirname + "/..", env: { ...process.env, PORT: "5000" }, stdio: ["ignore", "inherit", "inherit"] });

  try {
    // wait for server to start
    await wait(700);

    const endpoints = ["/", "/join", "/whitelist", "/admin"];
    const results = {};
    for (const ep of endpoints) {
      // retry a couple times
      let res;
      for (let i = 0; i < 3; i++) {
        // eslint-disable-next-line no-await-in-loop
        res = await request(ep);
        if (res && (res.status || res.headers)) break;
        // eslint-disable-next-line no-await-in-loop
        await wait(200);
      }
      results[ep] = res;
    }

    console.log("Smoke results:");
    for (const [k, v] of Object.entries(results)) {
      console.log(`${k} ->`, v && (v.status ? `status=${v.status}` : v.error || JSON.stringify(v)));
    }
  }
  finally {
    console.log("Stopping server...");
    proc.kill();
  }
})();
