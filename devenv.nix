{ pkgs, lib, config, inputs, ... }:

let
  pkgs-unstable =
    import inputs.nixpkgs-unstable { system = pkgs.stdenv.system; };
in {
  # https://devenv.sh/basics/
  env.GREET = "devenv";

  # https://devenv.sh/packages/
  packages = with pkgs; [
    git
    tailwindcss-language-server
    ffmpeg
    python3
  ];

  languages.javascript = {
    enable = true;
    bun.enable = true;
    bun.package = pkgs-unstable.bun;
    npm.enable = true;
  };

}
