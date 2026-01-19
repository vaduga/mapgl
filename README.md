Mapgl Panel plugin dev environment
### Get started with provisioned dashboards

1. Build mapLib local dependency package
   ```bash
   cd mapLib && npm install && npm run build
   ```  

2. Install dependencies

   ```bash
   npm install
   ```

3. Build plugin in production mode

   ```bash
   npm run build
   ```

4. Spin up a Grafana instance and run the plugin inside it (using Docker)

   ```bash
   docker compose up --build 
   ```

