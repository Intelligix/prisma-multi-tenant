import { runShell, fileExists, spawnCommand } from './shell'

export interface Project {
  path: string
  name: string
}

export class Project {
  constructor({ name, path }: { name: string; path: string }) {
    this.name = name
    this.path = path
  }

  async run(cmd: string) {
    console.log(`Running "prisma2-multi-tenant ${cmd}" on "${this.name}"`)

    return runShell('prisma2-multi-tenant ' + cmd, this.path)
  }

  exec(cmd: string) {
    console.log(`Running "prisma2-multi-tenant ${cmd}" on "${this.name}"`)

    return spawnCommand('prisma2-multi-tenant ' + cmd, this.path)
  }

  expect() {
    return {
      toSeed: async (tenant: string, expected: boolean = true, seedFile: string = 'seed.js') => {
        const results = await runShell(
          `npx dotenv -e prisma/.env -- node ${seedFile} ${tenant}`,
          this.path
        ).catch((e) => e)
        if (expected) {
          expect(results).toEqual(expect.stringContaining('Successfully seeded'))
        } else {
          expect(results).not.toEqual(expect.stringContaining('Successfully seeded'))
        }
      },
      toRead: async (tenant: string, expected: boolean = true, readFile: string = 'read.js') => {
        const results = await runShell(
          `npx dotenv -e prisma/.env -- node ${readFile} ${tenant}`,
          this.path
        ).catch((e) => e)
        if (expected) {
          expect(results).toEqual(expect.stringContaining('Successfully read'))
        } else {
          expect(results).not.toEqual(expect.stringContaining('Successfully read'))
        }
      },
    }
  }

  expectFile(path: string) {
    return {
      toExists: async (expected: boolean = true) => {
        const exists = await fileExists(this.path + '/' + path)
        expect(exists).toBe(expected)
      },
      toContain: async (expected: string) => {
        const content = await runShell(`type ${path}`, this.path)
        expect(content).toEqual(expect.stringContaining(expected))
      },
    }
  }
}

export const initProject = async (name: string): Promise<Project> => {
  console.log(`Initializing ${name} project...`)

  if (await fileExists(`test-${name}`)) {
    await runShell(`rd /s /q test-${name}`);
  }
  await runShell(`xcopy /s /e /q example test-${name}\\`);
  await runShell(`cd test-${name}`);
  await runShell(`npm -s install`);

  return new Project({ name, path: 'test-' + name })
}
