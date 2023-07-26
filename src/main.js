const core = require('@actions/core');
const github = require('@actions/github');

/**
 * Main function to run the GitHub Action.
 */
export function run() {
  try {
    const input = getInputValues();
    const deployInfo = getDeployInfo(input);
    const awsCredentials = getAwsCredentials(deployInfo);

    logDeploymentInfo(deployInfo, awsCredentials);
    setOutputValues(deployInfo, awsCredentials);
  } catch (error) {
    core.setFailed(error?.message);
  }
}

/**
 * Get the input values from the workflow file
 * @returns {Object} The input values
 */
function getInputValues() {
  return {
    branch: core.getInput('branch'),
    branchProd: core.getInput('branch-prod'),
    branchDev: core.getInput('branch-dev'),
    targetStage: core.getInput('target-stage'),
  };
}

/**
 * Get deployment information based on the input and GitHub event context.
 * @param {Object} input - Branch information for the action.
 * @returns {Object} - An object containing the deploy stage and image tag.
 */
function getDeployInfo(input) {
  const { eventName, sha } = github.context;
  const { branch, branchDev, branchProd, targetStage } = input;
  let deployStage, imageTag;

  switch (eventName) {
    case 'push':
      deployStage = getPushDeployStage(branch, branchDev);
      break;
    case 'pull_request':
      deployStage = getPullRequestDeployStage(branch, branchDev, branchProd);
      break;
    case 'workflow_dispatch':
      deployStage = getWorkflowDispatchDeployStage(branch, targetStage);
      break;
    case 'release':
      const { tag_name } = github.context.payload.release;
      deployStage = 'prod';
      imageTag = tag_name;
      break;
  }

  if (!deployStage) throw new Error('Failed to set environment');
  imageTag = imageTag || `${deployStage}-${sha}`;

  return { deployStage, imageTag };
}

/**
 * Get the deployment stage for push event
 * @param {string} branch - The branch name
 * @param {string} branchDev - The branch name for dev environment
 * @param {string} branchProd - The branch name for prod environment
 * @returns {string} The deployment stage
 * @throws {Error} Failed to match branch to environment
 */
function getPushDeployStage(branch, branchDev) {
  if (branch === branchDev) return 'dev';
  throw new Error(`Failed to match branch to environment: ${branch}`);
}

/**
 * Get the deployment stage for pull_request event
 * @returns {string} The deployment stage
 */
function getPullRequestDeployStage(branch, branchDev, branchProd) {
  return 'dev';
}

/**
 * Get the deployment stage for workflow_dispatch event
 * @param {string} branch - The branch name
 * @param {string} targetStage - The target stage for deployment
 * @returns {string} The deployment stage
 * @throws {Error} Forbidden branch to deploy on sandbox
 */
function getWorkflowDispatchDeployStage(branch, targetStage) {
  console.log(`\n### 배포 파라미터`);
  console.log(`targetBranch: ${branch}`);
  console.log(`targetStage: ${targetStage}\n`);

  return targetStage;
}

/**
 * Get the AWS credentials
 * @returns {Object} The AWS credentials
 */
function getAwsCredentials(deployInfo) {
  const { deployStage } = deployInfo;
  const { eventName } = github.context;
  const prodStages = ['prod', 'staging'];
  const isProdEnvironment = prodStages.includes(deployStage) || eventName === 'release';
  const account = isProdEnvironment ? 'prod' : 'verify';

  return {
    awsAccessKey: `AWS_ACCESS_KEY_ID_${account}`.toUpperCase(),
    awsSecretKey: `AWS_SECRET_ACCESS_KEY_${account}`.toUpperCase(),
    awsAccount: account,
  };
}

/**
 * Log deployment information and AWS credentials for debugging purposes.
 */
function logDeploymentInfo(deployInfo, awsCredentials) {
  const { deployStage, imageTag } = deployInfo;
  const { awsAccessKey, awsSecretKey, awsAccount } = awsCredentials;

  console.log(`\n### 배포 정보`);
  console.log(`deploy_stage : ${deployStage}`);
  console.log(`image_tag : ${imageTag}`);
  console.log(`aws_access_key : ${awsAccessKey}`);
  console.log(`aws_secret_key : ${awsSecretKey}`);
  console.log(`aws_account : ${awsAccount}\n`);
}

/**
 * Set output values for the GitHub Action.
 * @param {Object} deployInfo - Information about the deployment stage and image tag.
 * @param {Object} awsCredentials - AWS credentials for the action.
 */
function setOutputValues(deployInfo, awsCredentials) {
  const { deployStage, imageTag } = deployInfo;
  const { awsAccessKey, awsSecretKey, awsAccount } = awsCredentials;

  core.setOutput('deploy_stage', deployStage);
  core.setOutput('image_tag', imageTag);
  core.setOutput('aws_access_key', awsAccessKey);
  core.setOutput('aws_secret_key', awsSecretKey);
  core.setOutput('aws_account', awsAccount);
}
