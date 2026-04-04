import type { Hono } from "hono";

import { openApiDocument } from "../openapi.js";

export function registerDocsRoutes(app: Hono): void {
  app.get("/openapi.json", (context) => {
    return context.json(openApiDocument, 200);
  });

  app.get("/docs", (context) => {
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlockNexus Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>`;

    return context.html(html, 200);
  });
}
