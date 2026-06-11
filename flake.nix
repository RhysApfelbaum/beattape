{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=8c29968b3a942f2903f90797f9623737c215737c";

    # rust-overlay = {
    #   url = "github:oxalica/rust-overlay";
    #   inputs.nixpkgs.follows = "nixpkgs";
    # };
  };

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      # overlays = [ (import rust-overlay) ];
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          bun
          # (rust-bin.fromRustupToolchainFile ./wasm/rust-toolchain.toml)
          # wasm-pack
          # wasm-tools
          # llvmPackages.lld
        ];
      };
    };
}
