# @sigbit/nvr
> Use [Nitro](https://github.com/unjs/nitro) on [Vercel](https://vercel.com) with mixed serverless & edge functions

## Motivation
[unjs/nitro#1120](https://github.com/unjs/nitro/issues/1120)

## Usage
This script assumes your primary target is `vercel-edge`.
Add `npx @sigbit/nvr <function> [function...]` after your normal build script to make the specified functions run in a serverless (Node) environment.
```json
{
  "scripts": {
    "build": "nuxt build && npx @sigbit/nvr /api/my-function"
  }
}
```

> [!NOTE]
This script will trigger another non-edge rebuild and use these files in the final composition. Therefore, additional time is added to the deployment.

## License
MIT