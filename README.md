# Ew

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/nuxt?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your remote caching setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/jV2Uy8AedR)


## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve ew
```

To create a production bundle:

```shn
npx nx build ew
```

To see all available targets to run for a project, run:

```sh
npx nx show project ew
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/nuxt:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/vue:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/nuxt?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Release Images And Deploy By Version

### Build and push images

Workflow `Build and Push Containers` is configured to:
- Auto-run only when you push a git tag.
- Allow manual run (`workflow_dispatch`) with required `image_tag`.
- Recreate `nginx/ssl/fullchain.pem` and `nginx/ssl/cloudflare-key.pem` from GitHub Actions secrets when building the `nginx` image.

Required repository secrets for `nginx` builds:
- `CF_ORIGIN_CERT`
- `CF_ORIGIN_KEY`

Example release build:

```sh
git tag v1.0.0
git push origin v1.0.0
```

### Deploy by version tag

Script [`scripts/deploy.sh`](/Users/abc/project/mga/scripts/deploy.sh) supports version-based deploy:
- Arg 1: `IMAGE_TAG` (default `latest` if omitted)
- Arg 2: `SERVICES` (`all` by default, or comma-separated services)

Examples:

```sh
# Deploy all services with a specific tag
bash scripts/deploy.sh v1.0.0

# Deploy only frontend with a specific tag
bash scripts/deploy.sh v1.0.0 frontend

# Deploy backend + api with a specific tag
bash scripts/deploy.sh v1.0.0 backend,api
```

You can also override per-service tags:

```sh
FRONTEND_TAG=v1.0.2 BACKEND_TAG=v1.0.1 API_TAG=v1.0.1 ADMIN_TAG=v1.0.0 NGINX_TAG=v1.0.0 bash scripts/deploy.sh
```

## Access Admin via `/admin` (instead of subdomain)

Admin service now supports path-based access on the main domain:
- `https://<your-domain>/admin/`
- `https://<your-domain>/admin/auth/login`

### What was changed

- Nginx routes `/admin` and `/admin/*` to the `admin` container.
- Nuxt Admin uses configurable base path via `NUXT_APP_BASE_URL`.
- Deploy script passes `NUXT_APP_BASE_URL` to admin container.

### Required environment

`scripts/deploy.sh` uses:
- `ADMIN_BASE_PATH` (default: `/admin/`)
- Host SSL files mounted at `/etc/nginx/ssl` on the deployment machine

You can override it when deploying:

```sh
ADMIN_BASE_PATH=/admin/ bash scripts/deploy.sh v1.0.0 admin,nginx
```

### Deploy checklist

1. Build and push new `admin` and `nginx` images.
2. Deploy `admin` and `nginx` with `scripts/deploy.sh`.
3. Verify:
   - `https://<your-domain>/admin/` loads admin app.
   - Login/logout redirects stay under `/admin/...`.
   - tRPC/API calls from admin still work.

### Notes

- Legacy admin subdomain config can still exist, but `/admin` is now supported on main domain.
- If you change `ADMIN_BASE_PATH`, ensure it starts and ends with `/` (example: `/admin/`).
- GitHub Actions now reconstructs local `nginx/ssl` files from `CF_ORIGIN_CERT` and `CF_ORIGIN_KEY`; do not commit private keys to the repository.
