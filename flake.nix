{
  description = "RGeometry website";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};

        node-modules = pkgs.mkYarnPackage {
          name = "node-modules";
          src = ./.;
        };

        frontend = pkgs.stdenv.mkDerivation {
          name = "frontend";
          src = ./.;
          buildInputs = [pkgs.yarn node-modules];

          buildPhase = ''
            ln -s ${node-modules}/libexec/rgeometry.github.io/node_modules node_modules
            yarn parcel build index.pug
          '';

          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/
          '';
        };
      in {
        # Packages
        packages = {
          node-modules = node-modules;
          # Default package
          default = frontend;
        };
      }
    );
}
