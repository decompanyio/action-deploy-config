const core = require('@actions/core');
const github = require('@actions/github');

export function run() {
  try {
    // input
    const branch = core.getInput('branch');
    const branchProd = core.getInput('branch-prod');
    const branchDev = core.getInput('branch-dev');

    // variable
    let deployStage = '';
    let imageTag = '';
    let awsAccessKey = '';
    let awsSecretKey = '';

    // set env
    switch (github.context.eventName) {
      case 'push':
        if (branch === branchDev) deployStage = 'dev';
        else if (branch === branchProd) deployStage = 'staging';
        else if (branch.startsWith('v') && branch.indexOf('qa') >= 0) deployStage = 'qa';
        else throw new Error(`Failed to match branch to environment: ${branch}`);

        imageTag = `${deployStage}-${github.context.sha}`;
        break;

      case 'pull_request':
        deployStage = 'dev';
        imageTag = `${deployStage}-${github.context.sha}`;
        break;

      case 'workflow_dispatch':
        const forbiddenBranches = ['main', 'master', 'qa', 'prod'];
        if (forbiddenBranches.inclueds(branch)) {
          throw new Error(`Forbidden branch to deploy on sandbox: ${branch}`);
        }

        deployStage = 'sandbox';
        imageTag = `${deployStage}-${github.context.sha}`;
        break;

      case 'release':
        deployStage = github.context.payload.release.target_commitish; // prod or qa
        imageTag = github.context.payload.release.tag_name;
        break;
    }

    if (!deployStage) throw new Error('Failed to set environment');

    // set aws profile
    if (branch === branchProd || github.context.eventName === 'release') {
      awsAccessKey = 'AWS_ACCESS_KEY_ID_PROD';
      awsSecretKey = 'AWS_SECRET_ACCESS_KEY_PROD';
    } else {
      awsAccessKey = 'AWS_ACCESS_KEY_ID_VERIFY';
      awsSecretKey = 'AWS_SECRET_ACCESS_KEY_VERIFY';
    }

    console.log(`deploy_stage : ${deployStage}`);
    console.log(`image_tag : ${imageTag}`);
    console.log(`aws_access_key : ${awsAccessKey}`);
    console.log(`aws_secret_key : ${awsSecretKey}`);
    core.setOutput('deploy_stage', deployStage);
    core.setOutput('image_tag', imageTag);
    core.setOutput('aws_access_key', awsAccessKey);
    core.setOutput('aws_secret_key', awsSecretKey);
  } catch (error) {
    core.setFailed(error?.message);
  }
}
