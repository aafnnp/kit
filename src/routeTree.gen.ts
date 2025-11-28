import { Route as rootRouteImport } from "./routes/__root"
import { Route as IndexRouteImport } from "./routes/index"
import { Route as ToolToolRouteImport } from "./routes/tool.$tool"

const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
} as any)
const ToolToolRoute = ToolToolRouteImport.update({
  id: "/tool/$tool",
  path: "/tool/$tool",
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute
  "/tool/$tool": typeof ToolToolRoute
}
export interface FileRoutesByTo {
  "/": typeof IndexRoute
  "/tool/$tool": typeof ToolToolRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  "/": typeof IndexRoute
  "/tool/$tool": typeof ToolToolRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: "/" | "/tool/$tool"
  fileRoutesByTo: FileRoutesByTo
  to: "/" | "/tool/$tool"
  id: "__root__" | "/" | "/tool/$tool"
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ToolToolRoute: typeof ToolToolRoute
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      id: "/"
      path: "/"
      fullPath: "/"
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    "/tool/$tool": {
      id: "/tool/$tool"
      path: "/tool/$tool"
      fullPath: "/tool/$tool"
      preLoaderRoute: typeof ToolToolRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ToolToolRoute: ToolToolRoute,
}
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
