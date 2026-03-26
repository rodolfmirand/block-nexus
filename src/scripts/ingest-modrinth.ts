import { CatalogBootstrapService } from "../modules/catalog/ingestion/catalog-bootstrap-service.js";
import { ModrinthClient } from "../modules/catalog/ingestion/modrinth/modrinth-client.js";

const DEFAULT_PROJECTS = ["fabric-api", "modmenu", "sodium"];

type ParsedArgs = {
  projects: string[];
  outputFileName?: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const projects: string[] = [];
  let outputFileName: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--output") {
      const nextArg = argv.at(index + 1);

      if (nextArg === undefined) {
        throw new Error("Missing value for --output.");
      }

      outputFileName = nextArg;
      index += 1;
      continue;
    }

    if (arg !== undefined) {
      projects.push(arg);
    }
  }

  const parsedArgs: ParsedArgs = {
    projects: projects.length > 0 ? projects : DEFAULT_PROJECTS
  };

  if (outputFileName !== undefined) {
    parsedArgs.outputFileName = outputFileName;
  }

  return parsedArgs;
}

async function main(): Promise<void> {
  const { projects, outputFileName } = parseArgs(process.argv.slice(2));
  const service = new CatalogBootstrapService(new ModrinthClient());
  const result = await service.ingestProjects(projects, outputFileName);

  console.log("BlockNexus Modrinth ingestion completed.");
  console.log(`Source: ${result.snapshot.source}`);
  console.log(`Fetched at: ${result.snapshot.fetchedAt}`);
  console.log(`Projects: ${result.projectCount}`);
  console.log(`Versions: ${result.versionCount}`);
  console.log(`Output: ${result.outputPath}`);

  for (const project of result.projects) {
    console.log(`- ${project.slug ?? project.sourceProjectId}: ${project.versionCount} versions`);
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown ingestion error.";

  console.error(`BlockNexus Modrinth ingestion failed: ${message}`);
  process.exitCode = 1;
});
