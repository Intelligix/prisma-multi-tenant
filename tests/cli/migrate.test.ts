import { Project, initProject } from './helpers/project'
import { runShell } from './helpers/shell'

// If timeout error, increase the number
jest.setTimeout(1000000)

describe('migrate', () => {
  let project: Project

  beforeAll(async () => {
    project = await initProject('cli-migrate')

    try {
      await project.run('init --provider=sqlite --url=file:management.db')
      await project.run('delete dev --force')
      await project.run('new --name=test1 --url=file:test1.db')
      await project.run('new --name=test2 --url=file:test2.db')
      // await project.run('env test1 -- npx prisma migrate save --name=test --experimental') // Note: use `npx prisma` instead of `prisma` once npm7 bug is resolved
      await project.run('env test1 -- npx prisma migrate dev --name=test --create-only') // Note: use `npx prisma` instead of `prisma` once npm7 bug is resolved
      await runShell(`wsl cp helpers/seed.js ../playground/${project.path}/seed.js`, '../cli')
      await runShell(`wsl cp helpers/seed2.js ../playground/${project.path}/seed2.js`, '../cli')
      await runShell(`wsl cp helpers/read.js ../playground/${project.path}/read.js`, '../cli')
    } catch (e) {
      console.log(e)
    }
  })

  test('migrate up one tenant', async () => {
    await project.run('migrate test1 deploy')

    await project.expect().toSeed('test1')
    await project.expect().toSeed('test2', false)
  })

  test('migrate up all tenants', async () => {
    await project.run('migrate deploy')

    await project.expect().toSeed('test1')
    await project.expect().toSeed('test2')
  })

  test('migrate down one tenant', async () => {
    await project.run('migrate test1 reset --force')

    await project.expect().toRead('test1', false)
    await project.expect().toRead('test2')
  })

  test('migrate down all tenants', async () => {
    await project.run('migrate reset --force')

    await project.expect().toRead('test1', false)
    await project.expect().toRead('test2', false)
  })

  test('migrate save default tenant', async () => {
    // await runShell(
    //   `echo "\n\nmodel Admin {\n id Int @id @default(autoincrement())\n email String @unique\n name String?\n megaAdmin Boolean\n}" >> ../playground/${project.path}/prisma/schema.prisma`
    // )
    await runShell(`echo. >> ../playground/${project.path}/prisma/schema.prisma`)
    await runShell(`echo. >> ../playground/${project.path}/prisma/schema.prisma`)
    await runShell(`echo model Admin { >> ../playground/${project.path}/prisma/schema.prisma`)
    await runShell(`echo   id Int @id @default(autoincrement()) >> ../playground/${project.path}/prisma/schema.prisma`)
    await runShell(`echo   email String @unique >> ../playground/${project.path}/prisma/schema.prisma`)
    await runShell(`echo   name String? >> ../playground/${project.path}/prisma/schema.prisma`)
    await runShell(`echo   megaAdmin Boolean >> ../playground/${project.path}/prisma/schema.prisma`)
    await runShell(`echo } >> ../playground/${project.path}/prisma/schema.prisma`)
    // await project.run('migrate save -- --name=save-test')
    await project.run('env test1 -- npx prisma migrate dev --name=save-test --create-only') // Note: use `npx prisma` instead of `prisma` once npm7 bug is resolved
    await project.run('migrate deploy')
    await project.run('generate')

    await project.expect().toSeed('test1', true, 'seed2.js')
    await project.expect().toSeed('test2', true, 'seed2.js')
  })
})
