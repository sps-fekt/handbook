#!/usr/bin/env bash
# Deploys the handbook: brings ~/repo up to date with main on GitHub and applies
# what changed. Run as the handbook user by handbook-deploy.service (on every
# push through the webhook, and by a timer), or by hand, also for the first setup.
#
#   deploy.sh            deploy
#   deploy.sh --rebuild  also update the Node base image (security updates)
#
# - The image is rebuilt when what it's built from changed, which is everything
#   but content/ (the site reads pages from GitHub) and the files below.
# - The Quadlet, the systemd units and config/ are installed, and the site
#   restarted, when any of them changed since the last run.
# A failed run is retried in full by the next one.
set -euo pipefail

IMAGE=localhost/handbook:latest
LABEL=org.opencontainers.image.revision
# Mounted into the container: "requested" is written by the webhook, "deployed"
# (the commit running) is shown in the footer, "setup" is a checksum of what was
# last installed.
STATE="$HOME/.local/state/handbook-deploy"

# In a function, so bash has read the whole script before git replaces it.
main() {
    [[ $# == 0 || $1 == --rebuild ]] || { echo "Usage: deploy.sh [--rebuild]" >&2; return 2; }
    cd "$(dirname "$0")/.."
    install -d -m 0777 "$STATE"  # 0777: the container's user is another uid
    rm -f "$STATE/requested"     # a push during this run writes it again

    # A checkout, not a merge, so the clone follows GitHub after a force push too.
    git fetch --quiet origin main
    git checkout --quiet --force -B main origin/main

    local code built setup pull=missing restart=0
    # The last commit that changed what the image is built from.
    code="$(git log -1 --format=%H -- . ':!content' ':!config' ':!deploy' ':!.github' ':!*.md' ':!handbook.quadlets')"
    built="$(podman image inspect --format "{{index .Config.Labels \"$LABEL\"}}" "$IMAGE" 2>/dev/null || true)"
    if [[ $code != "$built" || $# == 1 ]]; then
        echo "Building ${code:0:7}"
        [[ $# == 1 ]] && pull=newer
        # The build stage is tagged, so the prune keeps its cache (npm ci).
        podman build --pull=$pull --target build -t localhost/handbook-build .
        podman build --pull=$pull --label "$LABEL=$code" -t "$IMAGE" .
        podman image prune --force >/dev/null
        restart=1
    fi

    setup="$(cat handbook.quadlets config/* deploy/*.service deploy/*.timer deploy/*.path | sha256sum)"
    if [[ $setup != "$(cat "$STATE/setup" 2>/dev/null)" ]]; then
        echo "Installing the Quadlet and the systemd units"
        podman quadlet install --replace handbook.quadlets
        install -m 0644 -D -t ~/.config/systemd/user deploy/*.service deploy/*.timer deploy/*.path
        systemctl --user daemon-reload
        systemctl --user enable --now handbook-deploy.timer handbook-deploy.path
        restart=1
    fi

    if [[ $restart == 1 ]]; then
        echo "Restarting the site"
        systemctl --user restart --no-block handbook.service
        echo "$setup" >"$STATE/setup"
    fi
    git rev-parse HEAD >"$STATE/deployed"
}

main "$@"
exit
