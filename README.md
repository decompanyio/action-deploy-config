# action-deploy-config
배포를 위한 환경변수 설정

## Usage

```yaml
- name: Set deploy environment
  id: deploy_env
  uses: decompanyio/action-deploy-config@v1
  with:
    branch: ${{ github.ref_name }}
    branch-prod: prod
    branch-dev: master

- run: |
    echo ${{ steps.deploy_env.outputs.deploy_stage }}
    echo ${{ steps.deploy_env.outputs.image_tag }}
```

## Input variable

| Name | Description | Example |
| --- | --- | --- |
| branch | 현재 브랜치 | ${{ github.ref_name }} |
| branch-prod | Production 용으로 관리하는 브랜치 | prod |
| branch-dev | Develpment 용으로 관리하는 브랜치 | master |

## Output variable

| Name | Description | Example |
| --- | --- | --- |
| deploy_stage | 배포 스테이지 | dev | prod | staging |
| image_tag | 고유 태그 | dev-1hj1h3jk12 |
