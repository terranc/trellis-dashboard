#!/usr/bin/env node

import("../packages/server/dist/cli.js")
  .then(({ main }) => main())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
