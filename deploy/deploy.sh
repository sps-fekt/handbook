#!/usr/bin/env bash
# Deploys the handbook from GitHub. Run as the handbook user.
#
#   deploy.sh            pull the deploy branch and apply what changed (run on a push to
#                        GitHub through the webhook, and by the timer as a fallback; see README.md)
#   deploy.sh --install  first-time setup: install units and Quadlets, build, start everything
#   deploy.sh --rebuild  rebuild the image with the latest Node base image (security updates)
#
# What changed                          What happens
# app files, package*.json              the image is rebuilt and the site restarted
# content/**                            nothing: the site reads pages from GitHub, and the
#                                       GitHub webhook makes a push live right away
# config/**                             the site is restarted (no rebuild)
# handbook.quadlets                     the Quadlets are reinstalled and the site restarted
# deploy/*.service|timer|path           the systemd units are reinstalled
# *.md in the root, .github/**          nothing
#
# At the end, the commit now running is written to $TRIGGER_DIR/deployed, which
# the site shows in its footer (server/api/version.get.ts).
#
# The image is labelled with the commit it was built from. If a build fails, the
# site keeps running the previous image and the next run tries the build again.
set -euo pipefail

IMAGE=localhost/handbook:latest
BUILD_IMAGE=localhost/handbook-build:latest
# Written by the site's webhook (server/api/webhook.post.ts), watched by handbook-deploy.path.
TRIGGER_DIR="$HOME/.local/state/handbook-deploy"
REVISION_LABEL=org.opencontainers.image.revision
# Paths that never need a new image. Everything else does.
NO_BUILD_RE='^(content/|deploy/|config/|\.github/|handbook\.quadlets$|[^/]+\.md$)'

# Everything runs inside main(), so bash has read the whole script
# before "git checkout" can replace this file.
main() {
    local repo branch install=0 rebuild=0 old new changed built build=0 restart=0
    case "${1:-}" in
        --install) install=1 ;;
        --rebuild) rebuild=1 ;;
        "") ;;
        *) echo "Unknown option: $1" >&2; return 2 ;;
    esac
    repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    branch="${DEPLOY_BRANCH:-main}"
    cd "$repo"

    # Clear the webhook's request; a push during this run writes it again.
    # 0777: the container's user is mapped to another uid.
    install -d -m 0777 "$TRIGGER_DIR"
    rm -f "$TRIGGER_DIR/requested"

    # A manual run and the timer must not build at the same time.
    exec 9>"${XDG_RUNTIME_DIR:-/tmp}/handbook-deploy.lock"
    if ! flock -n 9; then
        echo "Another deploy is running"
        return 0
    fi

    git fetch --quiet origin "$branch"
    old="$(git rev-parse HEAD)"
    new="$(git rev-parse "origin/$branch")"
    changed=""
    if [[ "$old" != "$new" ]]; then
        changed="$(git diff --name-only "$old" "$new")"
        # The server's clone mirrors GitHub, also when its history was rewritten
        # (a force push): a merge would refuse that, and every deploy would fail.
        git checkout --quiet --force -B "$branch" "origin/$branch"
        echo "Updated ${old:0:7} -> ${new:0:7}:"
        sed 's/^/  /' <<<"$changed"
    fi

    if [[ $install == 1 ]] || grep -qE '^deploy/.*\.(service|timer|path)$' <<<"$changed"; then
        echo "Installing systemd units"
        install -m 0644 -D -t "$HOME/.config/systemd/user" deploy/*.service deploy/*.timer deploy/*.path
        systemctl --user daemon-reload
        systemctl --user enable --now handbook-deploy.timer handbook-deploy.path
    fi
    if [[ $install == 1 ]] || grep -qx 'handbook.quadlets' <<<"$changed"; then
        echo "Installing Quadlets"
        podman quadlet install --replace handbook.quadlets
        restart=1
    fi
    if grep -q '^config/' <<<"$changed"; then
        restart=1
    fi

    # Compare with the commit the running image was built from, not with the
    # previous checkout, so a failed build is retried on the next run.
    built="$(podman image inspect --format "{{index .Config.Labels \"$REVISION_LABEL\"}}" "$IMAGE" 2>/dev/null || true)"
    if [[ $install == 1 || $rebuild == 1 ]] || ! git cat-file -e "${built:-none}^{commit}" 2>/dev/null; then
        build=1
    elif [[ "$built" != "$new" ]] && git diff --name-only "$built" "$new" | grep -qvE "$NO_BUILD_RE"; then
        build=1
    fi

    if [[ $build == 1 ]]; then
        echo "Building $IMAGE from ${new:0:7}"
        # The base image is updated only with --rebuild, so the cached layers
        # (apt-get, npm ci) are reused. The build stage is tagged so that the
        # prune below doesn't delete its cache.
        local pull=missing
        [[ $rebuild == 1 ]] && pull=newer
        podman build --pull=$pull --target build -t "$BUILD_IMAGE" .
        podman build --pull=$pull --label "$REVISION_LABEL=$new" -t "$IMAGE" .
        podman image prune --force >/dev/null
        restart=1
    fi

    # Not reached when the build fails (set -e): the footer keeps the previous commit.
    git rev-parse HEAD >"$TRIGGER_DIR/deployed.tmp"
    mv "$TRIGGER_DIR/deployed.tmp" "$TRIGGER_DIR/deployed"

    if [[ $install == 1 ]]; then
        systemctl --user start handbook.service
    elif [[ $restart == 1 ]]; then
        echo "Restarting handbook.service"
        systemctl --user restart --no-block handbook.service
    fi
}

main "$@"
exit
