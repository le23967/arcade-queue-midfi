import { Component } from 'react'

/* A render error used to blank the entire prototype, because React unmounts
   the tree and there is nothing left on screen to explain why. That is a bad
   failure mode for something demoed live in a critique: the screen just goes
   white and the session stops.

   This keeps the failure inside the frame and names the screen that broke, so
   a crash costs one sentence instead of the whole demo. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(prevProps) {
    /* Moving to another screen clears the error, so one broken screen does not
       trap the prototype. */
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex h-full flex-col items-center justify-center bg-white p-6 text-center">
        <p className="text-base font-semibold text-gray-900">
          This screen didn&rsquo;t load
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Pick another tab to carry on.
        </p>
        <pre className="mt-4 max-h-32 w-full overflow-auto rounded-md border border-gray-300 bg-gray-100 p-2 text-left text-[11px] leading-relaxed text-gray-700">
          {String(this.state.error?.message ?? this.state.error)}
        </pre>
      </div>
    )
  }
}
