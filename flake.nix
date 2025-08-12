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
          src = pkgs.lib.cleanSourceWith {
            src = ./.;
            filter = path: type:
              baseNameOf path
              == "package.json"
              || baseNameOf path == "yarn.lock";
          };
        };

        frontend = pkgs.stdenv.mkDerivation {
          name = "frontend";
          src = pkgs.lib.cleanSourceWith {
            src = ./.;
            filter = path: type: let
              baseName = baseNameOf path;
            in
              pkgs.lib.hasSuffix ".pug" baseName
              || pkgs.lib.hasSuffix ".less" baseName
              || pkgs.lib.hasSuffix ".js" baseName
              || pkgs.lib.hasSuffix ".ttf" baseName
              || pkgs.lib.hasSuffix ".md" baseName
              || pkgs.lib.hasSuffix ".parcelrc" baseName
              || baseName == "package.json";
          };
          buildInputs = [pkgs.yarn node-modules];

          buildPhase = ''
            ln -s ${node-modules}/libexec/rgeometry.github.io/node_modules node_modules
            # The optimizer breaks one of the SVGs, so we disable it.
            ${pkgs.yarn}/bin/yarn parcel build --no-optimize index.pug
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

        # Apps
        apps = {
          serve = {
            type = "app";
            program = toString (pkgs.writeShellScript "serve-frontend" ''
              set -euo pipefail
              echo "Starting development server..."
              ${pkgs.yarn}/bin/yarn install
              exec ${pkgs.yarn}/bin/yarn parcel serve index.pug
            '');
          };
        };
      }
    );
}
