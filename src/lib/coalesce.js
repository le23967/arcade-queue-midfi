/* One refetch at a time.

   A burst of change notices - your own follow, the trigger's notice about
   it, the other person's follow-back a second later - should not fan out
   into overlapping fetches that finish out of order and leave the older
   result on screen. This runs `work` once, remembers that more was asked
   for while it ran, and runs it once more afterwards. Callers get a promise
   that settles when the graph is as fresh as the last request. */
export function createCoalescedRefresh(work) {
  let inflight = null
  let again = false

  return function refresh() {
    if (inflight) {
      again = true
      return inflight
    }
    inflight = (async () => {
      try {
        do {
          again = false
          await work()
        } while (again)
      } finally {
        inflight = null
      }
    })()
    return inflight
  }
}
