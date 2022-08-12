const core = require('@actions/core');
const github = require('@actions/github');

export function run() {
    try {
        // input
        const branch = core.getInput('branch');
        const branchProd = core.getInput('branch-prod');
        const branchDev = core.getInput('branch-dev');

        // variable
        let deployStage = ''
        let imageTag = ''

        // set env
        switch (github.context.eventName) {
            case 'push':
                if (branch === branchDev) deployStage = 'dev'
                else if (branch === branchProd) deployStage = 'staging'
                else deployStage = branch
                imageTag = `${deployStage}-${github.context.sha}`
                break
            case 'pull_request':
                deployStage = 'dev'
                
                if(github.context.payload.repository.name === 'polarishare-frontend-2022'){
                    const headRef = github.context.payload.pull_request.head.ref
                    deployStage = headRef.startsWith('seo') ? 'dev' : 'sandbox'
                }

                imageTag = `${deployStage}-${github.context.sha}`
                break
            case 'release':
                deployStage = github.context.payload.release.target_commitish
                imageTag = github.context.payload.release.tag_name
                break
        }

        if (!deployStage) throw new Error('Failed to set environment.');

        console.log(`deploy_stage : ${deployStage}`)
        console.log(`image_tag : ${imageTag}`)
        core.setOutput('deploy_stage', deployStage)
        core.setOutput('image_tag', imageTag)
    } catch (error) {
        core.setFailed(error?.message);
    }
}
