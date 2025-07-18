import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import chalk from 'chalk'
import { execute, Exit, Snapshot, SnapshotSignal, Tool } from 'llmz'
import { loading } from '../utils/spinner'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const LongRunningTool = new Tool({
  name: 'long_running_tool',
  description: 'A tool that simulates a long-running operation',
  input: z.object({
    input: z.string(),
  }),
  output: z.object({
    result: z.string(),
  }),
  async handler({ input }) {
    console.log('Executing long-running tool with input:', input)
    // Simulate a long-running operation
    throw new SnapshotSignal(`Long-running operation`)
  },
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    result: z.number(),
  }),
})

const result = await execute({
  instructions: `Call the long-running tool with input "Hello, world!" and then exit with the extracted number from the tool's output string.`,
  tools: [LongRunningTool],
  exits: [exit],
  client,
})

if (!result.isInterrupted()) {
  console.error('Expected an interruption due to the long-running tool, but got:', result.status)
  process.exit(1)
}

console.log(chalk.yellow('The execution was interrupted and a snapshot of the state was created.'))
console.log(chalk.yellow('You can now restore the snapshot and continue the execution in the future.'))
console.log(chalk.yellow('[For the sake of this example, we will restore the snapshot immediately.]'))

const snapshot = result.snapshot

// A snapshot is serializable and can be restored from any environment at a later time
const serializedSnapshot = snapshot.toJSON()

// You could store this serialized snapshot in a database or file and resolve it later
const restoredSnapshot = Snapshot.fromJSON(serializedSnapshot)

loading(true, 'Resuming the execution from the snapshot...')

// You can resolve the snapshot with the expected output or reject it with an error
restoredSnapshot.resolve({
  result: `The magic number is 42 !`,
})

loading(false)

const continuation = await execute({
  // Restore the context from the snapshot
  snapshot: restoredSnapshot,

  // Copy the original context properties
  instructions: result.context.instructions,
  tools: result.context.tools,
  exits: result.context.exits,
  client,
})

if (!continuation.is(exit)) {
  console.error("Expected the continuation to exit with the 'exit' exit, but it did not.")
  process.exit(1)
}

const magicNumber = continuation.output.result
console.log(chalk.green(`The execution continued to execute from the snapshot and exited with number "${magicNumber}"`))
