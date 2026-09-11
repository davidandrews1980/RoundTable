/* eslint-disable */

// @ts-nocheck

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as KeysRouteImport } from './routes/keys'
import { Route as LoginRouteImport } from './routes/login'
import { Route as RoundtableRouteImport } from './routes/roundtable'
import { Route as RoundtableIdRouteImport } from './routes/roundtable.$id'
import { Route as ApiAuthSplatRouteImport } from './routes/api/auth/$'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const KeysRoute = KeysRouteImport.update({
  id: '/keys',
  path: '/keys',
  getParentRoute: () => rootRouteImport,
} as any)
const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any)
const RoundtableRoute = RoundtableRouteImport.update({
  id: '/roundtable',
  path: '/roundtable',
  getParentRoute: () => rootRouteImport,
} as any)
const RoundtableIdRoute = RoundtableIdRouteImport.update({
  id: '/$id',
  path: '/$id',
  getParentRoute: () => RoundtableRoute,
} as any)
const ApiAuthSplatRoute = ApiAuthSplatRouteImport.update({
  id: '/api/auth/$',
  path: '/api/auth/$',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/keys': typeof KeysRoute
  '/login': typeof LoginRoute
  '/roundtable': typeof RoundtableRouteWithChildren
  '/roundtable/$id': typeof RoundtableIdRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/keys': typeof KeysRoute
  '/login': typeof LoginRoute
  '/roundtable': typeof RoundtableRouteWithChildren
  '/roundtable/$id': typeof RoundtableIdRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/keys': typeof KeysRoute
  '/login': typeof LoginRoute
  '/roundtable': typeof RoundtableRouteWithChildren
  '/roundtable/$id': typeof RoundtableIdRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/keys'
    | '/login'
    | '/roundtable'
    | '/roundtable/$id'
    | '/api/auth/$'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/keys'
    | '/login'
    | '/roundtable'
    | '/roundtable/$id'
    | '/api/auth/$'
  id:
    | '__root__'
    | '/'
    | '/keys'
    | '/login'
    | '/roundtable'
    | '/roundtable/$id'
    | '/api/auth/$'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  KeysRoute: typeof KeysRoute
  LoginRoute: typeof LoginRoute
  RoundtableRoute: typeof RoundtableRouteWithChildren
  ApiAuthSplatRoute: typeof ApiAuthSplatRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/keys': {
      id: '/keys'
      path: '/keys'
      fullPath: '/keys'
      preLoaderRoute: typeof KeysRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/roundtable': {
      id: '/roundtable'
      path: '/roundtable'
      fullPath: '/roundtable'
      preLoaderRoute: typeof RoundtableRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/roundtable/$id': {
      id: '/roundtable/$id'
      path: '/$id'
      fullPath: '/roundtable/$id'
      preLoaderRoute: typeof RoundtableIdRouteImport
      parentRoute: typeof RoundtableRoute
    }
    '/api/auth/$': {
      id: '/api/auth/$'
      path: '/api/auth/$'
      fullPath: '/api/auth/$'
      preLoaderRoute: typeof ApiAuthSplatRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

interface RoundtableRouteChildren {
  RoundtableIdRoute: typeof RoundtableIdRoute
}

const RoundtableRouteChildren: RoundtableRouteChildren = {
  RoundtableIdRoute: RoundtableIdRoute,
}

const RoundtableRouteWithChildren = RoundtableRoute._addFileChildren(
  RoundtableRouteChildren,
)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  KeysRoute: KeysRoute,
  LoginRoute: LoginRoute,
  RoundtableRoute: RoundtableRouteWithChildren,
  ApiAuthSplatRoute: ApiAuthSplatRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
