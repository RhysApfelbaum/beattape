{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url =
      "github:nixos/nixpkgs?ref=8c29968b3a942f2903f90797f9623737c215737c";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [ bun cargo rustc wasm-pack llvmPackages.lld ];
      };
    };
}
