import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link, useRouteError } from 'react-router-dom'
import { isStaleChunkError, reloadForNewBuild } from '../lib/staleBuild'

type Props = {
  children: ReactNode
  title?: string
  homeTo?: string
}

type State = {
  error: Error | null
}

/** Catches render errors so a route shows a message instead of a blank screen. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Site was updated while this tab was open: reload to get the new version.
    if (isStaleChunkError(error) && reloadForNewBuild()) return
    console.error('[RouteErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      const homeTo = this.props.homeTo || '/'
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-sm p-8 space-y-4">
            <h2 className="text-xl font-black text-gray-900">
              {this.props.title || 'This page could not be displayed'}
            </h2>
            <p className="text-sm text-gray-600">
              {isStaleChunkError(this.state.error)
                ? 'The website was updated while this page was open. Reload the page to get the latest version.'
                : 'A rendering error occurred. This is often caused by a hooks mismatch after navigation, or unexpected data from the API.'}
            </p>
            <p className="text-xs font-mono text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 break-all">
              {this.state.error.message}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold hover:bg-[#400466]"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 border-2 border-gray-300 text-gray-800 rounded-lg font-bold hover:bg-gray-50"
              >
                Reload page
              </button>
              <Link
                to={homeTo}
                className="px-4 py-2 text-[#5a0a8f] font-bold hover:underline inline-flex items-center"
              >
                Go back
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/** Router errorElement: same message + auto-reload for a stale build. */
export function RouteError() {
  const error = useRouteError() as Error
  if (isStaleChunkError(error)) reloadForNewBuild()
  return <RouteErrorBoundaryView error={error} />
}

function Thrower({ error }: { error: Error }): never {
  throw error
}

// Reuse the boundary's fallback UI by rendering it in its error state.
function RouteErrorBoundaryView({ error }: { error: Error }) {
  return (
    <RouteErrorBoundary>
      <Thrower error={error} />
    </RouteErrorBoundary>
  )
}
