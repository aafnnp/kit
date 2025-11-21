## Migration Tasks

- [x] Audit current Tauri usage and build setup
- [x] Define Electron migration plan and steps
  - [x] Choose Electron tooling (electron-builder vs forge vs electron-vite)
  - [x] Outline main/preload process responsibilities
  - [x] Map Tauri plugins to Electron equivalents
  - [x] Plan build/dev scripts and CI updates
- [x] Execute Electron migration tasks incrementally
  - [x] Add Electron deps/scripts & builder config
  - [x] Implement main/preload bridge & shared typings
  - [x] Adapt renderer (desktop API usage & fallbacks)
  - [x] Clean up remaining Tauri references when Electron stable
  - [x] Update .gitignore to exclude electron/dist-electron
  - [x] Fix preload path resolution for dev and production
  - [x] Configure electron-builder.yml for all platforms

## Next Steps

- [x] Test Electron development environment: `npm run electron:dev`
- [ ] Test Electron production build: `npm run electron:build`
- [ ] Verify all features work in Electron:
  - [ ] External link opening
  - [ ] Update checking and installation
  - [ ] App relaunch
  - [ ] Ads not showing in desktop app
- [ ] Configure icons for all platforms (Windows, macOS, Linux)
- [ ] Update CI/CD pipelines to build Electron apps
- [x] Update documentation with Electron setup instructions
