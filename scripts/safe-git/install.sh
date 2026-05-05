#!/usr/bin/env bash
# scripts/safe-git/install.sh — install the safe-git wrapper + hook.
#
# Idempotent: refuses to overwrite without --force.
# Run from anywhere: ./scripts/safe-git/install.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

WRAPPER_SRC="$SCRIPT_DIR/bin-git"
WRAPPER_DST="$HOME/bin/git"
HOOK_SRC="$SCRIPT_DIR/hooks/post-checkout"
HOOK_DST="$REPO_ROOT/.git/hooks/post-checkout"

force=0
for arg in "$@"; do
  [ "$arg" = "--force" ] && force=1
done

install_file() {
  local src=$1 dst=$2 label=$3
  mkdir -p "$(dirname "$dst")"
  if [ -e "$dst" ] && [ "$force" -eq 0 ]; then
    if cmp -s "$src" "$dst"; then
      echo "✓ $label already up to date: $dst"
      return 0
    fi
    echo "⚠ $label exists and differs: $dst"
    echo "  Use --force to overwrite, or diff yourself: diff $src $dst"
    return 1
  fi
  cp "$src" "$dst"
  chmod +x "$dst"
  echo "✓ $label installed: $dst"
}

echo "Installing safe-git protection..."
install_file "$WRAPPER_SRC" "$WRAPPER_DST" "Wrapper"
install_file "$HOOK_SRC"    "$HOOK_DST"    "Hook"

# PATH check
if ! echo "$PATH" | tr ':' '\n' | grep -q "^$HOME/bin\$"; then
  echo "⚠ ~/bin is not in PATH. Add this to ~/.bashrc:"
  echo "    export PATH=\"\$HOME/bin:\$PATH\""
fi

# PATH-order check (~/bin must come before /usr/bin)
home_bin_pos=$(echo "$PATH" | tr ':' '\n' | grep -nFx "$HOME/bin" | head -1 | cut -d: -f1)
usr_bin_pos=$(echo "$PATH" | tr ':' '\n' | grep -nFx "/usr/bin" | head -1 | cut -d: -f1)
if [ -n "$home_bin_pos" ] && [ -n "$usr_bin_pos" ] && [ "$home_bin_pos" -ge "$usr_bin_pos" ]; then
  echo "⚠ ~/bin (pos $home_bin_pos) is AFTER /usr/bin (pos $usr_bin_pos) in PATH."
  echo "  The wrapper will NOT intercept git calls. Move ~/bin earlier in PATH."
fi

echo ""
echo "Done. Verify with:"
echo "  which git           # should print: $WRAPPER_DST"
echo "  git stash -u        # should print: ❌ Blocked"
