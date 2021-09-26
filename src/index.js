const { get } = require('lodash')
const AWS = require('aws-sdk')
const sfn = new AWS.StepFunctions({ region: 'us-east-1' })

/**
 * Waits the requested number of milliseconds
 * 
 * @param {number} milliseconds the number of milliseconds to wait
 */
const wait = (milliseconds) => (new Promise(resolve => {
  setTimeout(() => {
    resolve();
  }, milliseconds);
}))

/**
 * Synchronously executes a Step Function by starting it and waiting for it to finish.
 * 
 * @param {String} arn the ARN of the state machine for which to start an execution
 * @param {String} name a name for the execution (optional)
 * @param {Object} input input for the execution (optional)
 * @param {number} monitorIntervalMilliseconds the interval for the state monitor loop (optional, defaults to 1000) 
 * @returns the completed execution state
 */
const executeSynchronously = async ({ arn, name, input = {}, monitorIntervalMilliseconds = 1000 }) => {
  if (!arn) {
    throw new Error('arn is required')
  }

  let startResult;

  try {
    startResult = await sfn.startExecution({
      stateMachineArn: arn,
      name,
      input: JSON.stringify(input)
    }).promise()
  } catch (err) {
    throw new Error(`failed to start execution: ${err}`)
  }


  console.log(`started execution.  arn: ${executionArn}`)

  const terminalStates = ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']

  while (true) {
    const result = await sfn.describeExecution({ executionArn }).promise()

    if (terminalStates.includes(get(result, 'status'))) {
      return result
    }

    console.log(`execution ${executionArn} is not yet complete.  waiting ${monitorIntervalMilliseconds}`)
    await wait(monitorIntervalMilliseconds)
  }
}

;(async () => {
  const result = await executeSynchronously({ 
    arn: '<arn here>',
    input: { foo: 'bar' },
    monitorIntervalMilliseconds: 1000
  })

  console.log(result)
})();