# Builds the handbook site into a self-contained Node server image.
# deploy/deploy.sh runs: podman build -t localhost/handbook:latest .

FROM docker.io/library/node:24-slim AS build
# git: Lunaria reads the commit history to find outdated translations,
# and comark-docs reads the remote for the GitHub repository it serves pages from.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependencies first, so this layer is reused until package*.json changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# Everything else, including .git (needed by Lunaria; see .containerignore).
COPY . .
RUN npm run build

FROM docker.io/library/node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
