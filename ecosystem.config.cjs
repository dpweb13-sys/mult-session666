module.exports = {
  apps: [
    {
      name: "x-kira",
      script: "./index.js", 

      // PERFORMANCE
      instances: "max",
      exec_mode: "cluster",

      // RELIABILITY
      autorestart: true,
      watch: false,
      restart_delay: 3000,
      max_memory_restart: "1000M",

      env: {
        NODE_ENV: "production"
      }
    }
  ]
};